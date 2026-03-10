"""
Analitix AI - Main FastAPI Application
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.core.middleware import LoggingMiddleware, RateLimitMiddleware, ErrorHandlingMiddleware
from app.core.exceptions import BaseAPIException
from app.services.cache import CacheService

# Setup logging
setup_logging(
    log_level=settings.LOG_LEVEL,
    log_file=settings.LOG_FILE if not settings.DEBUG else None,
    use_json=settings.LOG_JSON,
)

logger = get_logger(__name__)

# Initialize Redis if available
redis_client = None
if settings.REDIS_ENABLED:
    try:
        import aioredis
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        logger.info("✅ Redis connection established")
    except Exception as e:
        logger.warning(f"⚠️ Redis not available: {e}. Using in-memory fallback.")
        redis_client = None

# Initialize cache service
cache_service = CacheService(redis_client=redis_client)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    global redis_client
    
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Initialize Redis if enabled
    if settings.REDIS_ENABLED:
        try:
            import aioredis
            redis_client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await redis_client.ping()
            logger.info("✅ Redis connection established and verified")
            # Update cache service
            from app.services.cache import CacheService
            app.state.cache_service = CacheService(redis_client=redis_client)
        except Exception as e:
            logger.warning(f"⚠️ Redis not available: {e}. Using in-memory fallback.")
            redis_client = None
            from app.services.cache import CacheService
            app.state.cache_service = CacheService(redis_client=None)
    else:
        logger.info("Redis disabled in configuration")
        from app.services.cache import CacheService
        app.state.cache_service = CacheService(redis_client=None)
    
    yield
    
    # Shutdown
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Business Analytics Dashboard API",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add custom middleware (order matters!)
# Note: Middleware is added here but redis_client will be set in lifespan
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)
if settings.RATE_LIMIT_ENABLED:
    # RateLimitMiddleware will get redis_client from app.state in lifespan
    app.add_middleware(RateLimitMiddleware, redis_client=None)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "environment": settings.ENVIRONMENT,
    }

@app.get("/health")
async def health_check():
    """Enhanced health check with dependency verification"""
    health_status = {
        "status": "healthy",
        "service": "analitix-ai",
        "version": settings.APP_VERSION,
        "checks": {}
    }
    
    # Check Redis
    if settings.REDIS_ENABLED:
        try:
            if redis_client:
                await redis_client.ping()
                health_status["checks"]["redis"] = "healthy"
            else:
                health_status["checks"]["redis"] = "not_configured"
        except Exception as e:
            health_status["checks"]["redis"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"
    else:
        health_status["checks"]["redis"] = "disabled"
    
    # Check database
    try:
        from app.core.database import engine
        if engine:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            health_status["checks"]["database"] = "healthy"
        else:
            health_status["checks"]["database"] = "not_configured"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check disk space (basic)
    try:
        import shutil
        total, used, free = shutil.disk_usage("/")
        free_gb = free / (1024**3)
        health_status["checks"]["disk_space_gb"] = round(free_gb, 2)
        if free_gb < 1:
            health_status["status"] = "degraded"
    except Exception:
        pass  # Skip on Windows or if not available
    
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)

# Include routers

# Базовые роутеры аутентификации и пользователей не зависят от pandas,
# поэтому импортируем их отдельно, чтобы они всегда были доступны.
from app.api.v1 import auth, users

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["auth"],
)

app.include_router(
    users.router,
    prefix="/api/v1/users",
    tags=["users"],
)

_optional_routers = [
    ("app.api.v1.files", "/api/v1/files", ["files"]),
    ("app.api.v1.integrations", "/api/v1/integrations", ["integrations"]),
    ("app.api.v1.bi", "/api/v1", ["bi"]),
    ("app.api.v1.advanced", "/api/v1/advanced", ["advanced"]),
    ("app.api.v1.ab_testing", "/api/v1/ab", ["ab-testing"]),
    ("app.api.v1.dashboard_config", "/api/v1/dashboard", ["dashboard-config"]),
    ("app.api.v1.integrations_sync", "/api/v1/sync", ["real-time-sync"]),
    ("app.api.v1.alerts", "/api/v1", ["alerts"]),
    ("app.api.v1.period_comparison", "/api/v1", ["period-comparison"]),
    ("app.api.v1.white_label", "/api/v1", ["white-label"]),
    ("app.api.v1.business_metrics", "/api/v1/business", ["business-metrics"]),
    ("app.api.v1.abc_analysis", "/api/v1/abc", ["abc-analysis"]),
    ("app.api.v1.file_history", "/api/v1/files", ["file-history"]),
    ("app.api.v1.export", "/api/v1/export", ["export"]),
    ("app.api.v1.geo_analytics", None, ["geo-analytics"]),
    ("app.api.v1.auth_2fa", None, ["2fa"]),
    ("app.api.v1.charts", "/api/v1", ["charts"]),
    ("app.api.v1.ai_chat", "/api/v1/ai", ["ai-chat"]),
    ("app.api.v1.mapper", "/api/v1/mapper", ["csv-mapper"]),
]

import importlib

for module_path, prefix, tags in _optional_routers:
    try:
        mod = importlib.import_module(module_path)
        kwargs = {"tags": tags}
        if prefix:
            kwargs["prefix"] = prefix
        app.include_router(mod.router, **kwargs)
    except Exception as e:
        logger.warning(f"Router {module_path} not available: {e}")

# Error handlers
@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    """Handle custom API exceptions"""
    logger.error(
        f"API Exception: {exc.error_code} - {exc.detail}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "path": request.url.path,
        }
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "detail": exc.detail,
            "error_code": exc.error_code,
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method,
        },
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "detail": "An internal error occurred. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR",
        }
    )

# Cache service will be set in lifespan

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_config=None,  # Use our custom logging
    )

