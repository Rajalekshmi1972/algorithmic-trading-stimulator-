export type User = {
  id: number;
  email: string;
  display_name: string;
  is_verified: boolean;
  created_at: string;
};

export type AuthResponse = {
  token: string;
  user: User;
  message: string;
};

export type WatchlistItem = {
  id: number;
  symbol: string;
  notes?: string | null;
  created_at: string;
};

export type Strategy = {
  key: string;
  name: string;
  description: string;
  default_params: Record<string, number>;
};

export type MarketPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Trade = {
  id?: number;
  symbol: string;
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  return_pct: number;
  holding_period_days: number;
  signal: string;
  strategy_key: string;
};

export type EquityPoint = {
  date: string;
  value: number;
  drawdown_pct: number;
};

export type BacktestResult = {
  id: number | null;
  name?: string | null;
  symbol: string;
  strategy: string;
  data_source: string;
  metrics: Record<string, number>;
  trades: Trade[];
  equity: EquityPoint[];
  prices: MarketPoint[];
  signals: any[];
  config: any;
  created_at?: string | null;
};

export type BacktestSummary = {
  id: number;
  name?: string | null;
  symbol: string;
  strategy: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  data_source: string;
  user_id?: number | null;
  created_at: string;
};

export type NotificationType = "success" | "error" | "info" | "warning";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
};
