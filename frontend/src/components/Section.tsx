import React, { type ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, subtitle, action, children, className = "" }: SectionProps) {
  return (
    <section className={`rounded-2xl border border-slate-800/80 bg-[#091322]/80 p-5 md:p-6 shadow-xl backdrop-blur-xl ${className}`}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/60 pb-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-100">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}