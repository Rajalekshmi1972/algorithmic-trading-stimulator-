import pandas as pd
from src.backtesting.metrics import calc
def test_metrics():
 e=pd.Series([100,120,90,110],index=pd.date_range("2024-01-01",periods=4))
 m=calc(e,[{"pnl":10,"return_pct":5}],100)
 assert m["final_portfolio_value"]==110 and m["number_of_trades"]==1
