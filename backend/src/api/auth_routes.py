import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.models.entities import User
from src.schemas.api import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResendOtpRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserOut,
    VerifyOtpRequest,
)
from src.services.auth_service import (
    create_access_token,
    create_and_send_otp,
    get_current_user,
    hash_password,
    verify_otp_code,
    verify_password,
)
from src.services.email_service import email_service

logger = logging.getLogger("algotradex.api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="An account with this email already exists.")
        # User registered previously but did not complete verification: update details
        existing.password_hash = hash_password(req.password)
        existing.display_name = req.display_name
        db.commit()
    else:
        new_user = User(
            email=req.email,
            password_hash=hash_password(req.password),
            display_name=req.display_name,
            is_verified=False,
        )
        db.add(new_user)
        db.commit()

    code, delivered, cooldown_err = create_and_send_otp(db, req.email, purpose="registration")
    if cooldown_err:
        raise HTTPException(status_code=429, detail=cooldown_err)

    return {
        "status": "ok",
        "message": "Registration successful. Please verify the 6-digit code sent to your email.",
        "email": req.email,
        "email_delivered": delivered,
        # In test / dev environments without live SMTP, provide the debug_code
        "debug_code": code if not delivered else None,
    }

@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    success, msg = verify_otp_code(db, req.email, req.code, purpose=req.purpose)
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if req.purpose == "registration":
        user.is_verified = True
        db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(token=token, user=UserOut.model_validate(user), message="Verification complete.")

@router.post("/resend-otp")
def resend_otp(req: ResendOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email address.")

    code, delivered, cooldown_err = create_and_send_otp(db, req.email, purpose=req.purpose)
    if cooldown_err:
        raise HTTPException(status_code=429, detail=cooldown_err)

    return {
        "status": "ok",
        "message": "A new single-use verification code has been dispatched.",
        "email": req.email,
        "email_delivered": delivered,
        "debug_code": code if not delivered else None,
    }

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not user.is_verified:
        # Dispatch a fresh verification code and inform client
        code, delivered, _ = create_and_send_otp(db, user.email, purpose="registration")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Account email is unverified. A verification code has been sent to your email.",
                "requires_verification": True,
                "email": user.email,
                "debug_code": code if not delivered else None,
            },
        )

    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(token=token, user=UserOut.model_validate(user), message="Login successful.")

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Avoid user enumeration in public responses
        return {"status": "ok", "message": "If an account exists, a password reset code has been sent."}

    code, delivered, cooldown_err = create_and_send_otp(db, req.email, purpose="password_reset")
    if cooldown_err:
        raise HTTPException(status_code=429, detail=cooldown_err)

    return {
        "status": "ok",
        "message": "A 6-digit password reset code has been sent to your email.",
        "email": req.email,
        "email_delivered": delivered,
        "debug_code": code if not delivered else None,
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    success, msg = verify_otp_code(db, req.email, req.code, purpose="password_reset")
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    user.password_hash = hash_password(req.new_password)
    user.is_verified = True
    db.commit()

    return {"status": "ok", "message": "Your password has been successfully reset. You may now log in."}

@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)

@router.put("/profile", response_model=UserOut)
def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.display_name = req.display_name.strip()
    db.commit()
    return UserOut.model_validate(user)

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"status": "ok", "message": "Password successfully changed."}

@router.post("/logout")
def logout():
    return {"status": "ok", "message": "Logged out successfully."}
