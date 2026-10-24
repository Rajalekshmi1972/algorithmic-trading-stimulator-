import React, { useEffect, useState } from "react";
import { getStrategies, compareStrategies } from "../services/api";
import Section from "../components/Section";
import { useToast } from "../context/ToastContext";
import type { Strategy } from "../types";
import {
  GitCompare,
  TrendingUp,
  Download,
  Calendar,
  Loader2,
  Trophy,
  ArrowRight,
  ShieldAlert,
  Radio,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const today = new Date().toISOString().slice(0, 10);
const oneYearAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10);

export default function Comparison() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [symbol, setSymbol] = useState("AAPL");
  const [startDate, setStartDate] = useState(oneYearAgo);
  const [endDate, setEndDate] = useState(today);
  const [initialCapital, setInitialCapital] = useState(100000);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    getStrategies().then((data) => {
      setStrategies(data);
      // Run initial comparison on mount
      if (data.length > 0) {
        runComparison(data, "AAPL", oneYearAgo, today, 100000);
      }
    });
  }, []);

  const runComparison = async (
    strats = strategies,
    sym = symbol,
    start = startDate,
    end = endDate,
    cap = initialCapital
  ) => {
    if (!strats.length) return;
    setLoading(true);

    try {
      const payload = {
        symbol: sym.trim().toUpperCase(),
        start_date: start,
        end_date: end,
        strategies: strats.map((s) => ({
          strategy: s.key,
          strategy_params: s.default_params,
        })),
        initial_capital: Number(cap),
        position_size_pct: 100,
        commission_pct: 0.1,
        slippage_pct: 0.05,
      };

      const res = await compareStrategies(payload);
      setResults(res);
      toast.success(`Completed comparative strategy evaluation for ${res.symbol}.`, "Comparison Done");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Comparison evaluation failed.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results || !results.results) return;
    const headers = [
      "Strategy",
      "Total Return (%)",
      "CAGR (%)",
      "Sharpe Ratio",
      "Sortino Ratio",
      "Max Drawdown (%)",
      "Win Rate (%)",
      "Total Trades",
      "Profit Factor",
    ];
    const rows = results.results.map((r: any) => [
      r.name,
      r.metrics.total_return.toFixed(2),
      r.metrics.cagr.toFixed(2),
      r.metrics.sharpe_ratio.toFixed(2),
      r.metrics.sortino_ratio.toFixed(2),
      r.metrics.max_drawdown.toFixed(2),
      r.metrics.win_rate.toFixed(1),
      r.metrics.number_of_trades,
      r.metrics.profit_factor === Infinity ? "inf" : r.metrics.profit_factor.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `strategy_comparison_${results.symbol}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find best performing strategy
  const bestStrategy = results?.results
    ? [...results.results].sort((a, b) => b.metrics.total_return - a.metrics.total_return)[0]
    : null;

  // Chart data
  const chartData = results?.results?.map((r: any) => ({
    name: r.name.replace(" Strategy", ""),
    "Total Return (%)": Number(r.metrics.total_return.toFixed(2)),
    "Sharpe Ratio": Number(r.metrics.sharpe_ratio.toFixed(2)),
  })) || [];

  const isDemo = results?.data_source?.includes("DEMO");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Quantitative Benchmarks</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Strategy Comparison</h1>
          <p className="text-sm text-slate-400 mt-1">
            Compare risk-adjusted returns, Sharpe, Sortino, drawdowns, and trade consistency across models.
          </p>
        </div>

        {results && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
          >
            <Download size={14} />
            <span>Export Comparison CSV</span>
          </button>
        )}
      </div>

      {/* Controls Card */}
      <Section title="Comparative Test Configuration" subtitle="Define asset, timeframe, and capital allocation">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runComparison();
          }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Asset Symbol</label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                required
                className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 pl-9 pr-3 text-xs font-bold uppercase text-cyan-300 focus:border-cyan-400 focus:outline-none"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="date"
                required
                className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="date"
                required
                className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <GitCompare size={16} />}
            <span>Run Multi-Strategy Comparison</span>
          </button>
        </form>
      </Section>

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Top Leader Highlight */}
          {bestStrategy && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-[#0A1322] to-emerald-500/10 p-5 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Trophy size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Top Performing Model</div>
                  <h3 className="text-lg font-extrabold text-white">{bestStrategy.name}</h3>
                  <div className="text-xs text-slate-400">
                    Highest total return on {results.symbol} ({bestStrategy.metrics.total_return >= 0 ? "+" : ""}
                    {bestStrategy.metrics.total_return.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Sharpe</span>
                  <span className="text-cyan-300 font-bold">{bestStrategy.metrics.sharpe_ratio.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Win Rate</span>
                  <span className="text-emerald-400 font-bold">{bestStrategy.metrics.win_rate.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Max DD</span>
                  <span className="text-rose-400 font-bold">{bestStrategy.metrics.max_drawdown.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Bar Chart Visualization */}
          <Section title="Comparative Return & Sharpe Visualization">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-15} textAnchor="end" stroke="#334155" />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} stroke="#334155" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#091322", borderColor: "#334155", borderRadius: "0.75rem" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "11px" }} />
                  <Bar dataKey="Total Return (%)" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sharpe Ratio" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* Full Metrics Table */}
          <Section
            title={`Performance & Risk Matrix for ${results.symbol}`}
            subtitle={`Source: ${results.data_source}`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-slate-800/80">
                  <tr>
                    <th className="p-3">Strategy</th>
                    <th className="p-3">Total Return</th>
                    <th className="p-3">CAGR</th>
                    <th className="p-3">Sharpe Ratio</th>
                    <th className="p-3">Sortino</th>
                    <th className="p-3">Max Drawdown</th>
                    <th className="p-3">Win Rate</th>
                    <th className="p-3">Total Trades</th>
                    <th className="p-3">Profit Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {results.results.map((res: any) => {
                    const m = res.metrics;
                    const isPositive = m.total_return >= 0;
                    return (
                      <tr key={res.strategy} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-sans font-bold text-slate-200">{res.name}</td>
                        <td className={`p-3 font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                          {isPositive ? "+" : ""}{m.total_return.toFixed(2)}%
                        </td>
                        <td className="p-3 text-slate-300">{m.cagr.toFixed(2)}%</td>
                        <td className="p-3 text-cyan-300 font-bold">{m.sharpe_ratio.toFixed(2)}</td>
                        <td className="p-3 text-slate-300">{m.sortino_ratio.toFixed(2)}</td>
                        <td className="p-3 text-rose-400">{m.max_drawdown.toFixed(2)}%</td>
                        <td className="p-3 text-slate-300">{m.win_rate.toFixed(1)}%</td>
                        <td className="p-3 text-slate-400">{m.number_of_trades}</td>
                        <td className="p-3 text-slate-300">
                          {m.profit_factor === Infinity ? "∞" : m.profit_factor.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
