import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBacktest, deleteBacktest, getExportUrl } from "../services/api";
import MetricCard from "../components/MetricCard";
import Section from "../components/Section";
import { Price, Equity, Drawdown } from "../charts/Charts";
import { useToast } from "../context/ToastContext";
import type { BacktestResult } from "../types";
import {
  ArrowLeft,
  RotateCcw,
  Download,
  Trash2,
  Calendar,
  Radio,
  ShieldAlert,
  Layers,
  CheckCircle2,
  Sliders,
  Loader2,
} from "lucide-react";

export default function ResultDetail() {
  const { id } = useParams();
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"equity" | "drawdown" | "price">("equity");

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setLoading(true);
      getBacktest(Number(id))
        .then(setResult)
        .catch((err) => {
          toast.error(err?.response?.data?.detail || "Could not retrieve simulation results.", "Error");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm(`Permanently delete backtest #${id}?`)) return;
    try {
      await deleteBacktest(Number(id));
      toast.success(`Backtest #${id} deleted.`, "Deleted");
      navigate("/results");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete backtest.", "Delete Failed");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs">
        <Loader2 className="mx-auto mb-2 animate-spin text-cyan-400" size={32} />
        Reconstructing quantitative simulation…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        Simulation #{id} could not be found.{" "}
        <Link to="/results" className="text-cyan-400 hover:underline">
          Return to results archive.
        </Link>
      </div>
    );
  }

  const m = result.metrics;
  const isDemo = result.data_source.includes("DEMO");

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/results"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Simulation Archive</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {result.symbol} · <span className="text-cyan-400">{result.strategy}</span>
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isDemo
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              }`}
            >
              {isDemo ? <ShieldAlert size={12} /> : <Radio size={12} />}
              {result.data_source === "YAHOO" ? "Live Market Data" : "Historical Fallback Data"}
            </span>
          </div>
          {result.created_at && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-500" />
              <span>Simulated on {new Date(result.created_at).toLocaleString()}</span>
              {result.name && <span className="text-slate-500">· Name: {result.name}</span>}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/backtesting?reopen=${id}`)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
          >
            <RotateCcw size={14} />
            <span>Reopen in Simulator</span>
          </button>
          <a
            href={getExportUrl(Number(id))}
            download
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Portfolio Final Value"
          value={`$${m.final_portfolio_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subValue={`Initial $${m.initial_capital.toLocaleString()}`}
          trend={m.final_portfolio_value >= m.initial_capital ? "up" : "down"}
        />
        <MetricCard
          label="Total Return"
          value={`${m.total_return >= 0 ? "+" : ""}${m.total_return.toFixed(2)}%`}
          subValue={`CAGR: ${m.cagr.toFixed(2)}%`}
          trend={m.total_return >= 0 ? "up" : "down"}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={m.sharpe_ratio.toFixed(2)}
          subValue={`Sortino: ${m.sortino_ratio.toFixed(2)}`}
          trend={m.sharpe_ratio >= 1.0 ? "up" : "neutral"}
        />
        <MetricCard
          label="Max Drawdown"
          value={`${m.max_drawdown.toFixed(2)}%`}
          subValue={`Vol: ${m.annualized_volatility.toFixed(1)}%`}
          trend="down"
        />
        <MetricCard
          label="Win Rate"
          value={`${m.win_rate.toFixed(1)}%`}
          subValue={`${m.winning_trades}W / ${m.losing_trades}L`}
          trend={m.win_rate >= 50 ? "up" : "neutral"}
        />
        <MetricCard
          label="Total Trades"
          value={m.number_of_trades}
          subValue={`Avg ${m.average_trade_return.toFixed(2)}%`}
        />
        <MetricCard
          label="Profit Factor"
          value={m.profit_factor === Infinity ? "∞" : m.profit_factor.toFixed(2)}
          trend={m.profit_factor >= 1.5 ? "up" : "neutral"}
        />
        <MetricCard
          label="Best / Worst Trade"
          value={`+${m.best_trade.toFixed(1)}%`}
          subValue={`Worst: ${m.worst_trade.toFixed(1)}%`}
        />
      </div>

      {/* Interactive Charts with Tabs */}
      <Section
        title="Simulation Visualizer"
        action={
          <div className="inline-flex rounded-xl border border-slate-800 bg-[#070D18] p-1">
            {(["equity", "drawdown", "price"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                  activeTab === tab
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
        <div className="mt-2">
          {activeTab === "equity" && <Equity data={result.equity} />}
          {activeTab === "drawdown" && <Drawdown data={result.equity} />}
          {activeTab === "price" && <Price data={result.prices} />}
        </div>
      </Section>

      {/* Config Drawer */}
      {result.config && (
        <Section title="Simulation Parameters & Hyperparameters" subtitle="Parameters used during this quantitative run">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#070D18] p-3">
              <span className="text-slate-500 block mb-0.5">Timeframe</span>
              <span className="font-semibold text-slate-200">
                {result.config.start_date} → {result.config.end_date}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#070D18] p-3">
              <span className="text-slate-500 block mb-0.5">Position Size</span>
              <span className="font-semibold text-slate-200">{result.config.position_size_pct}% Portfolio</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#070D18] p-3">
              <span className="text-slate-500 block mb-0.5">Friction (Commission / Slip)</span>
              <span className="font-semibold text-slate-200">
                {result.config.commission_pct}% / {result.config.slippage_pct}%
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#070D18] p-3">
              <span className="text-slate-500 block mb-0.5">Stop Loss / Take Profit</span>
              <span className="font-semibold text-slate-200">
                {result.config.stop_loss_pct ? `${result.config.stop_loss_pct}%` : "None"} /{" "}
                {result.config.take_profit_pct ? `${result.config.take_profit_pct}%` : "None"}
              </span>
            </div>
          </div>

          {result.config.strategy_params && Object.keys(result.config.strategy_params).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(result.config.strategy_params).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 font-mono"
                >
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Trades Ledger Table */}
      <Section
        title={`Executed Trades Log (${result.trades.length})`}
        subtitle="Individual simulated executions at next-bar open"
        action={
          <a
            href={getExportUrl(Number(id))}
            download
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <Download size={13} />
            <span>Download CSV</span>
          </a>
        }
      >
        {result.trades.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No trades were triggered during this simulation period with current parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Entry Date</th>
                  <th className="p-3">Exit Date</th>
                  <th className="p-3">Entry Price</th>
                  <th className="p-3">Exit Price</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">P&L ($)</th>
                  <th className="p-3">Return (%)</th>
                  <th className="p-3">Holding (Days)</th>
                  <th className="p-3">Exit Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {result.trades.map((t, i) => {
                  const isWin = t.pnl >= 0;
                  return (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-slate-500">{i + 1}</td>
                      <td className="p-3 text-slate-300">{t.entry_date}</td>
                      <td className="p-3 text-slate-300">{t.exit_date}</td>
                      <td className="p-3 text-slate-200">${t.entry_price.toFixed(2)}</td>
                      <td className="p-3 text-slate-200">${t.exit_price.toFixed(2)}</td>
                      <td className="p-3 text-slate-300">{t.quantity.toFixed(2)}</td>
                      <td className={`p-3 font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                        {isWin ? "+" : ""}${t.pnl.toFixed(2)}
                      </td>
                      <td className={`p-3 font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                        {isWin ? "+" : ""}{t.return_pct.toFixed(2)}%
                      </td>
                      <td className="p-3 text-slate-400">{t.holding_period_days}d</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-sans font-bold ${
                            t.signal === "STOP_LOSS"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : t.signal === "TAKE_PROFIT"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {t.signal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
