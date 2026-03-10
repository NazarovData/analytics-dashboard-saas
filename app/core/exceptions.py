"""
Custom exceptions for the application
"""
from fastapi import HTTPException


class BaseAPIException(HTTPException):
    """Base exception for all API errors"""
    def __init__(self, status_code: int = 500, detail: str = "An error occurred", error_code: str = None):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code or "API_ERROR"
        self.status_code = status_code
        self.detail = detail


class FileProcessingError(HTTPException):
    """Error during file processing"""
    def __init__(self, detail: str = "File processing failed"):
        super().__init__(status_code=500, detail=detail)


class FileSizeError(HTTPException):
    """File size exceeds limit"""
    def __init__(self, max_size_mb: int, detail: str = None):
        detail = detail or f"File size exceeds maximum allowed size of {max_size_mb}MB"
        super().__init__(status_code=413, detail=detail)


class ValidationError(HTTPException):
    """Data validation error"""
    def __init__(self, detail: str, field: str = None):
        if field:
            detail = f"Validation error in field '{field}': {detail}"
        super().__init__(status_code=422, detail=detail)


class RateLimitError(HTTPException):
    """Rate limit exceeded"""
    def __init__(self, detail: str = "Rate limit exceeded. Please try again later."):
        super().__init__(status_code=429, detail=detail)




