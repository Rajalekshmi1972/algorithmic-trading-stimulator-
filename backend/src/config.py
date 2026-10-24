from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./algotradex.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    demo_mode: bool = False
    yfinance_cache_ttl_seconds: int = 900
    
    # Security & Auth
    secret_key: str = "algotradex-super-secret-key-change-in-production-2025"
    token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # SMTP / Email Service
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@algotradex.io"
    smtp_from_name: str = "AlgoTradeX Platform"
    smtp_tls: bool = True
    
    # OTP Configuration
    otp_expire_minutes: int = 10
    otp_resend_cooldown_seconds: int = 60
    otp_max_attempts: int = 5
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
