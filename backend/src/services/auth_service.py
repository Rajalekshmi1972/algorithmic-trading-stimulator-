import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.config import get_settings
from src.database.session import get_db
from src.models.entities import EmailOTP, User
from src.services.email_service import email_service

logger = logging.getLogger("algotradex.auth")
security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """PBKDF2-HMAC-SHA256 password hashing with 200,000 iterations."""
    salt = os.urandom(16)
    iterations = 200_000
    hash_bytes = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    salt_b64 = base64.b64encode(salt).decode("ascii")
    hash_b64 = base64.b64encode(hash_bytes).decode("ascii")
    return f"pbkdf2_sha256${iterations}${salt_b64}${hash_b64}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time verification of PBKDF2 hash."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = base64.b64decode(parts[2].encode("ascii"))
        expected_hash = base64.b64decode(parts[3].encode("ascii"))
        computed_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(expected_hash, computed_hash)
    except Exception:
        return False

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding and padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed HS256 JWT."""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.token_expire_minutes))
    to_encode.update({"exp": int(expire.timestamp())})

    header = json.dumps({"alg": "HS256", "typ": "JWT"}).encode("utf-8")
    payload = json.dumps(to_encode).encode("utf-8")

    header_b64 = _b64url_encode(header)
    payload_b64 = _b64url_encode(payload)
    message = f"{header_b64}.{payload_b64}".encode("utf-8")

    sig = hmac.new(settings.secret_key.encode("utf-8"), message, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)

    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[dict]:
    """Validates signature and expiration of HS256 JWT."""
    try:
        settings = get_settings()
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, sig_b64 = parts
        message = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(settings.secret_key.encode("utf-8"), message, hashlib.sha256).digest()
        provided_sig = _b64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        exp = payload.get("exp")
        if exp and exp < int(time.time()):
            return None

        return payload
    except Exception:
        return None

def generate_otp_code(length: int = 6) -> str:
    """Generates a cryptographically strong numeric OTP code."""
    return "".join(secrets.choice("0123456789") for _ in range(length))

def create_and_send_otp(db: Session, email: str, purpose: str = "registration") -> tuple[str, bool, Optional[str]]:
    """
    Creates an OTP with expiry, enforces cooldown, and delivers it.
    Returns: (otp_code, email_delivered_bool, error_message_if_cooldown)
    """
    settings = get_settings()
    email_clean = email.strip().lower()
    now = datetime.utcnow()

    # Enforce resend cooldown (60s)
    last_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == email_clean, EmailOTP.purpose == purpose)
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if last_otp:
        elapsed = (now - last_otp.created_at).total_seconds()
        if elapsed < settings.otp_resend_cooldown_seconds:
            remaining = int(settings.otp_resend_cooldown_seconds - elapsed)
            return "", False, f"Please wait {remaining} seconds before requesting a new code."

    # Invalidate older unused OTPs for this email and purpose
    db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.purpose == purpose,
        EmailOTP.is_used == False,
    ).update({"is_used": True})

    code = generate_otp_code(6)
    expires_at = now + timedelta(minutes=settings.otp_expire_minutes)

    otp_record = EmailOTP(
        email=email_clean,
        code=code,
        purpose=purpose,
        is_used=False,
        attempts=0,
        expires_at=expires_at,
        created_at=now,
    )
    db.add(otp_record)
    db.commit()

    # Deliver via email service
    delivered = email_service.send_otp(email_clean, code, purpose=purpose)
    return code, delivered, None

def verify_otp_code(db: Session, email: str, code: str, purpose: str = "registration") -> tuple[bool, str]:
    """
    Validates OTP with rate limiting on attempts, expiry check, and single-use enforcement.
    Returns (success_bool, status_message).
    """
    settings = get_settings()
    email_clean = email.strip().lower()
    code_clean = code.strip()
    now = datetime.utcnow()

    record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email_clean,
            EmailOTP.purpose == purpose,
            EmailOTP.is_used == False,
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not record:
        return False, "No valid verification code found. Please request a new code."

    if record.expires_at < now:
        record.is_used = True
        db.commit()
        return False, "Verification code has expired. Please request a new code."

    if record.attempts >= settings.otp_max_attempts:
        record.is_used = True
        db.commit()
        return False, "Too many failed attempts. Code has been invalidated. Please request a new code."

    record.attempts += 1

    if record.code != code_clean:
        db.commit()
        remaining = settings.otp_max_attempts - record.attempts
        return False, f"Invalid verification code. {remaining} attempt(s) remaining."

    # Mark as used (single-use)
    record.is_used = True
    db.commit()
    return True, "Code successfully verified."

def get_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency for protected endpoints requiring valid authenticated user."""
    if not cred or not cred.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(cred.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    return user

def get_optional_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """FastAPI dependency for endpoints that work for both guests and authenticated users."""
    if not cred or not cred.credentials:
        return None

    payload = decode_access_token(cred.credentials)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    return db.query(User).filter(User.id == user_id).first()
