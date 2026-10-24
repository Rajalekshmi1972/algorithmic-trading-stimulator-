import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Activity, KeyRound, ArrowRight, Loader2, RefreshCw, MailCheck, AlertCircle } from "lucide-react";

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";
  const purpose = searchParams.get("purpose") || "registration";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { verifyOtp, resendOtp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code.", "Invalid Code");
      return;
    }

    setLoading(true);

    try {
      await verifyOtp(email, code, purpose);
      toast.success("Email verified successfully! Welcome to AlgoTradeX.", "Verification Complete");
      navigate("/", { replace: true });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Verification failed. Check the code and try again.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);

    try {
      const res = await resendOtp(email, purpose);
      toast.info(res.message || "A fresh code has been dispatched.", "Code Resent");
      setCooldown(60);
      if (res.debug_code) {
        setCode(res.debug_code);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to resend code. Please try again later.", "Resend Failed");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050B14] p-4 text-slate-100">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Activity size={26} />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-white">AlgoTrade<span className="text-cyan-400">X</span></span>
              <div className="text-[10px] font-semibold tracking-[0.25em] uppercase text-cyan-500">Security Gate</div>
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-200">Email Verification</h1>
          <p className="mt-1 text-xs text-slate-400">
            A single-use 6-digit security code was dispatched to:
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <MailCheck size={14} />
            <span>{email || "your email address"}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0A1322]/80 p-8 shadow-2xl backdrop-blur-xl">
          {initialCode && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Local Development Mode:</strong> SMTP unconfigured. Code pre-filled:{" "}
                <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono font-bold">{initialCode}</code>
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            {!initialEmail && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  placeholder="your-email@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                Enter 6-digit verification code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  className="w-full rounded-xl border border-slate-700 bg-[#070D18] py-3 text-center text-2xl font-black tracking-[0.5em] text-cyan-300 placeholder-slate-700 transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Code expires in 10 minutes</span>
                <span>Single-use security code</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Verifying Code…</span>
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  <span>Verify & Proceed</span>
                </>
              )}
            </button>
          </form>

          {/* Resend Cooldown Section */}
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <p className="text-xs text-slate-400 mb-2">Didn't receive the email? Check spam or resend.</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Verification Code"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-400">
              ← Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
