import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database.session import SessionLocal, init_db
from src.models.entities import User, EmailOTP
from src.services.auth_service import hash_password, verify_password, create_access_token, decode_access_token

@pytest.fixture(autouse=True)
def setup_database():
    init_db()
    db = SessionLocal()
    try:
        # Clean up test users
        test_emails = ["testuser@example.com", "resetuser@example.com", "unverified@example.com"]
        for email in test_emails:
            db.query(EmailOTP).filter(EmailOTP.email == email).delete()
            db.query(User).filter(User.email == email).delete()
        db.commit()
    finally:
        db.close()

def test_password_hashing():
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_creation_and_decoding():
    payload = {"sub": 42, "email": "test@example.com"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == 42
    assert decoded["email"] == "test@example.com"
    assert "exp" in decoded

def test_registration_and_otp_verification():
    with TestClient(app) as client:
        # 1. Register new account
        r = client.post("/api/auth/register", json={
            "email": "testuser@example.com",
            "password": "Password123!",
            "display_name": "Test Trader"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "debug_code" in data
        otp_code = data["debug_code"]
        assert len(otp_code) == 6

        # 2. Try login before verification -> should fail with 403
        login_fail = client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "Password123!"
        })
        assert login_fail.status_code == 403

        # 3. Verify OTP
        verify_res = client.post("/api/auth/verify-otp", json={
            "email": "testuser@example.com",
            "code": otp_code,
            "purpose": "registration"
        })
        assert verify_res.status_code == 200
        auth_data = verify_res.json()
        assert "token" in auth_data
        assert auth_data["user"]["is_verified"] is True
        token = auth_data["token"]

        # 4. Access protected profile
        me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "testuser@example.com"

        # 5. OTP cannot be reused (single-use)
        reuse_res = client.post("/api/auth/verify-otp", json={
            "email": "testuser@example.com",
            "code": otp_code,
            "purpose": "registration"
        })
        assert reuse_res.status_code == 400

def test_resend_otp_cooldown():
    with TestClient(app) as client:
        client.post("/api/auth/register", json={
            "email": "testuser@example.com",
            "password": "Password123!",
            "display_name": "Test Trader"
        })
        # Immediate resend should trigger cooldown 429
        resend_res = client.post("/api/auth/resend-otp", json={
            "email": "testuser@example.com",
            "purpose": "registration"
        })
        assert resend_res.status_code == 429
        assert "cooldown" in resend_res.json()["detail"].lower() or "wait" in resend_res.json()["detail"].lower()

def test_password_reset_flow():
    with TestClient(app) as client:
        # Create and verify user
        reg = client.post("/api/auth/register", json={
            "email": "resetuser@example.com",
            "password": "OldPassword123!",
            "display_name": "Reset User"
        })
        code = reg.json()["debug_code"]
        client.post("/api/auth/verify-otp", json={
            "email": "resetuser@example.com",
            "code": code,
            "purpose": "registration"
        })

        # Request password reset
        forgot_res = client.post("/api/auth/forgot-password", json={
            "email": "resetuser@example.com"
        })
        assert forgot_res.status_code == 200
        reset_code = forgot_res.json().get("debug_code")
        assert reset_code is not None

        # Reset password
        reset_res = client.post("/api/auth/reset-password", json={
            "email": "resetuser@example.com",
            "code": reset_code,
            "new_password": "NewSecurePassword456!"
        })
        assert reset_res.status_code == 200

        # Login with old password fails
        old_login = client.post("/api/auth/login", json={
            "email": "resetuser@example.com",
            "password": "OldPassword123!"
        })
        assert old_login.status_code == 401

        # Login with new password succeeds
        new_login = client.post("/api/auth/login", json={
            "email": "resetuser@example.com",
            "password": "NewSecurePassword456!"
        })
        assert new_login.status_code == 200
        assert "token" in new_login.json()

def test_profile_update_and_change_password():
    with TestClient(app) as client:
        reg = client.post("/api/auth/register", json={
            "email": "testuser@example.com",
            "password": "Password123!",
            "display_name": "Trader One"
        })
        code = reg.json()["debug_code"]
        v = client.post("/api/auth/verify-otp", json={
            "email": "testuser@example.com",
            "code": code,
            "purpose": "registration"
        })
        token = v.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Update profile
        up = client.put("/api/auth/profile", json={"display_name": "Quant Master"}, headers=headers)
        assert up.status_code == 200
        assert up.json()["display_name"] == "Quant Master"

        # Change password
        ch = client.post("/api/auth/change-password", json={
            "current_password": "Password123!",
            "new_password": "UpdatedPassword999!"
        }, headers=headers)
        assert ch.status_code == 200

        # Logout
        lo = client.post("/api/auth/logout")
        assert lo.status_code == 200
