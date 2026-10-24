from src.models.entities import Backtest, Trade, PerformanceMetric
from src.data.market_data import MarketDataService
from src.backtesting.engine import BacktestEngine
from src.strategies.factory import get_strategy

class BacktestService:
    def __init__(self):
        self.market = MarketDataService()
        self.engine = BacktestEngine()

    def run(self, req, db, persist=True, user_id=None):
        s = get_strategy(req.strategy)
        df, source = self.market.get_history(req.symbol, req.start_date, req.end_date, req.data_source)
        if len(df) < 2:
            raise ValueError("Not enough historical data.")
        result = self.engine.run(
            df,
            req.strategy,
            s.validate(req.strategy_params),
            req.initial_capital,
            req.position_size_pct,
            req.commission_pct,
            req.slippage_pct,
            req.stop_loss_pct,
            req.take_profit_pct,
            req.long_only,
        )
        if persist:
            rec = Backtest(
                user_id=user_id,
                name=req.name,
                symbol=req.symbol,
                strategy_key=req.strategy,
                start_date=str(req.start_date),
                end_date=str(req.end_date),
                initial_capital=req.initial_capital,
                config=req.model_dump(mode="json"),
                data_source=source,
            )
            db.add(rec)
            db.flush()
            for t in result.trades:
                db.add(Trade(backtest_id=rec.id, symbol=req.symbol, **t))
            for k, v in result.metrics.items():
                if v != float("inf") and v != float("-inf") and not (isinstance(v, float) and v != v):  # avoid NaN or Inf
                    db.add(PerformanceMetric(backtest_id=rec.id, metric_name=k, metric_value=v))
            db.commit()
            return rec, result, df
        return None, result, df
