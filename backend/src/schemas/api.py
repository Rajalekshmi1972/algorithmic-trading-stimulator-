import re
from datetime import date, datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def validate_email_format(v: str) -> str:
    cleaned = v.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError("Invalid email address format.")
    return cleaned

# -------------------------------------------------------------
# Authentication & User Schemas
# -------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(default="Trader", min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_format(v)

class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_format(v)

class VerifyOtpRequest(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)
    purpose: str = Field(default="registration")

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_format(v)

class ResendOtpRequest(BaseModel):
    email: str
    purpose: str = Field(default="registration")

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_format(v)

class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_format(v)

class ResetPasswordRequest(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_format(v)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)

class UpdateProfileRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)

class UserOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    email: str
    display_name: str
    is_verified: bool
    created_at: datetime

class AuthResponse(BaseModel):
    token: str
    user: UserOut
    message: str = "Success"

# -------------------------------------------------------------
# Watchlist Schemas
# -------------------------------------------------------------

class WatchlistCreateRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=40)
    notes: Optional[str] = Field(default=None, max_length=255)

    @field_validator("symbol")
    @classmethod
    def clean_sym(cls, v: str) -> str:
        return v.strip().upper()

class WatchlistOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    symbol: str
    notes: Optional[str] = None
    created_at: datetime

# -------------------------------------------------------------
# Trading & Backtest Schemas (Preserved & Enhanced)
# -------------------------------------------------------------

class BacktestRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=150)
    symbol: str = Field(min_length=1, max_length=40)
    start_date: date
    end_date: date
    strategy: str
    strategy_params: dict[str, Any] = {}
    initial_capital: float = Field(gt=0)
    position_size_pct: float = Field(gt=0, le=100)
    commission_pct: float = Field(ge=0, le=10)
    slippage_pct: float = Field(ge=0, le=10)
    stop_loss_pct: float | None = Field(default=None, gt=0, le=100)
    take_profit_pct: float | None = Field(default=None, gt=0, le=100)
    long_only: bool = True
    data_source: str = "auto"

    @field_validator("symbol")
    @classmethod
    def sym(cls, v):
        return v.strip().upper()

    @field_validator("end_date")
    @classmethod
    def dates(cls, v, info):
        if info.data.get("start_date") and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v

class TradeOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int | None = None
    symbol: str
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    quantity: float
    pnl: float
    return_pct: float
    holding_period_days: int
    signal: str
    strategy_key: str

class EquityOut(BaseModel):
    date: str
    value: float
    drawdown_pct: float

class PointOut(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class BacktestOut(BaseModel):
    id: int | None
    name: str | None = None
    symbol: str
    strategy: str
    data_source: str
    metrics: dict[str, float]
    trades: list[TradeOut]
    equity: list[EquityOut]
    prices: list[PointOut]
    signals: list[dict[str, Any]]
    config: dict[str, Any]
    created_at: str | None = None

class CompareRequest(BaseModel):
    symbol: str
    start_date: date
    end_date: date
    strategies: list[dict[str, Any]]
    initial_capital: float = 100000
    position_size_pct: float = 100
    commission_pct: float = .1
    slippage_pct: float = .05
