import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBacktests, deleteBacktest, getExportUrl } from "../services/api";
import { useToast } from "../context/ToastContext";
import Section from "../components/Section";
import type { BacktestSummary } from "../types";
import {
  History,
  ExternalLink,
  RotateCcw,
  Download,
  Trash2,
  Search,
  Filter,
  Radio,
  ShieldAlert,
  Loader2,
  FlaskConical,
} from "lucide-react";

export default function Results() {
  const [runs, setRuns] = useState<BacktestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMine, setFilterMine] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toast = useToast();
  const navigate = useNavigate();

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await getBacktests(filterMine);
      setRuns(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to load backtests archive.", "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [filterMine]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete backtest #${id}?`)) return;

    try {
      await deleteBacktest(id);
      toast.success(`Backtest #${id} successfully deleted.`, "Deleted");
      setRuns((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Could not delete backtest.", "Delete Error");
    }
  };

  const filteredRuns = runs.filter(
    (r) =>
      r.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Historical Archive</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Backtest Results</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, inspect, export, or clone previously executed strategy simulations.
          </p>
        </div>

        <Link
          to="/backtesting"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <FlaskConical size={15} />
          <span>New Simulation</span>
        </Link>
      </div>

      <Section
        title={`Saved Simulations (${runs.length})`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
              <input
                type="text"
                placeholder="Search symbol, strategy…"
                className="rounded-xl border border-slate-800 bg-[#070D18] py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setFilterMine(!filterMine)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                filterMine
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Filter size={13} />
              <span>{filterMine ? "Showing: My Runs" : "Filter: My Runs"}</span>
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <Loader2 className="mx-auto mb-2 animate-spin text-cyan-400" size={26} />
            Loading simulation ledger…
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <History className="mx-auto mb-2 text-slate-600" size={32} />
            No backtest runs found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Symbol / Name</th>
                  <th className="p-3">Strategy</th>
                  <th className="p-3">Date Range</th>
                  <th className="p-3">Initial Capital</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRuns.map((r) => {
                  const isDemo = r.data_source.includes("DEMO");
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-slate-400">#{r.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{r.symbol}</div>
                        {r.name && <div className="text-[11px] text-slate-400 truncate max-w-xs">{r.name}</div>}
                      </td>
                      <td className="p-3 text-xs text-cyan-300 font-medium">{r.strategy}</td>
                      <td className="p-3 text-xs text-slate-400">
                        {r.start_date} → {r.end_date}
                      </td>
                      <td className="p-3 text-xs font-semibold text-slate-200">
                        ${r.initial_capital.toLocaleString()}
                      </td>
                      <td className="p-3 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isDemo
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          }`}
                        >
                          {isDemo ? <ShieldAlert size={10} /> : <Radio size={10} />}
                          {r.data_source}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/results/${r.id}`}
                            title="Inspect metrics & charts"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
                          >
                            <ExternalLink size={12} />
                            <span>Open</span>
                          </Link>
                          <button
                            onClick={() => navigate(`/backtesting?reopen=${r.id}`)}
                            title="Reopen parameters into simulator"
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                          >
                            <RotateCcw size={12} />
                            <span className="hidden sm:inline">Clone</span>
                          </button>
                          <a
                            href={getExportUrl(r.id)}
                            download
                            title="Export trades as CSV"
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            onClick={(e) => handleDelete(r.id, e)}
                            title="Delete backtest"
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
