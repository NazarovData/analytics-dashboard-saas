"""
User Model
Модель пользователя для аутентификации и авторизации
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    """Модель пользователя"""
    id: int
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Модель для создания пользователя"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Модель для входа пользователя"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Модель ответа с данными пользователя"""
    id: int
    email: EmailStr
    is_active: bool
    is_superuser: bool
    full_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Модель токена"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Данные из токена"""
    email: Optional[str] = None
    user_id: Optional[int] = None
