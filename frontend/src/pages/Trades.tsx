import React, { useEffect, useState } from "react";
import { getBacktests, getBacktest } from "../services/api";
import Section from "../components/Section";
import type { Trade } from "../types";
import { BarChart3, Search, Download, Loader2 } from "lucide-react";

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBacktests().then(async (runs) => {
      const allTrades: Trade[] = [];
      for (const run of runs.slice(0, 20)) {
        try {
          const detail = await getBacktest(run.id);
          if (detail.trades) {
            allTrades.push(...detail.trades);
          }
        } catch {
          // Skip if missing
        }
      }
      setTrades(allTrades);
      setLoading(false);
    });
  }, []);

  const filtered = trades.filter((t) =>
    `${t.symbol} ${t.strategy_key} ${t.signal}`.toLowerCase().includes(query.toLowerCase())
  );

  const exportAllTradesCSV = () => {
    if (!filtered.length) return;
    const headers = [
      "Symbol",
      "Strategy",
      "Entry Date",
      "Exit Date",
      "Entry Price",
      "Exit Price",
      "Quantity",
      "P&L",
      "Return %",
      "Holding Days",
      "Signal",
    ];
    const rows = filtered.map((t) => [
      t.symbol,
      t.strategy_key,
      t.entry_date,
      t.exit_date,
      t.entry_price.toFixed(2),
      t.exit_price.toFixed(2),
      t.quantity.toFixed(2),
      t.pnl.toFixed(2),
      t.return_pct.toFixed(2),
      t.holding_period_days,
      t.signal,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "algotradex_all_trades.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPnL = filtered.reduce((acc, t) => acc + t.pnl, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Execution Ledger</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Trade History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated audit log of simulated orders executed across backtested strategies.
          </p>
        </div>

        {filtered.length > 0 && (
          <button
            onClick={exportAllTradesCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
          >
            <Download size={14} />
            <span>Export Filtered Trades CSV</span>
          </button>
        )}
      </div>

      <Section
        title={`Executed Orders (${filtered.length})`}
        subtitle={`Cumulative Net P&L: ${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`}
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search symbol, strategy, signal…"
              className="w-64 rounded-xl border border-slate-800 bg-[#070D18] py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      >
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <Loader2 className="mx-auto mb-2 animate-spin text-cyan-400" size={26} />
            Aggregating historical trade records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <BarChart3 className="mx-auto mb-2 text-slate-600" size={32} />
            No trades match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Strategy</th>
                  <th className="p-3">Entry Date</th>
                  <th className="p-3">Exit Date</th>
                  <th className="p-3">Entry Px</th>
                  <th className="p-3">Exit Px</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">P&L ($)</th>
                  <th className="p-3">Return</th>
                  <th className="p-3">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.map((t, i) => {
                  const isWin = t.pnl >= 0;
                  return (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-sans font-bold text-white">{t.symbol}</td>
                      <td className="p-3 font-sans text-cyan-300 font-medium">{t.strategy_key}</td>
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
                      <td className="p-3 font-sans">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
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
