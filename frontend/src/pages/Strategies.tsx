import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStrategies } from "../services/api";
import Section from "../components/Section";
import type { Strategy } from "../types";
import { Bot, FlaskConical, Sliders, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function Strategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getStrategies()
      .then(setStrategies)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Quantitative Algorithms</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Strategy Models</h1>
          <p className="text-sm text-slate-400 mt-1">
            Built-in algorithmic logic executing next-bar trades with parameter bounds checking.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin text-cyan-400" size={28} />
          Loading algorithmic models…
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {strategies.map((strat) => (
            <Section
              key={strat.key}
              title={strat.name}
              action={
                <button
                  onClick={() => navigate(`/backtesting?strategy=${strat.key}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
                >
                  <FlaskConical size={13} />
                  <span>Test Strategy</span>
                </button>
              }
            >
              <p className="text-xs text-slate-300 leading-relaxed min-h-[40px]">{strat.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sliders size={13} className="text-cyan-400" />
                  <span>Default Parameters</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(strat.default_params).map(([param, val]) => (
                    <div key={param} className="rounded-xl border border-slate-800/80 bg-[#070D18] p-2.5">
                      <div className="text-[10px] uppercase font-medium text-slate-500 truncate">
                        {param.replaceAll("_", " ")}
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-bold text-cyan-300">{String(val)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}
