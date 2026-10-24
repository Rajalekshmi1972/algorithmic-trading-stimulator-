from pathlib import Path
import time,pandas as pd,yfinance as yf
from src.config import get_settings
class MarketDataError(Exception): pass
class MarketDataService:
    def __init__(self): self.s=get_settings(); self.cache={}; self.demo=Path(__file__).resolve().parents[2]/"data"/"demo_prices.csv"
    def _demo(self,start,end):
        d=pd.read_csv(self.demo,parse_dates=["date"]); d["date"]=pd.to_datetime(d.date)
        out=d[(d.date>=pd.Timestamp(start))&(d.date<=pd.Timestamp(end))].copy()
        if out.empty: raise MarketDataError("No bundled demo data for this date range.")
        return out,"DEMO"
    def get_history(self,symbol,start,end,source="auto"):
        if end<=start: raise MarketDataError("End date must be after start date.")
        key=(symbol.upper(),str(start),str(end),source); now=time.time()
        if key in self.cache and now-self.cache[key][0]<self.s.yfinance_cache_ttl_seconds: return self.cache[key][1].copy(),self.cache[key][2]
        if source=="demo" or self.s.demo_mode: return self._cache(key,now,*self._demo(start,end))
        try:
            raw=yf.download(symbol.upper(),start=str(start),end=str(end+pd.Timedelta(days=1)),auto_adjust=False,progress=False,threads=False)
            if raw is None or raw.empty: raise MarketDataError(f"No Yahoo Finance data for {symbol}.")
            if isinstance(raw.columns,pd.MultiIndex): raw.columns=raw.columns.get_level_values(0)
            need=["Open","High","Low","Close","Volume"]
            if any(x not in raw.columns for x in need): raise MarketDataError("Yahoo Finance response is missing OHLCV fields.")
            d=raw[need].reset_index().rename(columns={"Date":"date","Open":"open","High":"high","Low":"low","Close":"close","Volume":"volume"})
            d["date"]=pd.to_datetime(d.date).dt.tz_localize(None); d=d.dropna(subset=["open","high","low","close"]).reset_index(drop=True)
            return self._cache(key,now,d,"YAHOO")
        except Exception as exc:
            try: return self._cache(key,now,*self._demo(start,end),label_override="DEMO_FALLBACK")
            except Exception: raise MarketDataError(f"Market data unavailable: {exc}") from exc
    def _cache(self,key,now,d,label,label_override=None):
        self.cache[key]=(now,d,label_override or label); return d.copy(),label_override or label
