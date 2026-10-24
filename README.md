# AlgoTradeX — Quantitative Trading Simulator & Strategy Platform

A polished, full-stack algorithmic trading simulator and research platform built with **Python**, **FastAPI**, **SQLAlchemy**, **SQLite/PostgreSQL**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Vite**.

> **Disclaimer:** AlgoTradeX is educational and quantitative research software. It does not execute live orders on production exchanges and does not provide financial advice. Historical simulation results do not guarantee future performance.

---

## Key Features

### 1. Robust Authentication & Security
- **Registration & Login**: Secure credential authentication using PBKDF2-HMAC-SHA256 with 200,000 computational rounds.
- **Email OTP Verification**: Real SMTP email delivery of single-use 6-digit codes with 10-minute expiration, 60-second resend cooldowns, and brute-force attempt limits.
- **Password Reset**: Secure forgot-password flow with email OTP authorization.
- **Session Tokens**: Cryptographically signed HS256 JWT tokens.
- **User Profile**: Account management, display name modification, and password updating.
- **Protected Routes**: Frontend route guarding ensuring private strategy and portfolio data access.

### 2. Premium Fintech User Interface
- **Modern Dark Palette**: Obsidian and deep slate styling with vibrant cyan and emerald accents.
- **KPI Metrics**: Real-time performance indicators for Portfolio Value, Total Return, CAGR, Sharpe Ratio, Sortino Ratio, Max Drawdown, Win Rate, and Profit Factor.
- **Interactive Visualizations**: Area equity curves with gradient fills, intra-period drawdown charts, and OHLCV price action with volume bars.
- **Responsive Layout**: Mobile-friendly slide-over navigation drawer and persistent desktop sidebar.
- **Toast Notifications**: Floating feedback system for user actions and errors.

### 3. Quantitative Simulation Engine
- **Look-Ahead Bias Elimination**: Trading signals generated on completed bar $t$ execute strictly at bar $t+1$ open.
- **Frictional Costs**: Configurable percentage-based broker commissions and execution slippage.
- **Risk Bounds**: Intra-bar Stop Loss and Take Profit threshold monitoring.
- **Strategy Models**:
  - Moving Average Crossover (Fast/Slow SMA)
  - Relative Strength Index (RSI) with oversold/overbought bounds
  - Bollinger Bands with standard deviation bands
  - Moving Average Convergence Divergence (MACD)
  - Lookback Momentum Threshold
- **Multi-Strategy Comparison**: Side-by-side performance evaluation, return rankings, bar chart visualizations, and CSV export.
- **Data Integrity**: Transparent labeling distinguishing live Yahoo Finance feeds from benchmark historical fallback data.
- **Simulation Management**: Save, clone/reopen, export to CSV, and delete backtests with user authorization.
- **Watchlists**: Track symbols with custom quantitative research notes and one-click backtest triggers.

---

## Windows Setup & Installation

### Prerequisites
- **Python 3.11+** installed and added to `%PATH%`.
- **Node.js 20.19+** and **npm** installed.

### 1. Backend Setup

Open a PowerShell terminal:

```powershell
cd AlgoTradeX\backend

# 1. Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# 2. Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 3. Configure environment variables
Copy-Item .env.example .env

# 4. Run database initialization and start API server
python -m uvicorn src.main:app --reload --port 8000
```

The FastAPI backend will start at:
- **API Base**: `http://localhost:8000`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

### 2. Frontend Setup

Open a second PowerShell terminal:

```powershell
cd AlgoTradeX\frontend

# 1. Install Node.js packages
npm install

# 2. Configure environment variables
Copy-Item .env.example .env

# 3. Start the Vite development server
npm run dev
```

Open your browser to:
- **Web Application**: `http://localhost:5173`

---

## Database Configuration

The application database layer is defined in `src/database/session.py` and aliased at `src/database/db.py`:

```python
from src.database.db import get_db, SessionLocal, Base, engine
```

### SQLite (Default)
By default, the database is stored locally in `backend/algotradex.db`:
```env
DATABASE_URL=sqlite:///./algotradex.db
```
When starting the server, `init_db()` automatically runs metadata creation and lightweight column migrations without breaking existing data.

### PostgreSQL
To switch to PostgreSQL, install `psycopg2-binary` and update `DATABASE_URL`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/algotradex
```

---

## Email Provider Setup (Real OTP Delivery)

AlgoTradeX includes a real SMTP delivery engine in `src/services/email_service.py`.

### 1. Gmail Setup
1. Enable 2-Factor Authentication on your Google account.
2. Go to **Security → App Passwords** and generate a 16-character app password.
3. In `backend/.env`, configure:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-account@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM_EMAIL=your-account@gmail.com
   SMTP_FROM_NAME="AlgoTradeX Security"
   SMTP_TLS=true
   ```

### 2. SendGrid / Mailgun / Amazon SES
Configure standard SMTP credentials:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=verify@yourdomain.com
SMTP_TLS=true
```

### 3. Local Development / Test Mode
If `SMTP_HOST` is left empty:
- The system logs an explicit warning: `[EMAIL SERVICE] SMTP not configured...`.
- Generated single-use OTP codes are securely output in the server console and provided in test API responses (`debug_code`), allowing local development and testing without hardcoded credentials.

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./algotradex.db` | SQLAlchemy connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed browser origins |
| `DEMO_MODE` | `false` | Force bundled offline historical data |
| `YFINANCE_CACHE_TTL_SECONDS` | `900` | Price data cache expiry |
| `SECRET_KEY` | *(Secret String)* | HS256 JWT cryptographic signing key |
| `TOKEN_EXPIRE_MINUTES` | `10080` | Session lifetime (7 days) |
| `SMTP_HOST` | *(Empty)* | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port (587 for STARTTLS) |
| `SMTP_USER` | *(Empty)* | SMTP authentication username |
| `SMTP_PASSWORD` | *(Empty)* | SMTP authentication password |
| `SMTP_FROM_EMAIL` | `noreply@algotradex.io` | Outgoing sender address |
| `SMTP_TLS` | `true` | Use TLS encryption |
| `OTP_EXPIRE_MINUTES` | `10` | Verification code validity |
| `OTP_RESEND_COOLDOWN_SECONDS` | `60` | Cooldown period between resend requests |
| `OTP_MAX_ATTEMPTS` | `5` | Maximum failed attempts before code lockout |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base address |

---

## Running Verification Tests & Building

### 1. Backend Pytest Suite
Run the 40+ unit and integration tests:

```powershell
cd AlgoTradeX\backend
.\.venv\Scripts\activate
pytest -v
```

### 2. Frontend Production Build
Validate TypeScript types and bundle production assets:

```powershell
cd AlgoTradeX\frontend
npm run build
```

---

## Project Structure

```text
AlgoTradeX/
├── backend/
│   ├── data/
│   │   └── demo_prices.csv
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth_routes.py        # Authentication & profile endpoints
│   │   │   └── routes.py             # Trading, backtesting, & watchlist endpoints
│   │   ├── backtesting/
│   │   │   ├── engine.py             # Next-bar look-ahead-free execution engine
│   │   │   └── metrics.py            # Sharpe, Sortino, Drawdown, CAGR metrics
│   │   ├── data/
│   │   │   └── market_data.py        # Yahoo Finance provider with demo fallback
│   │   ├── database/
│   │   │   ├── session.py            # Engine, sessionmaker, & auto migrations
│   │   │   └── db.py                 # Public database alias module
│   │   ├── models/
│   │   │   └── entities.py           # User, EmailOTP, Watchlist, Backtest models
│   │   ├── schemas/
│   │   │   └── api.py                # Pydantic schemas with regex email validation
│   │   ├── services/
│   │   │   ├── auth_service.py       # PBKDF2 hashing, JWT signing, OTP validation
│   │   │   ├── email_service.py      # Real SMTP email dispatcher
│   │   │   ├── backtest_service.py   # Backtest runner & database persistence
│   │   │   └── seed.py               # Built-in strategy seeder
│   │   ├── strategies/
│   │   │   ├── base.py               # Abstract base strategy
│   │   │   ├── factory.py            # Strategy registry
│   │   │   └── implementations.py    # SMA, RSI, Bollinger, MACD, Momentum
│   │   ├── config.py                 # Application settings
│   │   └── main.py                   # FastAPI lifespan application entrypoint
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_api.py               # Health & API basic tests
│   │   ├── test_engine.py            # Engine execution tests
│   │   ├── test_metrics.py           # Mathematical calculation tests
│   │   ├── test_strategies.py        # Signal generation tests
│   │   ├── test_auth.py              # Auth, OTP, rate-limiting, reset tests
│   │   ├── test_watchlist_and_features.py # Watchlist, deletion, CSV export tests
│   │   ├── test_advanced_coverage.py # Stop loss, edge case, and auth rejection tests
│   │   └── test_unit_suite.py        # 20 parameter, validator, and lockout tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── charts/
│   │   │   └── Charts.tsx            # Equity, Drawdown, Price & Bar charts
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Modern fintech sidebar & responsive header
│   │   │   ├── MetricCard.tsx        # KPI metrics card with trend indicators
│   │   │   ├── ProtectedRoute.tsx    # Session-guarded route wrapper
│   │   │   └── Section.tsx           # Glass card container with action slots
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Global authentication state & methods
│   │   │   └── ToastContext.tsx      # Floating toast notification system
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Sign in with email & password
│   │   │   ├── Register.tsx          # Account creation with password meter
│   │   │   ├── VerifyOtp.tsx         # 6-digit OTP verification with 60s cooldown
│   │   │   ├── ForgotPassword.tsx    # Password reset code request
│   │   │   ├── ResetPassword.tsx     # OTP-verified password reset
│   │   │   ├── Dashboard.tsx         # Main analytics dashboard & recent runs
│   │   │   ├── Backtesting.tsx       # Simulation runner with presets & clone support
│   │   │   ├── Results.tsx           # Saved runs ledger with filtering & deletion
│   │   │   ├── ResultDetail.tsx      # Deep-dive metrics, charts, & trade log
│   │   │   ├── Comparison.tsx        # Multi-strategy comparison & radar visualizer
│   │   │   ├── Trades.tsx            # Aggregated trade execution history
│   │   │   ├── Watchlist.tsx         # Tracked instruments with notes & quick simulate
│   │   │   ├── Market.tsx            # OHLCV price exploration & timeframes
│   │   │   ├── Profile.tsx           # User settings, handle updates, password change
│   │   │   └── Static.tsx            # Settings & About pages
│   │   ├── services/
│   │   │   └── api.ts                # Axios client with JWT interceptor
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interface definitions
│   │   ├── App.tsx                   # Master router with protected routes
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts             # Vite client type definitions
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## License & Attribution
Designed and built for quantitative finance research and algorithmic trading education.
