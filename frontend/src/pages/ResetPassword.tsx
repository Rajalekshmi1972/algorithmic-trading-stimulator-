import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Activity, Lock, KeyRound, ArrowRight, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit reset code.", "Invalid Code");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.", "Weak Password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.", "Password Mismatch");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({ email, code, new_password: newPassword });
      toast.success(res.message || "Password successfully updated! Please sign in.", "Password Reset");
      navigate("/login", { replace: true });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to reset password. Please check the code.", "Reset Failed");
    } finally {
      setLoading(false);
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
          <h1 className="text-xl font-bold text-slate-200">Set new password</h1>
          <p className="mt-1 text-xs text-slate-400">Enter your 6-digit reset code and choose a new secure password.</p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0A1322]/80 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">6-Digit Reset Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 pl-10 pr-4 text-sm font-mono tracking-widest text-cyan-300 placeholder-slate-700 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Updating Password…</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors">
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
