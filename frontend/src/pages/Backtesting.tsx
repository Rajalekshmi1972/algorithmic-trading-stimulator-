import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Section from "../components/Section";
import { getStrategies, runBacktest, getBacktest } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { Strategy } from "../types";
import {
  FlaskConical,
  TrendingUp,
  Sliders,
  DollarSign,
  Calendar,
  Percent,
  Shield,
  Loader2,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";

const today = new Date().toISOString().slice(0, 10);
const threeYearsAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3).toISOString().slice(0, 10);

export default function Backtesting() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedKey, setSelectedKey] = useState("sma_crossover");
  const [strategyParams, setStrategyParams] = useState<Record<string, number>>({ fast_period: 20, slow_period: 50 });

  const [form, setForm] = useState({
    name: "",
    symbol: "AAPL",
    start_date: threeYearsAgo,
    end_date: today,
    initial_capital: 100000,
    position_size_pct: 100,
    commission_pct: 0.1,
    slippage_pct: 0.05,
    stop_loss_pct: "",
    take_profit_pct: "",
    data_source: "auto",
  });

  const [busy, setBusy] = useState(false);
  const [loadingReopen, setLoadingReopen] = useState(false);
  const [searchParams] = useSearchParams();

  const toast = useToast();
  const navigate = useNavigate();

  // Load strategies and handle reopen/symbol query params
  useEffect(() => {
    getStrategies().then((data) => {
      setStrategies(data);
      const symbolParam = searchParams.get("symbol");
      if (symbolParam) {
        setForm((prev) => ({ ...prev, symbol: symbolParam.toUpperCase() }));
      }

      const reopenId = searchParams.get("reopen");
      if (reopenId) {
        setLoadingReopen(true);
        getBacktest(Number(reopenId))
          .then((prevRun) => {
            if (prevRun.config) {
              setForm({
                name: prevRun.name || `Clone of #${reopenId}`,
                symbol: prevRun.symbol,
                start_date: prevRun.config.start_date || threeYearsAgo,
                end_date: prevRun.config.end_date || today,
                initial_capital: prevRun.config.initial_capital || 100000,
                position_size_pct: prevRun.config.position_size_pct ?? 100,
                commission_pct: prevRun.config.commission_pct ?? 0.1,
                slippage_pct: prevRun.config.slippage_pct ?? 0.05,
                stop_loss_pct: prevRun.config.stop_loss_pct ? String(prevRun.config.stop_loss_pct) : "",
                take_profit_pct: prevRun.config.take_profit_pct ? String(prevRun.config.take_profit_pct) : "",
                data_source: prevRun.config.data_source || "auto",
              });
              setSelectedKey(prevRun.strategy);
              if (prevRun.config.strategy_params) {
                setStrategyParams(prevRun.config.strategy_params);
              }
              toast.info(`Prefilled simulation parameters from Backtest #${reopenId}.`, "Reopened");
            }
          })
          .catch(() => {
            toast.error("Could not load original backtest configuration.", "Reopen Error");
          })
          .finally(() => setLoadingReopen(false));
      } else if (data.length > 0) {
        setSelectedKey(data[0].key);
        setStrategyParams(data[0].default_params);
      }
    });
  }, [searchParams]);

  const chooseStrategy = (key: string) => {
    setSelectedKey(key);
    const strat = strategies.find((s) => s.key === key);
    if (strat) {
      setStrategyParams(strat.default_params);
    }
  };

  const applyPreset = (preset: "conservative" | "aggressive" | "standard") => {
    if (preset === "conservative") {
      setForm((prev) => ({
        ...prev,
        position_size_pct: 50,
        stop_loss_pct: "5",
        take_profit_pct: "12",
        commission_pct: 0.1,
        slippage_pct: 0.05,
      }));
      toast.info("Applied Conservative Risk profile (50% position, 5% stop loss, 12% profit target).");
    } else if (preset === "aggressive") {
      setForm((prev) => ({
        ...prev,
        position_size_pct: 100,
        stop_loss_pct: "",
        take_profit_pct: "",
        commission_pct: 0.1,
        slippage_pct: 0.05,
      }));
      toast.info("Applied Aggressive profile (100% full allocation, trend-following exits).");
    } else {
      setForm((prev) => ({
        ...prev,
        position_size_pct: 100,
        stop_loss_pct: "8",
        take_profit_pct: "20",
        commission_pct: 0.1,
        slippage_pct: 0.05,
      }));
      toast.info("Applied Standard profile.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      const payload = {
        name: form.name.trim() || undefined,
        symbol: form.symbol.trim().toUpperCase(),
        start_date: form.start_date,
        end_date: form.end_date,
        strategy: selectedKey,
        strategy_params: strategyParams,
        initial_capital: Number(form.initial_capital),
        position_size_pct: Number(form.position_size_pct),
        commission_pct: Number(form.commission_pct),
        slippage_pct: Number(form.slippage_pct),
        stop_loss_pct: form.stop_loss_pct === "" ? null : Number(form.stop_loss_pct),
        take_profit_pct: form.take_profit_pct === "" ? null : Number(form.take_profit_pct),
        long_only: true,
        data_source: form.data_source,
      };

      const result = await runBacktest(payload);
      toast.success(`Simulation completed successfully for ${result.symbol}!`, "Backtest Finished");
      navigate(`/results/${result.id}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Simulation could not be completed.", "Simulation Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Simulation Lab</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Backtesting Engine</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure look-ahead-free next-bar simulations with realistic transaction costs and risk thresholds.
          </p>
        </div>

        {/* Risk Profile Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset("standard")}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => applyPreset("conservative")}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            Conservative
          </button>
          <button
            type="button"
            onClick={() => applyPreset("aggressive")}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            Aggressive
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        {/* Market & Execution Parameters */}
        <Section title="Market & Execution Parameters" subtitle="Specify asset, timeframe, and account constraints">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Backtest Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AAPL Breakout Run"
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Symbol</label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    required
                    placeholder="AAPL, NVDA, SPY"
                    className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 pl-9 pr-3 text-xs font-bold uppercase text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="date"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 pl-9 pr-3 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
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
                    className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 pl-9 pr-3 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Capital ($)</label>
                <input
                  type="number"
                  required
                  min={100}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 px-3 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                  value={form.initial_capital}
                  onChange={(e) => setForm({ ...form, initial_capital: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Position Size (%)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 px-3 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                  value={form.position_size_pct}
                  onChange={(e) => setForm({ ...form, position_size_pct: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Data Source</label>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2 px-3 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                  value={form.data_source}
                  onChange={(e) => setForm({ ...form, data_source: e.target.value })}
                >
                  <option value="auto">Auto (Live with Fallback)</option>
                  <option value="demo">Demo / Offline Data Only</option>
                </select>
              </div>
            </div>

            {/* Friction & Risk Management */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} className="text-cyan-400" />
                <span>Transaction Costs & Risk Limits</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Commission (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="w-full rounded-lg border border-slate-800 bg-[#070D18] py-1.5 px-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    value={form.commission_pct}
                    onChange={(e) => setForm({ ...form, commission_pct: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Slippage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="w-full rounded-lg border border-slate-800 bg-[#070D18] py-1.5 px-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    value={form.slippage_pct}
                    onChange={(e) => setForm({ ...form, slippage_pct: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Stop Loss (%) (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    placeholder="None"
                    className="w-full rounded-lg border border-slate-800 bg-[#070D18] py-1.5 px-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    value={form.stop_loss_pct}
                    onChange={(e) => setForm({ ...form, stop_loss_pct: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Take Profit (%) (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    placeholder="None"
                    className="w-full rounded-lg border border-slate-800 bg-[#070D18] py-1.5 px-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    value={form.take_profit_pct}
                    onChange={(e) => setForm({ ...form, take_profit_pct: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Strategy Selection & Parameters */}
        <Section title="Strategy Model Selection" subtitle="Choose algorithmic logic and adjust parameters">
          <div className="space-y-4">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {strategies.map((strat) => {
                const isSelected = selectedKey === strat.key;
                return (
                  <button
                    type="button"
                    key={strat.key}
                    onClick={() => chooseStrategy(strat.key)}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-cyan-400/50 bg-cyan-500/10 shadow-sm shadow-cyan-500/10"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <b className={`text-xs ${isSelected ? "text-cyan-300" : "text-slate-200"}`}>{strat.name}</b>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">{strat.description}</div>
                  </button>
                );
              })}
            </div>

            {/* Strategy Parameter Inputs */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sliders size={14} className="text-cyan-400" />
                <span>Strategy Hyperparameters</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(strategyParams).map(([paramKey, val]) => (
                  <div key={paramKey}>
                    <label className="block text-[11px] capitalize text-slate-400 mb-1">
                      {paramKey.replaceAll("_", " ")}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="w-full rounded-lg border border-slate-800 bg-[#070D18] py-1.5 px-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                      value={String(val)}
                      onChange={(e) =>
                        setStrategyParams({
                          ...strategyParams,
                          [paramKey]: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            <button
              type="submit"
              disabled={busy || loadingReopen}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Executing Simulation On Completed Bars…</span>
                </>
              ) : (
                <>
                  <FlaskConical size={18} />
                  <span>Execute Quantitative Backtest</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
              <Info size={12} />
              <span>Simulated execution at bar t+1 open prevents look-ahead bias. No real money sent.</span>
            </div>
          </div>
        </Section>
      </form>
    </div>
  );
}
