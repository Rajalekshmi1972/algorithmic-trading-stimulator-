import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database.session import SessionLocal, init_db
from src.models.entities import User, Watchlist, Backtest, EmailOTP

@pytest.fixture(autouse=True)
def setup_data():
    init_db()
    db = SessionLocal()
    try:
        db.query(Watchlist).delete()
        test_emails = ["wl_user@example.com", "bt_user@example.com", "other@example.com"]
        db.query(EmailOTP).filter(EmailOTP.email.in_(test_emails)).delete()
        db.query(User).filter(User.email.in_(test_emails)).delete()
        db.commit()
    finally:
        db.close()

def get_auth_token(client, email="wl_user@example.com"):
    login_res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    if login_res.status_code == 200:
        return login_res.json()["token"]

    reg = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "display_name": "WL User"
    })
    data = reg.json()
    code = data.get("debug_code")
    res = client.post("/api/auth/verify-otp", json={
        "email": email,
        "code": code,
        "purpose": "registration"
    })
    return res.json()["token"]

def test_watchlist_lifecycle():
    with TestClient(app) as client:
        token = get_auth_token(client, "wl_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Add symbol to watchlist
        add_res = client.post("/api/watchlist", json={"symbol": "NVDA", "notes": "AI leader"}, headers=headers)
        assert add_res.status_code == 200
        assert add_res.json()["symbol"] == "NVDA"
        assert add_res.json()["notes"] == "AI leader"

        # 2. Get watchlist
        list_res = client.get("/api/watchlist", headers=headers)
        assert list_res.status_code == 200
        symbols = [x["symbol"] for x in list_res.json()]
        assert "NVDA" in symbols

        # 3. Remove symbol from watchlist
        del_res = client.delete("/api/watchlist/NVDA", headers=headers)
        assert del_res.status_code == 200

        # Verify removal
        list_res2 = client.get("/api/watchlist", headers=headers)
        symbols2 = [x["symbol"] for x in list_res2.json()]
        assert "NVDA" not in symbols2

def test_backtest_authenticated_and_delete():
    with TestClient(app) as client:
        token = get_auth_token(client, "bt_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Run backtest as authenticated user
        bt_res = client.post("/api/backtest", json={
            "symbol": "AAPL",
            "start_date": "2024-01-01",
            "end_date": "2024-03-01",
            "strategy": "sma_crossover",
            "strategy_params": {"fast_period": 5, "slow_period": 15},
            "initial_capital": 50000,
            "position_size_pct": 100,
            "commission_pct": 0.1,
            "slippage_pct": 0.05,
            "data_source": "demo"
        }, headers=headers)
        assert bt_res.status_code == 200
        bt_id = bt_res.json()["id"]
        assert bt_id is not None

        # Export CSV
        csv_res = client.get(f"/api/backtests/{bt_id}/export")
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers.get("content-type", "")
        assert "Trade ID" in csv_res.text

        # Delete backtest as owner
        del_res = client.delete(f"/api/backtests/{bt_id}", headers=headers)
        assert del_res.status_code == 200

        # Verify backtest is deleted
        get_res = client.get(f"/api/backtests/{bt_id}")
        assert get_res.status_code == 404

def test_strategy_compare_endpoint():
    with TestClient(app) as client:
        res = client.post("/api/compare", json={
            "symbol": "AAPL",
            "start_date": "2024-01-01",
            "end_date": "2024-03-01",
            "strategies": [
                {"strategy": "sma_crossover", "strategy_params": {"fast_period": 5, "slow_period": 15}},
                {"strategy": "rsi", "strategy_params": {"rsi_period": 14, "oversold": 30, "overbought": 70}}
            ],
            "initial_capital": 100000,
            "position_size_pct": 100,
            "commission_pct": 0.1,
            "slippage_pct": 0.05
        })
        assert res.status_code == 200
        data = res.json()
        assert "results" in data
        assert len(data["results"]) == 2
        for r in data["results"]:
            assert "metrics" in r
            assert "sharpe_ratio" in r["metrics"]
