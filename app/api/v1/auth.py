"""
Authentication API endpoints
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Dict, List, Optional
from datetime import datetime, timedelta

try:
    import jwt
except ImportError:
    from jose import jwt

router = APIRouter()

# Временное хранилище пользователей (в памяти)
# В production используйте базу данных
users_db: Dict[str, dict] = {}

# Модели
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str = "User"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# Секретный ключ для JWT (в production используйте .env)
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)):
    """Создать access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    """Создать refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register", response_model=dict)
async def register(data: RegisterRequest):
    """Регистрация нового пользователя"""
    
    # Проверка существования пользователя
    if data.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Создание пользователя
    user = {
        "email": data.email,
        "password": data.password,  # В production хешируйте пароль!
        "full_name": data.full_name,
        "created_at": datetime.utcnow().isoformat()
    }
    users_db[data.email] = user
    
    return {
        "email": data.email,
        "full_name": data.full_name,
        "message": "User registered successfully"
    }

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Вход пользователя"""
    
    # Проверка пользователя
    user = users_db.get(data.email)
    if not user or user["password"] != data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Создание токенов
    access_token = create_access_token({"sub": data.email})
    refresh_token = create_refresh_token({"sub": data.email})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    """Обновить access token"""
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        
        if not email or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Создание новых токенов
        access_token = create_access_token({"sub": email})
        new_refresh_token = create_refresh_token({"sub": email})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

# ===== LEADS (заявки) =====
leads_db: List[dict] = []

class LeadRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    company: Optional[str] = None
    message: Optional[str] = None

@router.post("/lead")
async def create_lead(lead: LeadRequest):
    """Сохранить заявку с Landing Page"""
    try:
        # Пробуем сохранить в БД
        from app.core.database import SessionLocal
        from app.models.database import Lead
        
        if SessionLocal is None:
            raise Exception("Database not available")
        
        db = SessionLocal()
        try:
            db_lead = Lead(
                name=lead.name,
                phone=lead.phone,
                email=lead.email,
                company=lead.company,
                message=lead.message,
                status="new"
            )
            db.add(db_lead)
            db.commit()
            db.refresh(db_lead)
            
            return {
                "success": True,
                "message": "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.",
                "lead_id": db_lead.id
            }
        finally:
            db.close()
    except Exception as e:
        # Fallback на память если БД недоступна
        lead_data = {
            "id": len(leads_db) + 1,
            "name": lead.name,
            "phone": lead.phone,
            "email": lead.email,
            "company": lead.company,
            "message": lead.message,
            "created_at": datetime.utcnow().isoformat(),
            "status": "new"
        }
        leads_db.append(lead_data)
        
        return {
            "success": True,
            "message": "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.",
            "lead_id": lead_data["id"]
        }

@router.get("/leads")
async def get_leads():
    """Получить все заявки (для админа)"""
    try:
        # Пробуем получить из БД
        from app.core.database import SessionLocal
        from app.models.database import Lead
        
        if SessionLocal is None:
            raise Exception("Database not available")
        
        db = SessionLocal()
        try:
            db_leads = db.query(Lead).order_by(Lead.created_at.desc()).all()
            leads = [{
                "id": lead.id,
                "name": lead.name,
                "phone": lead.phone,
                "email": lead.email,
                "company": lead.company,
                "message": lead.message,
                "status": lead.status,
                "created_at": lead.created_at.isoformat() if lead.created_at else None
            } for lead in db_leads]
            
            return {
                "leads": leads,
                "total": len(leads)
            }
        finally:
            db.close()
    except:
        # Fallback на память
        return {
            "leads": leads_db,
            "total": len(leads_db)
        }



