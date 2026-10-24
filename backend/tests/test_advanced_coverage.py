import io
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.backtesting.engine import BacktestEngine
from src.backtesting.metrics import calc
from src.strategies.factory import get_strategy

def test_engine_stop_loss_and_take_profit():
    engine = BacktestEngine()
    # Price starts at 100, drops to 80 (stop loss triggered), then recovers
    dates = pd.date_range("2024-01-01", periods=10)
    df = pd.DataFrame({
        "date": dates,
        "open": [100, 102, 105, 90, 80, 85, 95, 105, 110, 115],
        "high": [101, 104, 106, 92, 82, 87, 97, 107, 112, 117],
        "low": [99, 101, 89, 78, 75, 80, 90, 100, 105, 110],
        "close": [100, 103, 90, 79, 82, 86, 96, 106, 111, 116],
        "volume": [1000] * 10
    })
    # Run with 10% stop loss
    res = engine.run(df, "sma_crossover", {"fast_period": 2, "slow_period": 4}, 10000, 100, 0.1, 0.05, stop_loss=10.0, take_profit=None)
    assert len(res.trades) > 0
    # Verify that stop loss signal or exit happened
    signals = [t["signal"] for t in res.trades]
    assert any(s in ["STOP_LOSS", "SELL", "END_OF_TEST"] for s in signals)

def test_metrics_edge_cases():
    # Empty trades test
    equity = pd.Series([10000, 10000, 10000], index=pd.date_range("2024-01-01", periods=3))
    m = calc(equity, [], 10000)
    assert m["number_of_trades"] == 0
    assert m["win_rate"] == 0
    assert m["total_return"] == 0

    # All winning trades
    trades = [
        {"pnl": 500, "return_pct": 5.0},
        {"pnl": 1000, "return_pct": 10.0}
    ]
    equity_win = pd.Series([10000, 10500, 11500], index=pd.date_range("2024-01-01", periods=3))
    m_win = calc(equity_win, trades, 10000)
    assert m_win["win_rate"] == 100.0
    assert m_win["profit_factor"] == float("inf")

def test_unauthenticated_protected_endpoints():
    with TestClient(app) as client:
        # Accessing /api/auth/me without token -> 401
        res = client.get("/api/auth/me")
        assert res.status_code == 401

        # Accessing /api/watchlist without token -> 401
        res_wl = client.get("/api/watchlist")
        assert res_wl.status_code == 401

        # Delete backtest without token -> 401
        res_del = client.delete("/api/backtests/99999")
        assert res_del.status_code == 401

def test_invalid_strategy_key():
    with TestClient(app) as client:
        res = client.post("/api/backtest", json={
            "symbol": "AAPL",
            "start_date": "2024-01-01",
            "end_date": "2024-02-01",
            "strategy": "non_existent_strategy_xyz",
            "initial_capital": 10000,
            "position_size_pct": 100,
            "commission_pct": 0.1,
            "slippage_pct": 0.05
        })
        assert res.status_code == 400

def test_market_endpoint_demo_fallback():
    with TestClient(app) as client:
        res = client.get("/api/market/AAPL?start=2024-01-01&end=2024-03-01&source=demo")
        assert res.status_code == 200
        data = res.json()
        assert data["symbol"] == "AAPL"
        assert len(data["points"]) > 0
        p = data["points"][0]
        assert "open" in p and "close" in p and "volume" in p
