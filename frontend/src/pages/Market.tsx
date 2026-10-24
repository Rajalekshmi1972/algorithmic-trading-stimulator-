import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMarket } from "../services/api";
import Section from "../components/Section";
import MetricCard from "../components/MetricCard";
import { Price } from "../charts/Charts";
import { useToast } from "../context/ToastContext";
import {
  Database,
  TrendingUp,
  FlaskConical,
  Radio,
  ShieldAlert,
  Loader2,
  Calendar,
} from "lucide-react";

export default function Market() {
  const [searchParams] = useSearchParams();
  const initialSym = searchParams.get("symbol") || "AAPL";

  const [symbol, setSymbol] = useState(initialSym);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("1y");

  const toast = useToast();
  const navigate = useNavigate();

  const getDateRange = (tf: string) => {
    const end = new Date().toISOString().slice(0, 10);
    const d = new Date();
    if (tf === "1m") d.setMonth(d.getMonth() - 1);
    else if (tf === "3m") d.setMonth(d.getMonth() - 3);
    else if (tf === "6m") d.setMonth(d.getMonth() - 6);
    else if (tf === "3y") d.setFullYear(d.getFullYear() - 3);
    else d.setFullYear(d.getFullYear() - 1); // 1y default
    return { start: d.toISOString().slice(0, 10), end };
  };

  const loadData = async (sym = symbol, tf = timeframe) => {
    if (!sym.trim()) return;
    setLoading(true);
    const { start, end } = getDateRange(tf);

    try {
      const res = await getMarket(sym.trim().toUpperCase(), start, end);
      setData(res);
      toast.success(`Loaded market bars for ${res.symbol}.`, "Data Loaded");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || `Failed to fetch data for ${sym}.`, "Market Data Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(initialSym, "1y");
  }, [initialSym]);

  const pts = data?.points || [];
  const latestBar = pts.length > 0 ? pts[pts.length - 1] : null;
  const firstBar = pts.length > 0 ? pts[0] : null;
  const changePct = latestBar && firstBar ? ((latestBar.close - firstBar.close) / firstBar.close) * 100 : 0;
  const isDemo = data?.data_source?.includes("DEMO");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Market Intelligence</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Market Explorer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspect historical and adjusted OHLCV bars via Yahoo Finance or bundled demo data.
          </p>
        </div>

        {data && (
          <button
            onClick={() => navigate(`/backtesting?symbol=${data.symbol}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <FlaskConical size={15} />
            <span>Simulate Strategy on {data.symbol}</span>
          </button>
        )}
      </div>

      {/* Query Bar */}
      <Section title="Asset Lookup & Horizon">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              required
              placeholder="e.g. AAPL, NVDA, SPY"
              className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 pl-9 pr-3 text-xs font-bold uppercase text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>

          <div className="inline-flex rounded-xl border border-slate-800 bg-[#070D18] p-1">
            {[
              { id: "1m", label: "1M" },
              { id: "3m", label: "3M" },
              { id: "6m", label: "6M" },
              { id: "1y", label: "1Y" },
              { id: "3y", label: "3Y" },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => {
                  setTimeframe(tf.id);
                  loadData(symbol, tf.id);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  timeframe === tf.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Database size={14} />}
            <span>Fetch Market Bars</span>
          </button>
        </form>
      </Section>

      {/* Market Statistics & Chart */}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Latest Price"
              value={latestBar ? `$${latestBar.close.toFixed(2)}` : "—"}
              subValue={latestBar ? `Period Return: ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : undefined}
              trend={changePct >= 0 ? "up" : "down"}
            />
            <MetricCard
              label="Period High"
              value={pts.length > 0 ? `$${Math.max(...pts.map((x: any) => x.high)).toFixed(2)}` : "—"}
            />
            <MetricCard
              label="Period Low"
              value={pts.length > 0 ? `$${Math.min(...pts.map((x: any) => x.low)).toFixed(2)}` : "—"}
            />
            <MetricCard
              label="Total Bars Loaded"
              value={pts.length}
              subValue={data.data_source}
            />
          </div>

          <Section
            title={`${data.symbol} OHLCV Price Action`}
            subtitle={`${pts.length} bars loaded`}
            action={
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isDemo
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                }`}
              >
                {isDemo ? <ShieldAlert size={12} /> : <Radio size={12} className="animate-pulse" />}
                {data.data_source === "YAHOO" ? "Live Yahoo Finance Data" : "Historical Fallback Data"}
              </span>
            }
          >
            <Price data={pts} />
          </Section>
        </div>
      )}
    </div>
  );
}
