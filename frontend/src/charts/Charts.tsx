import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700/80 bg-[#091322]/95 p-3 shadow-2xl backdrop-blur-md">
        <div className="text-[11px] font-semibold text-slate-400 mb-1">{label}</div>
        {payload.map((entry: any, index: number) => {
          const val = formatter ? formatter(entry.value, entry.name) : entry.value;
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }} />
              <span className="text-slate-300 font-medium">{entry.name || "Value"}:</span>
              <span className="font-bold text-white">{val}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export function Equity({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-72 grid place-items-center text-xs text-slate-500">No equity data available</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} minTickGap={45} stroke="#334155" />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            stroke="#334155"
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          />
          <Tooltip
            content={<CustomTooltip formatter={(v: number) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />}
          />
          <Area
            type="monotone"
            name="Portfolio Equity"
            dataKey="value"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#equityGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Drawdown({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-48 grid place-items-center text-xs text-slate-500">No drawdown data available</div>;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.0} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} minTickGap={45} stroke="#334155" />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            stroke="#334155"
            domain={["auto", 0]}
            tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
          />
          <Tooltip
            content={<CustomTooltip formatter={(v: number) => `${Number(v).toFixed(2)}%`} />}
          />
          <Area
            type="monotone"
            name="Drawdown"
            dataKey="drawdown_pct"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fill="url(#ddGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Price({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-80 grid place-items-center text-xs text-slate-500">No price data available</div>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} minTickGap={45} stroke="#334155" />
          <YAxis
            yAxisId="price"
            tick={{ fill: "#64748b", fontSize: 10 }}
            stroke="#334155"
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
          />
          <YAxis
            yAxisId="vol"
            orientation="right"
            tick={false}
            stroke="transparent"
            domain={[0, (dataMax: number) => dataMax * 5]}
          />
          <Tooltip
            content={<CustomTooltip formatter={(v: number, name: string) => name === "Volume" ? Number(v).toLocaleString() : `$${Number(v).toFixed(2)}`} />}
          />
          <Bar yAxisId="vol" name="Volume" dataKey="volume" fill="#0284c7" opacity={0.15} radius={[2, 2, 0, 0]} />
          <Line
            yAxisId="price"
            type="monotone"
            name="Close Price"
            dataKey="close"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
