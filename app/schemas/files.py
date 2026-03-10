"""
Pydantic schemas for file validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from enum import Enum


class FileType(str, Enum):
    """Supported file types"""
    CSV = "csv"
    XLSX = "xlsx"
    XLS = "xls"
    IMAGE = "image"
    PDF = "pdf"


class FileUploadResponse(BaseModel):
    """Response schema for file upload"""
    success: bool
    message: str
    file_id: Optional[str] = None
    row_count: Optional[int] = None
    columns: Optional[List[str]] = None


class FileValidationResult(BaseModel):
    """Result of file validation"""
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    file_size_mb: float
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    detected_columns: Optional[List[str]] = None


def validate_file_size(file_size_bytes: int, max_size_mb: int) -> tuple[bool, Optional[str]]:
    """
    Validate file size
    
    Args:
        file_size_bytes: File size in bytes
        max_size_mb: Maximum allowed size in MB
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    file_size_mb = file_size_bytes / (1024 * 1024)
    
    if file_size_bytes > max_size_bytes:
        return False, f"File size ({file_size_mb:.2f} MB) exceeds maximum allowed size ({max_size_mb} MB)"
    
    return True, None


def validate_file_extension(filename: str, allowed_extensions: List[str]) -> tuple[bool, Optional[str]]:
    """
    Validate file extension
    
    Args:
        filename: Name of the file
        allowed_extensions: List of allowed extensions (with dot, e.g., [".csv", ".xlsx"])
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not filename:
        return False, "Filename is required"
    
    file_ext = None
    for ext in allowed_extensions:
        if filename.lower().endswith(ext.lower()):
            file_ext = ext
            break
    
    if not file_ext:
        return False, f"File extension not allowed. Allowed extensions: {', '.join(allowed_extensions)}"
    
    return True, None


def validate_csv_structure(df, min_rows: int = 1, min_columns: int = 2) -> tuple[bool, List[str]]:
    """
    Validate CSV structure
    
    Args:
        df: Pandas DataFrame
        min_rows: Minimum required rows
        min_columns: Minimum required columns
    
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    if df.empty:
        errors.append("File is empty")
        return False, errors
    
    if len(df) < min_rows:
        errors.append(f"File must contain at least {min_rows} row(s)")
    
    if len(df.columns) < min_columns:
        errors.append(f"File must contain at least {min_columns} column(s)")
    
    # Check for completely empty rows
    empty_rows = df.isnull().all(axis=1).sum()
    if empty_rows == len(df):
        errors.append("All rows are empty")
    
    return len(errors) == 0, errors




