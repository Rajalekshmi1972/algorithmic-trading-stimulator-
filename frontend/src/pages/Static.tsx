import React from "react";
import Section from "../components/Section";
import { Settings as SettingsIcon, Info, ShieldCheck, Database, Server, Key, Terminal } from "lucide-react";
import { API_BASE } from "../services/api";

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Preferences & Configuration</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Environment parameters and API connectivity diagnostics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Backend Connectivity">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#070D18] p-3">
              <span className="text-slate-400">Target API Server</span>
              <span className="font-mono font-bold text-cyan-300">{API_BASE}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#070D18] p-3">
              <span className="text-slate-400">Environment File</span>
              <span className="font-mono text-slate-300">frontend/.env (VITE_API_URL)</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#070D18] p-3">
              <span className="text-slate-400">Health Endpoint</span>
              <a
                href={`${API_BASE}/health`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-cyan-400 hover:underline"
              >
                {API_BASE}/health
              </a>
            </div>
          </div>
        </Section>

        <Section title="Security & Email Configuration">
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              To enable live email dispatch for single-use verification codes and password resets, configure your SMTP credentials in <code className="text-cyan-300">backend/.env</code>:
            </p>
            <div className="rounded-xl border border-slate-800 bg-[#070D18] p-3 font-mono text-[11px] text-cyan-200/90 space-y-1">
              <div>SMTP_HOST=smtp.gmail.com</div>
              <div>SMTP_PORT=587</div>
              <div>SMTP_USER=your-email@gmail.com</div>
              <div>SMTP_PASSWORD=your-app-password</div>
              <div>SMTP_FROM_EMAIL=noreply@algotradex.io</div>
            </div>
            <p className="text-[11px] text-slate-400">
              When SMTP is unconfigured, AlgoTradeX runs in local developer mode and safely logs verification codes to the console for testing.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

export function About() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Platform Overview</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">About AlgoTradeX</h1>
        <p className="text-sm text-slate-400 mt-1">High-fidelity quantitative algorithmic trading simulator.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="System Architecture">
          <p className="text-xs leading-relaxed text-slate-300">
            AlgoTradeX separates data fetching, signal generation, execution simulation, and portfolio accounting into strictly decoupled layers:
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5 font-bold">1.</span>
              <span><strong>Look-Ahead Bias Elimination:</strong> Signals calculated at bar <em>t</em> are strictly executed at bar <em>t+1</em> open.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5 font-bold">2.</span>
              <span><strong>Frictional Realism:</strong> Configurable percentage-based commission and slippage deducted from cash balances.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5 font-bold">3.</span>
              <span><strong>Risk Bounds:</strong> Conservative stop loss and profit targets evaluated on intra-bar high/low extremes.</span>
            </li>
          </ul>
        </Section>

        <Section title="Educational & Research Notice">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 space-y-2 leading-relaxed">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck size={16} />
              <span>Educational Software Disclaimer</span>
            </div>
            <p>
              AlgoTradeX is developed strictly for research, algorithmic testing, and educational purposes.
              It does not execute live orders on production brokerage exchanges and does not constitute financial advice.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
