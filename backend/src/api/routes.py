import csv
import io
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from src.api.auth_routes import router as auth_router
from src.data.market_data import MarketDataError
from src.database.session import get_db
from src.models.entities import Backtest, User, Watchlist
from src.schemas.api import (
    BacktestOut,
    BacktestRequest,
    CompareRequest,
    EquityOut,
    PointOut,
    TradeOut,
    WatchlistCreateRequest,
    WatchlistOut,
)
from src.services.auth_service import get_current_user, get_optional_user
from src.services.backtest_service import BacktestService
from src.strategies.implementations import STRATEGIES

router = APIRouter(prefix="/api")
router.include_router(auth_router)

service = BacktestService()

def pts(df):
    return [
        PointOut(
            date=x.date.strftime("%Y-%m-%d"),
            open=float(x.open),
            high=float(x.high),
            low=float(x.low),
            close=float(x.close),
            volume=float(x.volume or 0),
        )
        for x in df.itertuples()
    ]

def out(rec, r, df, req):
    eq = [
        EquityOut(
            date=d.strftime("%Y-%m-%d"),
            value=float(v),
            drawdown_pct=float((v / r.equity.cummax().loc[d] - 1) * 100),
        )
        for d, v in r.equity.items()
    ]
    ts = [TradeOut(id=None, symbol=req.symbol, **t) for t in r.trades]
    return BacktestOut(
        id=rec.id if rec else None,
        name=rec.name if rec else None,
        symbol=req.symbol,
        strategy=req.strategy,
        data_source=rec.data_source if rec else "COMPARE",
        metrics=r.metrics,
        trades=ts,
        equity=eq,
        prices=pts(df),
        signals=r.signals,
        config=req.model_dump(mode="json"),
        created_at=rec.created_at.isoformat() if rec else None,
    )

@router.get("/strategies")
def strategies():
    return [
        {
            "key": k,
            "name": s.name,
            "description": s.description,
            "default_params": s.default_params,
        }
        for k, s in STRATEGIES.items()
    ]

@router.get("/market/{symbol}", response_model=dict)
def market(symbol: str, start: date = Query(...), end: date = Query(...), source="auto"):
    try:
        df, label = service.market.get_history(symbol, start, end, source)
        return {
            "symbol": symbol.upper(),
            "data_source": label,
            "points": [x.model_dump() for x in pts(df)],
        }
    except MarketDataError as e:
        raise HTTPException(400, str(e))

@router.post("/backtest", response_model=BacktestOut)
def backtest(
    req: BacktestRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    try:
        user_id = user.id if user else None
        rec, r, df = service.run(req, db, user_id=user_id)
        return out(rec, r, df, req)
    except (ValueError, KeyError, MarketDataError) as e:
        raise HTTPException(400, str(e))
    except Exception as exc:
        raise HTTPException(500, f"Backtest could not be completed: {exc}")

@router.get("/backtests")
def backtests(
    mine: bool = False,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Backtest)
    if mine and user:
        query = query.filter(Backtest.user_id == user.id)
    return [
        {
            "id": x.id,
            "name": x.name,
            "symbol": x.symbol,
            "strategy": x.strategy_key,
            "start_date": x.start_date,
            "end_date": x.end_date,
            "initial_capital": x.initial_capital,
            "data_source": x.data_source,
            "user_id": x.user_id,
            "created_at": x.created_at.isoformat(),
        }
        for x in query.order_by(Backtest.created_at.desc()).limit(100)
    ]

@router.get("/backtests/{bid}", response_model=BacktestOut)
def detail(bid: int, db: Session = Depends(get_db)):
    rec = db.query(Backtest).filter_by(id=bid).first()
    if not rec:
        raise HTTPException(404, "Backtest not found")
    try:
        req = BacktestRequest(**rec.config)
        _, r, df = service.run(req, db, persist=False)
        return out(rec, r, df, req)
    except Exception as exc:
        raise HTTPException(500, f"Saved result could not be reconstructed: {exc}")

@router.delete("/backtests/{bid}")
def delete_backtest(
    bid: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rec = db.query(Backtest).filter_by(id=bid).first()
    if not rec:
        raise HTTPException(404, "Backtest not found")
    # Verify ownership: allow if backtest belongs to user or was created as demo
    if rec.user_id is not None and rec.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this backtest.")
    db.delete(rec)
    db.commit()
    return {"status": "ok", "message": f"Backtest #{bid} successfully deleted."}

@router.get("/backtests/{bid}/trades")
def trades(bid: int, db: Session = Depends(get_db)):
    rec = db.query(Backtest).filter_by(id=bid).first()
    if not rec:
        raise HTTPException(404, "Backtest not found")
    return [TradeOut.model_validate(x, from_attributes=True) for x in rec.trades]

@router.get("/backtests/{bid}/equity")
def equity(bid: int, db: Session = Depends(get_db)):
    return detail(bid, db).equity

@router.get("/backtests/{bid}/export")
def export_csv(bid: int, db: Session = Depends(get_db)):
    rec = db.query(Backtest).filter_by(id=bid).first()
    if not rec:
        raise HTTPException(404, "Backtest not found")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Trade ID", "Symbol", "Strategy", "Entry Date", "Exit Date",
        "Entry Price", "Exit Price", "Quantity", "P&L", "Return %",
        "Holding Period Days", "Signal",
    ])
    for t in rec.trades:
        writer.writerow([
            t.id, t.symbol, t.strategy_key, t.entry_date, t.exit_date,
            t.entry_price, t.exit_price, t.quantity, t.pnl, t.return_pct,
            t.holding_period_days, t.signal,
        ])

    csv_data = output.getvalue()
    filename = f"algotradex_trades_{rec.symbol}_{rec.strategy_key}_#{rec.id}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

@router.post("/compare")
def compare(req: CompareRequest):
    try:
        df, source = service.market.get_history(req.symbol, req.start_date, req.end_date)
        result = []
        for x in req.strategies:
            key = x["strategy"]
            r = service.engine.run(
                df,
                key,
                x.get("strategy_params", {}),
                req.initial_capital,
                req.position_size_pct,
                req.commission_pct,
                req.slippage_pct,
                None,
                None,
                True,
            )
            result.append({"strategy": key, "name": STRATEGIES[key].name, "metrics": r.metrics})
        return {"symbol": req.symbol.upper(), "data_source": source, "results": result}
    except (ValueError, KeyError, MarketDataError) as e:
        raise HTTPException(400, str(e))

# -------------------------------------------------------------
# Watchlist Endpoints
# -------------------------------------------------------------

@router.get("/watchlist", response_model=list[WatchlistOut])
def get_watchlist(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Watchlist).filter(Watchlist.user_id == user.id).order_by(Watchlist.created_at.desc()).all()

@router.post("/watchlist", response_model=WatchlistOut)
def add_to_watchlist(
    req: WatchlistCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sym = req.symbol.strip().upper()
    existing = db.query(Watchlist).filter(Watchlist.user_id == user.id, Watchlist.symbol == sym).first()
    if existing:
        if req.notes:
            existing.notes = req.notes
            db.commit()
        return WatchlistOut.model_validate(existing)

    item = Watchlist(user_id=user.id, symbol=sym, notes=req.notes)
    db.add(item)
    db.commit()
    db.refresh(item)
    return WatchlistOut.model_validate(item)

@router.delete("/watchlist/{symbol}")
def remove_from_watchlist(
    symbol: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sym = symbol.strip().upper()
    item = db.query(Watchlist).filter(Watchlist.user_id == user.id, Watchlist.symbol == sym).first()
    if not item:
        raise HTTPException(404, f"Symbol {sym} not found in your watchlist.")
    db.delete(item)
    db.commit()
    return {"status": "ok", "message": f"{sym} removed from watchlist."}
