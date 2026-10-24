import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MetricCard from "../components/MetricCard";
import Section from "../components/Section";
import { getBacktest, getBacktests, deleteBacktest, getWatchlist, getExportUrl } from "../services/api";
import { Price, Equity, Drawdown } from "../charts/Charts";
import { useToast } from "../context/ToastContext";
import type { BacktestResult, BacktestSummary, WatchlistItem } from "../types";
import {
  FlaskConical,
  TrendingUp,
  Download,
  Trash2,
  ExternalLink,
  RotateCcw,
  Radio,
  Bookmark,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [history, setHistory] = useState<BacktestSummary[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<"equity" | "drawdown" | "price">("equity");

  const toast = useToast();
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      const runs = await getBacktests();
      setHistory(runs);
      if (runs.length > 0) {
        const latest = await getBacktest(runs[0].id);
        setResult(latest);
      }
      try {
        const wl = await getWatchlist();
        setWatchlist(wl.slice(0, 5));
      } catch {
        // Guest mode / watchlist empty
      }
    } catch (err: any) {
      toast.error("Failed to load dashboard data.", "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete backtest #${id}?`)) return;

    try {
      await deleteBacktest(id);
      toast.success(`Backtest #${id} removed.`, "Deleted");
      setHistory((prev) => prev.filter((x) => x.id !== id));
      if (result?.id === id) {
        setResult(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Could not delete backtest.", "Delete Error");
    }
  };

  const m = result?.metrics;
  const isDemo = result?.data_source?.includes("DEMO");

  return (
    <div className="space-y-6">
      {/* Top Banner: Title + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Research Terminal</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Quantitative Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical algorithmic simulation, performance metrics, and risk assessment.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/backtesting"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <FlaskConical size={15} />
            <span>Launch Simulation</span>
          </Link>
        </div>
      </div>

      {/* Data Source & Timestamp Banner */}
      {result && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-[#091322] p-4 text-xs shadow-md">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                isDemo
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {isDemo ? <ShieldAlert size={13} /> : <Radio size={13} className="animate-pulse" />}
              {result.data_source === "YAHOO" ? "Live Yahoo Finance Data" : "Historical Fallback Benchmark"}
            </span>

            <span className="font-semibold text-white">{result.symbol}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 font-medium">{result.strategy}</span>
            {result.created_at && (
              <>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Calendar size={12} className="text-slate-500" />
                  Ran on {new Date(result.created_at).toLocaleString()}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/backtesting?reopen=${result.id}`)}
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              <RotateCcw size={12} />
              <span>Reopen Setup</span>
            </button>
            {result.id && (
              <a
                href={getExportUrl(result.id)}
                download
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <Download size={12} />
                <span>Export CSV</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Portfolio Value"
          value={m ? `$${m.final_portfolio_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
          subValue={m ? `Initial $${m.initial_capital.toLocaleString()}` : undefined}
          trend={m && m.final_portfolio_value >= m.initial_capital ? "up" : "down"}
        />
        <MetricCard
          label="Total Return"
          value={m ? `${m.total_return >= 0 ? "+" : ""}${m.total_return.toFixed(2)}%` : "—"}
          subValue={m ? `CAGR: ${m.cagr.toFixed(2)}%` : undefined}
          trend={m && m.total_return >= 0 ? "up" : "down"}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={m ? m.sharpe_ratio.toFixed(2) : "—"}
          subValue={m ? `Sortino: ${m.sortino_ratio.toFixed(2)}` : undefined}
          trend={m && m.sharpe_ratio >= 1.0 ? "up" : "neutral"}
        />
        <MetricCard
          label="Max Drawdown"
          value={m ? `${m.max_drawdown.toFixed(2)}%` : "—"}
          subValue={m ? `Vol: ${m.annualized_volatility.toFixed(1)}%` : undefined}
          trend="down"
        />
      </div>

      {/* Interactive Charts Section with Tabs */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section
            title="Performance Visualizer"
            subtitle={result ? `${result.symbol} Strategy Execution Performance` : "No simulation loaded"}
            action={
              <div className="inline-flex rounded-xl border border-slate-800 bg-[#070D18] p-1">
                {(["equity", "drawdown", "price"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setChartTab(tab)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                      chartTab === tab
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            }
          >
            {result ? (
              <div className="mt-2">
                {chartTab === "equity" && <Equity data={result.equity} />}
                {chartTab === "drawdown" && <Drawdown data={result.equity} />}
                {chartTab === "price" && <Price data={result.prices} />}
              </div>
            ) : (
              <div className="h-72 grid place-items-center text-center text-xs text-slate-500">
                <div>
                  <Layers className="mx-auto mb-2 text-slate-600" size={32} />
                  Run your first strategy backtest to populate interactive charts.
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Watchlist Quick-Simulation Widget */}
        <div className="lg:col-span-1">
          <Section
            title="Watchlist Tickers"
            subtitle="Tracked instruments"
            action={
              <Link to="/watchlist" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1">
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            }
          >
            {watchlist.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <Bookmark className="mx-auto mb-2 text-slate-600" size={24} />
                No symbols in watchlist.
                <div className="mt-2">
                  <Link to="/watchlist" className="text-cyan-400 hover:underline">
                    + Add Tickers
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {watchlist.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{item.symbol}</div>
                      {item.notes && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{item.notes}</div>}
                    </div>
                    <button
                      onClick={() => navigate(`/backtesting?symbol=${item.symbol}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                    >
                      <FlaskConical size={12} />
                      <span>Simulate</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Recent Simulation Runs Archive Table */}
      <Section
        title="Recent Simulations"
        subtitle="Saved backtest executions"
        action={
          <Link to="/results" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1">
            <span>Results Archive</span>
            <ArrowRight size={13} />
          </Link>
        }
      >
        {history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No simulations recorded yet. Launch a backtest to populate this ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Strategy</th>
                  <th className="p-3">Date Range</th>
                  <th className="p-3">Data Source</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.slice(0, 6).map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-xs text-slate-400 font-mono">#{run.id}</td>
                    <td className="p-3 font-bold text-white">{run.symbol}</td>
                    <td className="p-3 text-xs text-cyan-300 font-medium">{run.strategy}</td>
                    <td className="p-3 text-xs text-slate-400">
                      {run.start_date} → {run.end_date}
                    </td>
                    <td className="p-3 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          run.data_source === "YAHOO"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {run.data_source}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/results/${run.id}`}
                          title="View detailed results"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                          <ExternalLink size={12} />
                          <span className="hidden sm:inline">Details</span>
                        </Link>
                        <button
                          onClick={() => navigate(`/backtesting?reopen=${run.id}`)}
                          title="Reopen parameters into simulator"
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                        >
                          <RotateCcw size={12} />
                          <span className="hidden sm:inline">Reopen</span>
                        </button>
                        <a
                          href={getExportUrl(run.id)}
                          download
                          title="Export trades as CSV"
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={(e) => handleDelete(run.id, e)}
                          title="Delete simulation"
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
