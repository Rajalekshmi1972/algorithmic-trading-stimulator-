import numpy as np
def calc(equity,trades,initial):
    r=equity.pct_change().fillna(0); final=float(equity.iloc[-1]); total=final/initial-1
    days=max((equity.index[-1]-equity.index[0]).days,1); years=days/365.25
    cagr=(final/initial)**(1/years)-1 if final>0 else -1
    vol=float(r.std(ddof=0)*np.sqrt(252)); sharpe=float(r.mean()/r.std(ddof=0)*np.sqrt(252)) if r.std(ddof=0)>0 else 0
    down=r.where(r<0,0); ds=down.std(ddof=0)*np.sqrt(252); sortino=float(r.mean()*252/ds) if ds>0 else 0
    dd=equity/equity.cummax()-1; wins=[x for x in trades if x["pnl"]>0]; losses=[x for x in trades if x["pnl"]<0]
    gp=sum(x["pnl"] for x in wins); gl=abs(sum(x["pnl"] for x in losses))
    return {"initial_capital":initial,"final_portfolio_value":final,"total_return":total*100,"cagr":cagr*100,"annualized_volatility":vol*100,"sharpe_ratio":sharpe,"sortino_ratio":sortino,"max_drawdown":float(dd.min()*100),"win_rate":(len(wins)/len(trades)*100 if trades else 0),"number_of_trades":len(trades),"winning_trades":len(wins),"losing_trades":len(losses),"average_trade_return":float(np.mean([x["return_pct"] for x in trades])) if trades else 0,"profit_factor":gp/gl if gl else (float("inf") if gp else 0),"best_trade":max([x["return_pct"] for x in trades],default=0),"worst_trade":min([x["return_pct"] for x in trades],default=0)}
