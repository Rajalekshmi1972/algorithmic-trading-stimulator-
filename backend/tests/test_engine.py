import pandas as pd
from src.backtesting.engine import BacktestEngine
def test_engine():
 d=pd.date_range("2024-01-01",periods=80); c=[100+i*.5 for i in range(80)]
 df=pd.DataFrame({"date":d,"open":c,"high":[x+1 for x in c],"low":[x-1 for x in c],"close":c,"volume":[1000]*80})
 r=BacktestEngine().run(df,"sma_crossover",{"fast_period":3,"slow_period":8},10000,100,.1,.05,None,None)
 assert len(r.equity)==80 and "sharpe_ratio" in r.metrics
