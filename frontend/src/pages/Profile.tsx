import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { changePassword } from "../services/api";
import Section from "../components/Section";
import { User, ShieldCheck, Key, Lock, Mail, Calendar, CheckCircle2, Loader2, LogOut } from "lucide-react";

export default function Profile() {
  const { user, updateProfileName, logout } = useAuth();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty.", "Validation Error");
      return;
    }
    setUpdatingProfile(true);
    try {
      await updateProfileName(displayName.trim());
      toast.success("Profile updated successfully.", "Profile Saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update profile.", "Error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.", "Validation Error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.", "Mismatch");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success("Password changed successfully.", "Password Updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to change password.", "Error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Account & Security</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Trader Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Manage personal details, security credentials, and preferences.</p>
        </div>
        <button
          onClick={logout}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-[#0c1829] to-[#07111f] p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-2xl font-black text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            {user?.display_name?.charAt(0).toUpperCase() || "T"}
            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-slate-950">
              <CheckCircle2 size={12} strokeWidth={3} />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white">{user?.display_name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                Verified Trader
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={13} className="text-cyan-400" />
                {user?.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-cyan-400" />
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Details */}
        <Section title="Profile Information">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Registered Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 px-3.5 text-sm text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-slate-500">Email address cannot be modified once verified.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Display Name / Handle</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 disabled:opacity-50"
            >
              {updatingProfile ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>Saving…</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </form>
        </Section>

        {/* Change Password */}
        <Section title="Security Credentials">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#070D18] py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>Updating Password…</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </Section>
      </div>

      {/* Security Architecture Info */}
      <div className="rounded-2xl border border-slate-800/60 bg-[#0A1322]/50 p-6">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <ShieldCheck size={18} />
          <h3 className="text-sm font-bold text-slate-200">Security Architecture</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          AlgoTradeX uses PBKDF2-HMAC-SHA256 password hashing with 200,000 computational rounds, isolated database schemas,
          JWT session tokens, and cryptographic single-use OTP codes with 60-second rate limiting cooldowns.
        </p>
      </div>
    </div>
  );
}
