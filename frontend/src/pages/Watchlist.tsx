import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "../services/api";
import { useToast } from "../context/ToastContext";
import Section from "../components/Section";
import type { WatchlistItem } from "../types";
import { Bookmark, Plus, Trash2, FlaskConical, Database, TrendingUp, Search, Loader2 } from "lucide-react";

const POPULAR_TICKERS = ["AAPL", "NVDA", "MSFT", "TSLA", "SPY", "QQQ", "BTC-USD"];

export default function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [symbol, setSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  const toast = useToast();
  const navigate = useNavigate();

  const loadWatchlist = async () => {
    try {
      const data = await getWatchlist();
      setItems(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to load watchlist.", "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setAdding(true);
    try {
      const item = await addToWatchlist(symbol.trim().toUpperCase(), notes.trim() || undefined);
      toast.success(`${item.symbol} added to your watchlist.`, "Symbol Added");
      setSymbol("");
      setNotes("");
      loadWatchlist();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to add symbol.", "Error");
    } finally {
      setAdding(false);
    }
  };

  const handleQuickAdd = async (sym: string) => {
    try {
      await addToWatchlist(sym);
      toast.success(`${sym} added to your watchlist.`, "Symbol Added");
      loadWatchlist();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to add symbol.", "Error");
    }
  };

  const handleRemove = async (sym: string) => {
    try {
      await removeFromWatchlist(sym);
      toast.info(`${sym} removed from watchlist.`, "Removed");
      setItems((prev) => prev.filter((x) => x.symbol !== sym));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to remove symbol.", "Error");
    }
  };

  const filtered = items.filter(
    (x) =>
      x.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (x.notes && x.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Research Portfolio</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Watchlist</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track key assets and initiate quantitative simulations with a single click.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Ticker Card */}
        <div className="lg:col-span-1">
          <Section title="Track Asset">
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Asset Symbol</label>
                <div className="relative">
                  <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. NVDA, AAPL, BTC-USD"
                    className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 pl-10 pr-4 text-sm font-semibold uppercase text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Research Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Monitoring 50-day moving average break"
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 px-3.5 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={adding || !symbol.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 disabled:opacity-50"
              >
                {adding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                <span>Add to Watchlist</span>
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Popular Instruments</div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TICKERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleQuickAdd(t)}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                  >
                    +{t}
                  </button>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* Watchlist Table */}
        <div className="lg:col-span-2">
          <Section title={`Tracked Instruments (${items.length})`}>
            <div className="mb-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Search symbol or notes…"
                className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Loader2 className="mx-auto mb-2 animate-spin text-cyan-400" size={24} />
                Loading watchlist assets…
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Bookmark className="mx-auto mb-2 text-slate-600" size={32} />
                No assets added to your watchlist yet. Add symbols to quickly simulate strategies.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-500 border-b border-slate-800/80">
                    <tr>
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3">Added</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-cyan-300">{item.symbol}</td>
                        <td className="p-3 text-xs text-slate-400 max-w-xs truncate">
                          {item.notes || <span className="text-slate-600">—</span>}
                        </td>
                        <td className="p-3 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => navigate(`/backtesting?symbol=${item.symbol}`)}
                              title="Run simulation on this asset"
                              className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                            >
                              <FlaskConical size={12} />
                              <span className="hidden sm:inline">Simulate</span>
                            </button>
                            <button
                              onClick={() => navigate(`/market?symbol=${item.symbol}`)}
                              title="View market chart"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/50 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
                            >
                              <Database size={12} />
                              <span className="hidden sm:inline">Data</span>
                            </button>
                            <button
                              onClick={() => handleRemove(item.symbol)}
                              title="Remove from watchlist"
                              className="rounded-lg p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
      </div>
    </div>
  );
}
