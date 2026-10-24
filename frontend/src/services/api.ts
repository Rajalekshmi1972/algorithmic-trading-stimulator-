import axios from "axios";
import type {
  AuthResponse,
  BacktestResult,
  BacktestSummary,
  Strategy,
  User,
  WatchlistItem,
} from "../types";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// Attach Authorization Bearer token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("algotradex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication APIs
export const registerUser = async (data: {
  email: string;
  password: string;
  display_name: string;
}) => (await api.post("/api/auth/register", data)).data;

export const verifyOtp = async (data: {
  email: string;
  code: string;
  purpose?: string;
}): Promise<AuthResponse> => (await api.post("/api/auth/verify-otp", data)).data;

export const resendOtp = async (data: {
  email: string;
  purpose?: string;
}) => (await api.post("/api/auth/resend-otp", data)).data;

export const loginUser = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => (await api.post("/api/auth/login", data)).data;

export const forgotPassword = async (data: { email: string }) =>
  (await api.post("/api/auth/forgot-password", data)).data;

export const resetPassword = async (data: {
  email: string;
  code: string;
  new_password: string;
}) => (await api.post("/api/auth/reset-password", data)).data;

export const getMe = async (): Promise<User> =>
  (await api.get("/api/auth/me")).data;

export const updateProfile = async (data: { display_name: string }): Promise<User> =>
  (await api.put("/api/auth/profile", data)).data;

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => (await api.post("/api/auth/change-password", data)).data;

export const logoutUser = async () =>
  (await api.post("/api/auth/logout")).data;

// Strategy & Backtesting APIs
export const getStrategies = async (): Promise<Strategy[]> =>
  (await api.get("/api/strategies")).data;

export const getBacktests = async (mine: boolean = false): Promise<BacktestSummary[]> =>
  (await api.get("/api/backtests", { params: { mine } })).data;

export const getBacktest = async (id: number): Promise<BacktestResult> =>
  (await api.get(`/api/backtests/${id}`)).data;

export const runBacktest = async (p: any): Promise<BacktestResult> =>
  (await api.post("/api/backtest", p)).data;

export const deleteBacktest = async (id: number): Promise<{ status: string; message: string }> =>
  (await api.delete(`/api/backtests/${id}`)).data;

export const getExportUrl = (id: number): string =>
  `${API_BASE}/api/backtests/${id}/export`;

export const compareStrategies = async (p: any) =>
  (await api.post("/api/compare", p)).data;

export const getMarket = async (s: string, a: string, b: string, source: string = "auto") =>
  (
    await api.get(`/api/market/${encodeURIComponent(s)}`, {
      params: { start: a, end: b, source },
    })
  ).data;

// Watchlist APIs
export const getWatchlist = async (): Promise<WatchlistItem[]> =>
  (await api.get("/api/watchlist")).data;

export const addToWatchlist = async (symbol: string, notes?: string): Promise<WatchlistItem> =>
  (await api.post("/api/watchlist", { symbol, notes })).data;

export const removeFromWatchlist = async (symbol: string): Promise<{ status: string }> =>
  (await api.delete(`/api/watchlist/${encodeURIComponent(symbol)}`)).data;

export default api;