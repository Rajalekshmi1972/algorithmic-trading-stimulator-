import numpy as np, pandas as pd
from .base import BaseStrategy

class SMA(BaseStrategy):
    key="sma_crossover"; name="Moving Average Crossover"; description="Fast/slow SMA crossover."; default_params={"fast_period":20,"slow_period":50}
    def validate(self,p):
        a,b=int(p.get("fast_period",20)),int(p.get("slow_period",50))
        if a<2 or b<=a: raise ValueError("slow_period must be greater than fast_period >= 2")
        return {"fast_period":a,"slow_period":b}
    def generate_signals(self,df,p):
        p=self.validate(p); a=df.close.rolling(p["fast_period"]).mean(); b=df.close.rolling(p["slow_period"]).mean()
        s=pd.Series(0,index=df.index); s[(a>b)&(a.shift(1)<=b.shift(1))]=1; s[(a<b)&(a.shift(1)>=b.shift(1))]=-1; return s

class RSI(BaseStrategy):
    key="rsi"; name="RSI Strategy"; description="Oversold recovery entries and overbought exits."; default_params={"rsi_period":14,"oversold":30,"overbought":70}
    def validate(self,p):
        n=int(p.get("rsi_period",14)); o=float(p.get("oversold",30)); b=float(p.get("overbought",70))
        if n<2 or not 0<o<b<100: raise ValueError("Use period >=2 and 0 < oversold < overbought < 100")
        return {"rsi_period":n,"oversold":o,"overbought":b}
    def generate_signals(self,df,p):
        p=self.validate(p); d=df.close.diff(); g=d.clip(lower=0).rolling(p["rsi_period"]).mean(); l=(-d.clip(upper=0)).rolling(p["rsi_period"]).mean()
        r=100-(100/(1+g/l.replace(0,np.nan))); s=pd.Series(0,index=df.index); s[(r>p["oversold"])&(r.shift(1)<=p["oversold"])]=1; s[(r<p["overbought"])&(r.shift(1)>=p["overbought"])]=-1; return s

class Bollinger(BaseStrategy):
    key="bollinger"; name="Bollinger Bands"; description="Band recovery/rejection signals."; default_params={"period":20,"std_multiplier":2}
    def validate(self,p):
        n=int(p.get("period",20)); m=float(p.get("std_multiplier",2))
        if n<2 or m<=0: raise ValueError("period >=2 and multiplier >0 required")
        return {"period":n,"std_multiplier":m}
    def generate_signals(self,df,p):
        p=self.validate(p); mid=df.close.rolling(p["period"]).mean(); sd=df.close.rolling(p["period"]).std(); lo=mid-p["std_multiplier"]*sd; hi=mid+p["std_multiplier"]*sd
        s=pd.Series(0,index=df.index); s[(df.close>lo)&(df.close.shift(1)<=lo.shift(1))]=1; s[(df.close<hi)&(df.close.shift(1)>=hi.shift(1))]=-1; return s

class MACD(BaseStrategy):
    key="macd"; name="MACD Strategy"; description="MACD/signal EMA crossover."; default_params={"fast_ema":12,"slow_ema":26,"signal_ema":9}
    def validate(self,p):
        a,b,c=[int(p.get(k,d)) for k,d in [("fast_ema",12),("slow_ema",26),("signal_ema",9)]]
        if min(a,b,c)<2 or a>=b: raise ValueError("fast_ema < slow_ema and all periods >=2 required")
        return {"fast_ema":a,"slow_ema":b,"signal_ema":c}
    def generate_signals(self,df,p):
        p=self.validate(p); m=df.close.ewm(span=p["fast_ema"],adjust=False).mean()-df.close.ewm(span=p["slow_ema"],adjust=False).mean(); q=m.ewm(span=p["signal_ema"],adjust=False).mean()
        s=pd.Series(0,index=df.index); s[(m>q)&(m.shift(1)<=q.shift(1))]=1; s[(m<q)&(m.shift(1)>=q.shift(1))]=-1; return s

class Momentum(BaseStrategy):
    key="momentum"; name="Momentum Strategy"; description="Lookback momentum threshold."; default_params={"lookback":20,"threshold_pct":2}
    def validate(self,p):
        n=int(p.get("lookback",20)); t=float(p.get("threshold_pct",2))
        if n<1: raise ValueError("lookback >=1 required")
        return {"lookback":n,"threshold_pct":t}
    def generate_signals(self,df,p):
        p=self.validate(p); m=df.close.pct_change(p["lookback"])*100; s=pd.Series(0,index=df.index); s[(m>p["threshold_pct"])&(m.shift(1)<=p["threshold_pct"])]=1; s[(m<p["threshold_pct"])&(m.shift(1)>=p["threshold_pct"])]=-1; return s

STRATEGIES={x.key:x for x in [SMA(),RSI(),Bollinger(),MACD(),Momentum()]}
