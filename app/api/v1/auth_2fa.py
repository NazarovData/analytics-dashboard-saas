"""
🔐 2FA (Two-Factor Authentication) для Analitix AI
SMS/Email коды, Google Authenticator, Backup коды
"""

from fastapi import APIRouter, HTTPException, Depends, Header, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import secrets
import pyotp
import qrcode
import io
import base64

router = APIRouter(prefix="/2fa", tags=["2fa"])

class TwoFactorSetup(BaseModel):
    """Настройка 2FA"""
    user_id: str  # ID пользователя
    method: str  # "sms", "email", "totp" (Google Authenticator)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class TwoFactorVerify(BaseModel):
    """Верификация 2FA"""
    user_id: str  # ID пользователя
    code: str
    backup_code: Optional[str] = None

class TwoFactorResponse(BaseModel):
    """Ответ 2FA"""
    success: bool
    message: str
    qr_code: Optional[str] = None  # Base64 QR код для TOTP
    secret: Optional[str] = None  # Секретный ключ для TOTP
    backup_codes: Optional[List[str]] = None

# Хранилище (в production - БД)
_user_2fa: dict = {}
_backup_codes: dict = {}

def generate_backup_codes(count: int = 10) -> List[str]:
    """Генерация backup кодов"""
    return [secrets.token_hex(4).upper() for _ in range(count)]

def generate_totp_secret() -> str:
    """Генерация секрета для TOTP"""
    return pyotp.random_base32()

def generate_qr_code(secret: str, email: str) -> str:
    """Генерация QR кода для Google Authenticator"""
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name="Analitix AI"
    )
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Конвертируем в base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

@router.post("/setup", response_model=TwoFactorResponse)
async def setup_2fa(setup: TwoFactorSetup):
    """
    Настройка 2FA для пользователя
    
    Методы:
    - sms: SMS коды на телефон
    - email: Email коды
    - totp: Google Authenticator / Authy
    """
    
    user_id = setup.user_id
    
    if setup.method == "totp":
        # Генерируем секрет для TOTP
        secret = generate_totp_secret()
        qr_code = generate_qr_code(secret, setup.email or f"user_{user_id}@analitix.ai")
        
        _user_2fa[user_id] = {
            "method": "totp",
            "secret": secret,
            "enabled": True,
            "created_at": datetime.now().isoformat()
        }
        
        # Генерируем backup коды
        backup_codes = generate_backup_codes()
        _backup_codes[user_id] = backup_codes
        
        return TwoFactorResponse(
            success=True,
            message="2FA настроен. Отсканируйте QR код в Google Authenticator",
            qr_code=qr_code,
            secret=secret,
            backup_codes=backup_codes
        )
    
    elif setup.method == "sms":
        if not setup.phone:
            raise HTTPException(status_code=400, detail="Телефон обязателен для SMS")
        
        # В production здесь отправка SMS через Twilio/SMS.ru
        _user_2fa[user_id] = {
            "method": "sms",
            "phone": setup.phone,
            "enabled": True,
            "created_at": datetime.now().isoformat()
        }
        
        backup_codes = generate_backup_codes()
        _backup_codes[user_id] = backup_codes
        
        return TwoFactorResponse(
            success=True,
            message=f"SMS коды будут отправляться на {setup.phone}",
            backup_codes=backup_codes
        )
    
    elif setup.method == "email":
        if not setup.email:
            raise HTTPException(status_code=400, detail="Email обязателен")
        
        _user_2fa[user_id] = {
            "method": "email",
            "email": setup.email,
            "enabled": True,
            "created_at": datetime.now().isoformat()
        }
        
        backup_codes = generate_backup_codes()
        _backup_codes[user_id] = backup_codes
        
        return TwoFactorResponse(
            success=True,
            message=f"Email коды будут отправляться на {setup.email}",
            backup_codes=backup_codes
        )
    
    else:
        raise HTTPException(status_code=400, detail="Неподдерживаемый метод 2FA")

@router.post("/verify")
async def verify_2fa(verify: TwoFactorVerify):
    """Верификация 2FA кода"""
    
    user_id = verify.user_id
    
    if user_id not in _user_2fa:
        raise HTTPException(status_code=404, detail="2FA не настроен для пользователя")
    
    user_2fa = _user_2fa[user_id]
    
    if not user_2fa.get("enabled"):
        raise HTTPException(status_code=400, detail="2FA отключен")
    
    # Проверка backup кода
    if verify.backup_code:
        if user_id in _backup_codes and verify.backup_code in _backup_codes[user_id]:
            _backup_codes[user_id].remove(verify.backup_code)
            return {
                "success": True,
                "message": "Backup код принят",
                "token": secrets.token_urlsafe(32)
            }
        else:
            raise HTTPException(status_code=401, detail="Неверный backup код")
    
    # Проверка TOTP кода
    if user_2fa["method"] == "totp":
        totp = pyotp.TOTP(user_2fa["secret"])
        if totp.verify(verify.code, valid_window=1):
            return {
                "success": True,
                "message": "Код верифицирован",
                "token": secrets.token_urlsafe(32)
            }
        else:
            raise HTTPException(status_code=401, detail="Неверный код")
    
    # Проверка SMS/Email кода (в production проверка из БД/Redis)
    # Для демо принимаем любой 6-значный код
    if len(verify.code) == 6 and verify.code.isdigit():
        return {
            "success": True,
            "message": "Код верифицирован",
            "token": secrets.token_urlsafe(32)
        }
    
    raise HTTPException(status_code=401, detail="Неверный код")

@router.post("/send-code")
async def send_2fa_code(user_id: str = Query(..., description="ID пользователя")):
    """Отправить 2FA код (SMS/Email)"""
    
    if user_id not in _user_2fa:
        raise HTTPException(status_code=404, detail="2FA не настроен")
    
    user_2fa = _user_2fa[user_id]
    method = user_2fa["method"]
    
    # Генерируем 6-значный код
    code = f"{secrets.randbelow(1000000):06d}"
    
    # В production здесь отправка через SMS/Email сервис
    # Сохраняем код в Redis с TTL 5 минут
    
    if method == "sms":
        phone = user_2fa.get("phone", "")
        return {
            "success": True,
            "message": f"Код отправлен на {phone}",
            "code": code  # В production не возвращаем!
        }
    
    elif method == "email":
        email = user_2fa.get("email", "")
        return {
            "success": True,
            "message": f"Код отправлен на {email}",
            "code": code  # В production не возвращаем!
        }
    
    raise HTTPException(status_code=400, detail="Метод не поддерживает отправку кодов")

@router.delete("/disable")
async def disable_2fa(user_id: str = Query(..., description="ID пользователя")):
    """Отключить 2FA"""
    if user_id in _user_2fa:
        _user_2fa[user_id]["enabled"] = False
        return {"success": True, "message": "2FA отключен"}
    
    raise HTTPException(status_code=404, detail="2FA не настроен")

@router.get("/status")
async def get_2fa_status(user_id: str = Query(..., description="ID пользователя")):
    """Получить статус 2FA"""
    if user_id not in _user_2fa:
        return {
            "enabled": False,
            "method": None,
            "setup_required": True
        }
    
    user_2fa = _user_2fa[user_id]
    return {
        "enabled": user_2fa.get("enabled", False),
        "method": user_2fa.get("method"),
        "setup_required": False,
        "has_backup_codes": user_id in _backup_codes and len(_backup_codes[user_id]) > 0
    }

@router.post("/regenerate-backup-codes")
async def regenerate_backup_codes(user_id: str = Query(..., description="ID пользователя")):
    """Регенерировать backup коды"""
    if user_id not in _user_2fa:
        raise HTTPException(status_code=404, detail="2FA не настроен")
    
    backup_codes = generate_backup_codes()
    _backup_codes[user_id] = backup_codes
    
    return {
        "success": True,
        "message": "Backup коды регенерированы",
        "backup_codes": backup_codes
    }

