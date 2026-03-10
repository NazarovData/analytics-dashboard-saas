"""
Application configuration
"""
from typing import List, Optional
import os

# Try to import BaseSettings from pydantic_settings (pydantic v2)
# Fallback to pydantic BaseSettings for compatibility
try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        # Fallback: use a simple class if pydantic is not available
        class BaseSettings:
            pass


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Analitix AI API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
    )
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/analitix_ai"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_ENABLED: bool = os.getenv("REDIS_ENABLED", "True").lower() == "true"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "True").lower() == "true"
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    RATE_LIMIT_PER_HOUR: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "1000"))
    
    # File Upload
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
    ALLOWED_FILE_EXTENSIONS: List[str] = [".csv", ".xlsx", ".xls"]
    
    # Image Upload (OCR)
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".pdf"]
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "50"))
    OCR_USE_EASYOCR: bool = os.getenv("OCR_USE_EASYOCR", "True").lower() == "true"
    OCR_LANGUAGES: str = os.getenv("OCR_LANGUAGES", "rus+eng")  # For Tesseract
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE", "logs/app.log")
    LOG_JSON: bool = os.getenv("LOG_JSON", "False").lower() == "true"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-please-change-this-to-random-string")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # API Keys (optional)
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    
    # Claude AI (NEW! v2.0 - 100% точность)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    CLAUDE_ENABLED: bool = os.getenv("CLAUDE_ENABLED", "True").lower() == "true"  # ✅ Включен по умолчанию
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Get allowed origins as list"""
        if self.DEBUG or self.ENVIRONMENT == "development":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
