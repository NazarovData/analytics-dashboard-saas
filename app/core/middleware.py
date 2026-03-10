"""
Custom middleware for logging, rate limiting, and error handling
"""
import time
import uuid
from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from app.core.exceptions import RateLimitError
from app.core.config import settings

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging all requests"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        if "x-forwarded-for" in request.headers:
            client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
        
        # Start timer
        start_time = time.time()
        
        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "ip_address": client_ip,
                "user_agent": request.headers.get("user-agent", "unknown"),
            }
        )
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"Request completed: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "ip_address": client_ip,
                }
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{duration:.3f}s"
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            logger.error(
                f"Request failed: {request.method} {request.url.path} - {str(e)}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round(duration * 1000, 2),
                    "ip_address": client_ip,
                },
                exc_info=True
            )
            
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting"""
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self._redis_client = redis_client
        self.rate_limits = {}  # In-memory fallback if Redis unavailable
    
    async def get_redis_client(self, request: Request):
        """Get redis client from app state if available"""
        if self._redis_client:
            return self._redis_client
        # Try to get from app state (set in lifespan)
        # Access via request.app.state
        try:
            # Redis client is stored globally in main.py after lifespan initialization
            import app.main as main_module
            if hasattr(main_module, 'redis_client') and main_module.redis_client:
                return main_module.redis_client
        except Exception:
            pass
        return None
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Get client identifier
        client_id = request.client.host if request.client else "unknown"
        if "x-forwarded-for" in request.headers:
            client_id = request.headers["x-forwarded-for"].split(",")[0].strip()
        
        # Check rate limit
        try:
            redis = await self.get_redis_client(request)
            if redis:
                # Use Redis for distributed rate limiting
                current_minute = int(time.time() / 60)
                minute_key = f"rate_limit:{client_id}:minute:{current_minute}"
                hour_key = f"rate_limit:{client_id}:hour:{int(time.time() / 3600)}"
                
                # Check minute limit
                minute_count = await redis.get(minute_key)
                if minute_count and int(minute_count) >= settings.RATE_LIMIT_PER_MINUTE:
                    raise RateLimitError("Too many requests per minute")
                
                # Check hour limit
                hour_count = await redis.get(hour_key)
                if hour_count and int(hour_count) >= settings.RATE_LIMIT_PER_HOUR:
                    raise RateLimitError("Too many requests per hour")
                
                # Increment counters (use pipeline for atomicity)
                pipe = redis.pipeline()
                pipe.incr(minute_key)
                pipe.expire(minute_key, 60)
                pipe.incr(hour_key)
                pipe.expire(hour_key, 3600)
                await pipe.execute()
            else:
                # In-memory fallback
                current_time = time.time()
                current_minute = int(current_time / 60)
                
                if client_id not in self.rate_limits:
                    self.rate_limits[client_id] = {"minute": {}, "hour": {}}
                
                # Clean old entries
                self.rate_limits[client_id]["minute"] = {
                    k: v for k, v in self.rate_limits[client_id]["minute"].items()
                    if int(k) >= current_minute - 1
                }
                
                # Check minute limit
                minute_key = str(current_minute)
                minute_count = self.rate_limits[client_id]["minute"].get(minute_key, 0)
                if minute_count >= settings.RATE_LIMIT_PER_MINUTE:
                    raise RateLimitError("Too many requests per minute")
                
                self.rate_limits[client_id]["minute"][minute_key] = minute_count + 1
                
        except RateLimitError:
            raise
        except Exception as e:
            logger.warning(f"Rate limit check failed: {e}, allowing request")
        
        return await call_next(request)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for handling errors gracefully"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            # Log the error
            logger.error(
                f"Unhandled exception: {str(e)}",
                extra={
                    "path": request.url.path,
                    "method": request.method,
                },
                exc_info=True
            )
            
            # Return appropriate error response
            if hasattr(e, "status_code") and hasattr(e, "detail"):
                # It's already an HTTPException
                return JSONResponse(
                    status_code=e.status_code,
                    content={
                        "error": True,
                        "detail": e.detail,
                        "error_code": getattr(e, "error_code", None),
                    }
                )
            
            # Generic error response
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": True,
                    "detail": "An internal error occurred. Please try again later.",
                    "error_code": "INTERNAL_SERVER_ERROR",
                }
            )

