import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export default function MetricCard({ label, value, subValue, trend, icon }: MetricCardProps) {
  const isPositive =
    trend === "up" ||
    (typeof value === "string" && (value.startsWith("+") || (value.includes("%") && !value.startsWith("-"))));
  const isNegative =
    trend === "down" ||
    (typeof value === "string" && (value.startsWith("-") || label.toLowerCase().includes("drawdown")));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0c1829]/90 to-[#07111f]/90 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-slate-700/80 hover:shadow-cyan-500/5 group">
      {/* Subtle hover gradient glow */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {icon && <div className="text-slate-500 group-hover:text-cyan-400 transition-colors">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-2xl font-extrabold tracking-tight ${
            label.toLowerCase().includes("drawdown")
              ? "text-rose-400"
              : isPositive && !label.toLowerCase().includes("trades")
              ? "text-emerald-300"
              : isNegative
              ? "text-rose-400"
              : "text-white"
          }`}
        >
          {value}
        </span>
        {subValue && <span className="text-xs text-slate-500 font-medium">{subValue}</span>}
      </div>
    </div>
  );
}