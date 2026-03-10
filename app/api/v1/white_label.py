"""
🏷️ White Label настройки Analitix AI
Позволяет клиентам кастомизировать брендинг
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict, Any
from fastapi.responses import JSONResponse
import base64
import os

router = APIRouter(prefix="/white-label", tags=["white-label"])

class WhiteLabelSettings(BaseModel):
    """Настройки White Label"""
    company_name: str
    logo_url: Optional[str] = None
    primary_color: str = "#06b6d4"  # cyan
    secondary_color: str = "#8b5cf6"  # purple
    accent_color: str = "#f97316"  # orange
    favicon_url: Optional[str] = None
    custom_domain: Optional[str] = None
    custom_email_from: Optional[str] = None
    custom_support_email: Optional[str] = None
    custom_support_phone: Optional[str] = None
    hide_analitix_branding: bool = False
    custom_footer_text: Optional[str] = None
    custom_css: Optional[str] = None

# Хранилище (в production - БД)
_white_label_settings: Dict[str, WhiteLabelSettings] = {}

@router.get("/")
async def get_white_label_settings():
    """Получить настройки White Label"""
    default_settings = WhiteLabelSettings(
        company_name="Analitix AI",
        primary_color="#06b6d4",
        secondary_color="#8b5cf6",
        accent_color="#f97316"
    )
    
    # Возвращаем настройки пользователя или дефолтные
    user_id = "demo_user"  # В production из токена
    settings = _white_label_settings.get(user_id, default_settings)
    
    return {
        "success": True,
        "settings": settings.dict() if isinstance(settings, WhiteLabelSettings) else settings
    }

@router.put("/")
async def update_white_label_settings(settings: WhiteLabelSettings):
    """Обновить настройки White Label"""
    user_id = "demo_user"  # В production из токена
    
    _white_label_settings[user_id] = settings
    
    return {
        "success": True,
        "message": "Настройки White Label обновлены",
        "settings": settings.dict()
    }

@router.post("/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    """Загрузить логотип компании"""
    # Проверка формата
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Только изображения разрешены")
    
    # Читаем файл
    contents = await file.read()
    
    # Конвертируем в base64 для хранения (в production сохранять в S3/CDN)
    logo_base64 = base64.b64encode(contents).decode('utf-8')
    logo_url = f"data:image/{file.content_type.split('/')[1]};base64,{logo_base64}"
    
    # Обновляем настройки
    user_id = "demo_user"
    if user_id not in _white_label_settings:
        _white_label_settings[user_id] = WhiteLabelSettings(company_name="Analitix AI")
    
    _white_label_settings[user_id].logo_url = logo_url
    
    return {
        "success": True,
        "logo_url": logo_url,
        "message": "Логотип загружен успешно"
    }

@router.post("/upload-favicon")
async def upload_favicon(file: UploadFile = File(...)):
    """Загрузить favicon"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Только изображения разрешены")
    
    contents = await file.read()
    favicon_base64 = base64.b64encode(contents).decode('utf-8')
    favicon_url = f"data:image/{file.content_type.split('/')[1]};base64,{favicon_base64}"
    
    user_id = "demo_user"
    if user_id not in _white_label_settings:
        _white_label_settings[user_id] = WhiteLabelSettings(company_name="Analitix AI")
    
    _white_label_settings[user_id].favicon_url = favicon_url
    
    return {
        "success": True,
        "favicon_url": favicon_url,
        "message": "Favicon загружен успешно"
    }

@router.post("/custom-css")
async def update_custom_css(css: str):
    """Обновить кастомный CSS"""
    user_id = "demo_user"
    if user_id not in _white_label_settings:
        _white_label_settings[user_id] = WhiteLabelSettings(company_name="Analitix AI")
    
    _white_label_settings[user_id].custom_css = css
    
    return {
        "success": True,
        "message": "Кастомный CSS обновлён"
    }

@router.delete("/reset")
async def reset_white_label():
    """Сбросить White Label настройки"""
    user_id = "demo_user"
    if user_id in _white_label_settings:
        del _white_label_settings[user_id]
    
    return {
        "success": True,
        "message": "Настройки сброшены к дефолтным"
    }


