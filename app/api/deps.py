"""
API Dependencies
Зависимости для API endpoints (аутентификация, авторизация)
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime

from app.core.config import settings
from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Получение текущего пользователя из JWT токена
    
    Args:
        credentials: HTTP Bearer токен
        
    Returns:
        User: Объект пользователя
        
    Raises:
        HTTPException: Если токен невалидный или истек
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        # Проверка срока действия токена
        exp = payload.get("exp")
        if exp is None:
            raise credentials_exception
            
        if datetime.utcnow().timestamp() > exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # В реальном приложении здесь нужно получить пользователя из БД
        # Для демо создаем объект пользователя из токена
        user = User(
            id=int(user_id),
            email=payload.get("email", ""),
            is_active=True,
            is_superuser=False
        )
        
        return user
        
    except JWTError:
        raise credentials_exception
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Получение текущего активного пользователя
    
    Args:
        current_user: Текущий пользователь из токена
        
    Returns:
        User: Активный пользователь
        
    Raises:
        HTTPException: Если пользователь неактивен
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Получение текущего суперпользователя
    
    Args:
        current_user: Текущий пользователь из токена
        
    Returns:
        User: Суперпользователь
        
    Raises:
        HTTPException: Если пользователь не суперпользователь
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[User]:
    """
    Получение пользователя если токен предоставлен (опционально)
    
    Args:
        credentials: HTTP Bearer токен (опционально)
        
    Returns:
        Optional[User]: Объект пользователя или None
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        user = User(
            id=int(user_id),
            email=payload.get("email", ""),
            is_active=True,
            is_superuser=False
        )
        
        return user
        
    except Exception:
        return None
