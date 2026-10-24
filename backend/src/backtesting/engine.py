import pandas as pd
from src.strategies.factory import get_strategy
from .metrics import calc
class Result:
    def __init__(self,metrics,trades,equity,signals): self.metrics=metrics; self.trades=trades; self.equity=equity; self.signals=signals
class BacktestEngine:
    def run(self,df,key,params,initial,position,commission,slippage,stop_loss,take_profit,long_only=True):
        df=df.sort_values("date").reset_index(drop=True).copy(); s=get_strategy(key); p=s.validate(params); sig=s.generate_signals(df,p).fillna(0).astype(int)
        cash=float(initial); qty=0.; entry=entry_date=entry_cost=None; trades=[]; signals=[]; eq=[]
        fee=commission/100; slip=slippage/100
        for i,row in df.iterrows():
            eq.append(cash+qty*float(row.close))
            signal=int(sig.iloc[i])
            if signal: signals.append({"date":row.date.strftime("%Y-%m-%d"),"price":float(row.close),"signal":"BUY" if signal==1 else "SELL"})
            if i>=len(df)-1: continue
            nxt=df.iloc[i+1]; op=float(nxt.open)
            if qty>0:
                exit_price=None; reason=None
                if stop_loss is not None and float(row.low)<=entry*(1-stop_loss/100): exit_price=entry*(1-stop_loss/100); reason="STOP_LOSS"
                elif take_profit is not None and float(row.high)>=entry*(1+take_profit/100): exit_price=entry*(1+take_profit/100); reason="TAKE_PROFIT"
                elif signal==-1: exit_price=op*(1-slip); reason="SELL"
                if exit_price is not None:
                    gross=qty*exit_price; exit_fee=gross*fee; cash+=gross-exit_fee
                    pnl=(exit_price-entry)*qty-entry_cost-exit_fee
                    trades.append({"entry_date":entry_date.strftime("%Y-%m-%d"),"exit_date":nxt.date.strftime("%Y-%m-%d"),"entry_price":entry,"exit_price":exit_price,"quantity":qty,"pnl":pnl,"return_pct":pnl/max(entry_cost,1e-9)*100,"holding_period_days":max((nxt.date-entry_date).days,0),"signal":reason,"strategy_key":key})
                    qty=0; entry=entry_date=entry_cost=None
            if qty==0 and signal==1:
                budget=cash*position/100; buy=op*(1+slip); q=max((budget-budget*fee)/buy,0)
                if q:
                    gross=q*buy; f=gross*fee; cash-=gross+f; qty=q; entry=buy; entry_date=nxt.date; entry_cost=gross+f
        if qty:
            last=df.iloc[-1]; exit_price=float(last.close)*(1-slip); gross=qty*exit_price; f=gross*fee; cash+=gross-f
            pnl=(exit_price-entry)*qty-entry_cost-f
            trades.append({"entry_date":entry_date.strftime("%Y-%m-%d"),"exit_date":last.date.strftime("%Y-%m-%d"),"entry_price":entry,"exit_price":exit_price,"quantity":qty,"pnl":pnl,"return_pct":pnl/max(entry_cost,1e-9)*100,"holding_period_days":max((last.date-entry_date).days,0),"signal":"END_OF_TEST","strategy_key":key})
        equity=pd.Series(eq,index=pd.to_datetime(df.date)); equity.iloc[-1]=cash
        return Result(calc(equity,trades,initial),trades,equity,equity.index.map(str).tolist() and signals)
