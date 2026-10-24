import pandas as pd
from src.strategies.implementations import SMA,RSI,MACD
def df():
 c=[100,99,98,99,101,103,105,104,102,100,98,99,101,104,107,110]
 return pd.DataFrame({"close":c,"open":c,"high":[x+1 for x in c],"low":[x-1 for x in c],"volume":[1000]*len(c),"date":pd.date_range("2024-01-01",periods=len(c))})
def test_sma(): assert len(SMA().generate_signals(df(),{"fast_period":2,"slow_period":4}))==len(df())
def test_rsi(): assert len(RSI().generate_signals(df(),{"rsi_period":3,"oversold":30,"overbought":70}))==len(df())
def test_macd_validation():
 try: MACD().validate({"fast_ema":20,"slow_ema":10,"signal_ema":9}); assert False
 except ValueError: assert True
