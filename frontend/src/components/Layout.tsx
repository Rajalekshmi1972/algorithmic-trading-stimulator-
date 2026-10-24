import React, { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  BarChart3,
  Bot,
  Database,
  FlaskConical,
  GitCompare,
  History,
  Info,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Bookmark,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Radio,
} from "lucide-react";

const NAV_ITEMS = [
  { section: "QUANT LAB" },
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/backtesting", label: "Backtesting", icon: FlaskConical },
  { to: "/comparison", label: "Strategy Comparison", icon: GitCompare },
  { to: "/results", label: "Results Archive", icon: History },
  { to: "/trades", label: "Trade History", icon: BarChart3 },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/market", label: "Market Data", icon: Database },
  { section: "SYSTEM" },
  { to: "/strategies", label: "Strategy Models", icon: Bot },
  { to: "/profile", label: "Profile & Security", icon: UserIcon },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About AlgoTradeX", icon: Info },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 border-r border-slate-800/80 bg-[#091322] flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/70">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white">AlgoTrade<span className="text-cyan-400">X</span></span>
                <span className="rounded bg-cyan-400/10 px-1 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-400/20">PRO</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">Quantitative Lab</div>
            </div>
            <button
              className="ml-auto text-slate-400 hover:text-white md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {NAV_ITEMS.map((item, idx) => {
              if (item.section) {
                return (
                  <div key={idx} className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.section}
                  </div>
                );
              }

              const Icon = item.icon!;
              return (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  end={item.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer in Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070e1a]/80">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <Link to="/profile" className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                {user?.display_name?.charAt(0).toUpperCase() || "T"}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-200">{user?.display_name || "Trader"}</div>
                <div className="truncate text-[10px] text-slate-500">{user?.email || "trader@algotradex.io"}</div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between px-2 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1 text-amber-300/80">
              <ShieldCheck size={12} />
              Educational Mode
            </span>
            <span>v1.1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 h-16 border-b border-slate-800/80 bg-[#050B14]/90 px-4 md:px-8 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">Algorithmic Simulation Workspace</div>
                <div className="text-[10px] text-slate-500">High-Fidelity Next-Bar Execution Engine</div>
              </div>
            </div>

            {/* Right Status Indicators */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Radio size={12} className="animate-pulse text-emerald-400" />
                <span>Market Feed Active</span>
              </div>

              <Link
                to="/backtesting"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <FlaskConical size={14} />
                <span>New Backtest</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
