from datetime import date, timedelta
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database.session import SessionLocal, init_db
from src.models.entities import User, EmailOTP
from src.strategies.implementations import Bollinger, Momentum, SMA, RSI, MACD
from src.backtesting.metrics import calc
from src.schemas.api import BacktestRequest
from src.config import get_settings

def sample_df():
    c = [100 + i * 0.5 for i in range(50)]
    return pd.DataFrame({
        "close": c,
        "open": c,
        "high": [x + 1 for x in c],
        "low": [x - 1 for x in c],
        "volume": [1000] * len(c),
        "date": pd.date_range("2024-01-01", periods=len(c)),
    })

def test_bollinger_signals():
    b = Bollinger()
    df = sample_df()
    signals = b.generate_signals(df, {"period": 10, "std_multiplier": 2.0})
    assert len(signals) == len(df)

def test_bollinger_validation():
    b = Bollinger()
    with pytest.raises(ValueError):
        b.validate({"period": -5, "std_multiplier": 2.0})

def test_momentum_signals():
    m = Momentum()
    df = sample_df()
    signals = m.generate_signals(df, {"lookback": 5, "threshold_pct": 2.0})
    assert len(signals) == len(df)

def test_momentum_validation():
    m = Momentum()
    with pytest.raises(ValueError):
        m.validate({"lookback": 0})

def test_sma_validation_fast_greater_than_slow():
    s = SMA()
    with pytest.raises(ValueError):
        s.validate({"fast_period": 50, "slow_period": 20})

def test_rsi_validation_oversold_greater_than_overbought():
    r = RSI()
    with pytest.raises(ValueError):
        r.validate({"rsi_period": 14, "oversold": 80, "overbought": 20})

def test_backtest_request_dates_validation():
    with pytest.raises(ValueError):
        BacktestRequest(
            symbol="AAPL",
            start_date=date(2024, 5, 1),
            end_date=date(2024, 1, 1),
            strategy="sma_crossover",
            initial_capital=10000,
            position_size_pct=100,
            commission_pct=0.1,
            slippage_pct=0.05,
        )

def test_backtest_request_symbol_normalization():
    req = BacktestRequest(
        symbol="   msft   ",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 5, 1),
        strategy="sma_crossover",
        initial_capital=10000,
        position_size_pct=100,
        commission_pct=0.1,
        slippage_pct=0.05,
    )
    assert req.symbol == "MSFT"

def test_metrics_flat_equity_sharpe_zero():
    eq = pd.Series([10000] * 30, index=pd.date_range("2024-01-01", periods=30))
    m = calc(eq, [], 10000)
    assert m["sharpe_ratio"] == 0
    assert m["annualized_volatility"] == 0

def test_metrics_negative_cagr():
    eq = pd.Series([10000, 8000, 5000], index=pd.date_range("2024-01-01", periods=3))
    m = calc(eq, [{"pnl": -5000, "return_pct": -50.0}], 10000)
    assert m["total_return"] == -50.0
    assert m["cagr"] < 0

def test_metrics_zero_downside_sortino():
    eq = pd.Series([10000, 10500, 11000, 12000], index=pd.date_range("2024-01-01", periods=4))
    m = calc(eq, [{"pnl": 2000, "return_pct": 20.0}], 10000)
    assert m["max_drawdown"] == 0
    assert m["sortino_ratio"] == 0

def test_cors_origin_list():
    s = get_settings()
    origins = s.cors_origin_list
    assert isinstance(origins, list)
    assert any("5173" in x for x in origins)

def test_backtest_detail_not_found():
    with TestClient(app) as client:
        res = client.get("/api/backtests/99999999")
        assert res.status_code == 404

def test_backtest_trades_not_found():
    with TestClient(app) as client:
        res = client.get("/api/backtests/99999999/trades")
        assert res.status_code == 404

def test_export_not_found():
    with TestClient(app) as client:
        res = client.get("/api/backtests/99999999/export")
        assert res.status_code == 404

def test_otp_attempt_lockout():
    init_db()
    db = SessionLocal()
    try:
        from src.services.auth_service import create_and_send_otp, verify_otp_code
        email = "lockout_test@example.com"
        db.query(EmailOTP).filter(EmailOTP.email == email).delete()
        db.commit()

        code, _, _ = create_and_send_otp(db, email, purpose="registration")
        for _ in range(5):
            success, msg = verify_otp_code(db, email, "000000", purpose="registration")
            assert not success

        success, msg = verify_otp_code(db, email, code, purpose="registration")
        assert not success
        assert "too many" in msg.lower() or "invalidated" in msg.lower()
    finally:
        db.close()

def test_otp_expiry_check():
    init_db()
    db = SessionLocal()
    try:
        from src.services.auth_service import verify_otp_code
        from datetime import datetime
        email = "expired_test@example.com"
        db.query(EmailOTP).filter(EmailOTP.email == email).delete()
        expired_otp = EmailOTP(
            email=email,
            code="112233",
            purpose="registration",
            is_used=False,
            attempts=0,
            expires_at=datetime.utcnow() - timedelta(minutes=5),
            created_at=datetime.utcnow() - timedelta(minutes=15),
        )
        db.add(expired_otp)
        db.commit()

        success, msg = verify_otp_code(db, email, "112233", purpose="registration")
        assert not success
        assert "expired" in msg.lower()
    finally:
        db.close()

def test_watchlist_delete_not_found():
    with TestClient(app) as client:
        from tests.test_watchlist_and_features import get_auth_token
        token = get_auth_token(client, "wl_notfound@example.com")
        res = client.delete("/api/watchlist/NONEXISTENT999", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 404

def test_register_already_verified():
    with TestClient(app) as client:
        from tests.test_watchlist_and_features import get_auth_token
        email = "verified_already@example.com"
        get_auth_token(client, email)

        res = client.post("/api/auth/register", json={
            "email": email,
            "password": "Password123!",
            "display_name": "Duplicate"
        })
        assert res.status_code == 400
        assert "already exists" in res.json()["detail"].lower()

def test_login_invalid_password():
    with TestClient(app) as client:
        from tests.test_watchlist_and_features import get_auth_token
        email = "bad_pass@example.com"
        get_auth_token(client, email)

        res = client.post("/api/auth/login", json={
            "email": email,
            "password": "CompletelyWrongPassword!"
        })
        assert res.status_code == 401
