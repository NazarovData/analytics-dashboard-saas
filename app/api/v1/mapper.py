"""
CSV Mapper API — шаблоны маппинга + сохранение данных
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_INDUSTRIES = [
    'ecommerce', 'avito', 'warehouse', 'logistics', 'cafe',
    'beauty', 'retail', 'marketing', 'crm', 'finance',
]
VALID_COUNTRIES = ['RU', 'TJ', 'UZ']

# ──────────────────────────────────────────────
# In-memory fallback when DB is not available
# ──────────────────────────────────────────────
_templates_store: Dict[str, Any] = {}
_transactions_store: List[Dict[str, Any]] = []


def _template_key(user_id: int, industry: str) -> str:
    return f"{user_id}:{industry}"


# ──────────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────────
class TemplateSaveRequest(BaseModel):
    user_id: Optional[int] = 0
    industry: str
    country: str = 'RU'
    mapping: Dict[str, Optional[str]]


class TemplateSaveResponse(BaseModel):
    success: bool
    industry: str
    country: str
    fields_mapped: int
    message: str


class TemplateLoadResponse(BaseModel):
    found: bool
    industry: str
    country: Optional[str] = None
    mapping: Optional[Dict[str, Optional[str]]] = None
    updated_at: Optional[str] = None


class TransactionsSaveRequest(BaseModel):
    user_id: Optional[int] = 0
    industry: str
    country: str = 'RU'
    rows: List[Dict[str, Any]]


class TransactionsSaveResponse(BaseModel):
    success: bool
    rows_inserted: int
    industry: str
    errors: List[str] = []


# ──────────────────────────────────────────────
# DB helpers (try real DB, fallback to in-memory)
# ──────────────────────────────────────────────
def _get_db_session():
    try:
        from app.core.database import SessionLocal
        if SessionLocal:
            db = SessionLocal()
            return db
    except Exception:
        pass
    return None


def _close_db(db):
    if db:
        try:
            db.close()
        except Exception:
            pass


# ──────────────────────────────────────────────
# TEMPLATES CRUD
# ──────────────────────────────────────────────

@router.post("/templates", response_model=TemplateSaveResponse)
async def save_template(req: TemplateSaveRequest):
    if req.industry not in VALID_INDUSTRIES:
        raise HTTPException(400, f"Unknown industry: {req.industry}")
    if req.country not in VALID_COUNTRIES:
        raise HTTPException(400, f"Unknown country: {req.country}")

    fields_mapped = sum(1 for v in req.mapping.values() if v)
    now = datetime.utcnow()

    db = _get_db_session()
    if db:
        try:
            from app.models.database import ClientTemplate
            existing = (
                db.query(ClientTemplate)
                .filter_by(user_id=req.user_id or 0, industry=req.industry)
                .first()
            )
            if existing:
                existing.mapping = req.mapping
                existing.country = req.country
                existing.updated_at = now
            else:
                template = ClientTemplate(
                    user_id=req.user_id or 0,
                    industry=req.industry,
                    country=req.country,
                    mapping=req.mapping,
                    created_at=now,
                    updated_at=now,
                )
                db.add(template)
            db.commit()
            _close_db(db)
            return TemplateSaveResponse(
                success=True,
                industry=req.industry,
                country=req.country,
                fields_mapped=fields_mapped,
                message="Шаблон сохранён в базу данных",
            )
        except Exception as e:
            db.rollback()
            _close_db(db)
            logger.warning(f"DB save failed, using fallback: {e}")

    key = _template_key(req.user_id or 0, req.industry)
    _templates_store[key] = {
        "user_id": req.user_id or 0,
        "industry": req.industry,
        "country": req.country,
        "mapping": req.mapping,
        "updated_at": now.isoformat(),
    }

    return TemplateSaveResponse(
        success=True,
        industry=req.industry,
        country=req.country,
        fields_mapped=fields_mapped,
        message="Шаблон сохранён (in-memory)",
    )


@router.get("/templates/{industry}", response_model=TemplateLoadResponse)
async def load_template(industry: str, user_id: int = 0):
    if industry not in VALID_INDUSTRIES:
        raise HTTPException(400, f"Unknown industry: {industry}")

    db = _get_db_session()
    if db:
        try:
            from app.models.database import ClientTemplate
            tpl = (
                db.query(ClientTemplate)
                .filter_by(user_id=user_id, industry=industry)
                .first()
            )
            _close_db(db)
            if tpl:
                return TemplateLoadResponse(
                    found=True,
                    industry=industry,
                    country=tpl.country,
                    mapping=tpl.mapping,
                    updated_at=tpl.updated_at.isoformat() if tpl.updated_at else None,
                )
            return TemplateLoadResponse(found=False, industry=industry)
        except Exception as e:
            _close_db(db)
            logger.warning(f"DB load failed, using fallback: {e}")

    key = _template_key(user_id, industry)
    stored = _templates_store.get(key)
    if stored:
        return TemplateLoadResponse(
            found=True,
            industry=industry,
            country=stored["country"],
            mapping=stored["mapping"],
            updated_at=stored.get("updated_at"),
        )
    return TemplateLoadResponse(found=False, industry=industry)


@router.get("/templates")
async def list_templates(user_id: int = 0):
    results = []

    db = _get_db_session()
    if db:
        try:
            from app.models.database import ClientTemplate
            templates = (
                db.query(ClientTemplate)
                .filter_by(user_id=user_id)
                .all()
            )
            _close_db(db)
            return {
                "templates": [
                    {
                        "industry": t.industry,
                        "country": t.country,
                        "fields_mapped": sum(1 for v in (t.mapping or {}).values() if v),
                        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
                    }
                    for t in templates
                ]
            }
        except Exception as e:
            _close_db(db)
            logger.warning(f"DB list failed, using fallback: {e}")

    prefix = f"{user_id}:"
    for key, val in _templates_store.items():
        if key.startswith(prefix):
            results.append({
                "industry": val["industry"],
                "country": val["country"],
                "fields_mapped": sum(1 for v in val["mapping"].values() if v),
                "updated_at": val.get("updated_at"),
            })

    return {"templates": results}


@router.delete("/templates/{industry}")
async def delete_template(industry: str, user_id: int = 0):
    db = _get_db_session()
    if db:
        try:
            from app.models.database import ClientTemplate
            deleted = (
                db.query(ClientTemplate)
                .filter_by(user_id=user_id, industry=industry)
                .delete()
            )
            db.commit()
            _close_db(db)
            return {"success": True, "deleted": deleted}
        except Exception as e:
            db.rollback()
            _close_db(db)
            logger.warning(f"DB delete failed: {e}")

    key = _template_key(user_id, industry)
    removed = _templates_store.pop(key, None)
    return {"success": True, "deleted": 1 if removed else 0}


# ──────────────────────────────────────────────
# TRANSACTIONS (mapped data)
# ──────────────────────────────────────────────

@router.post("/transactions", response_model=TransactionsSaveResponse)
async def save_transactions(req: TransactionsSaveRequest):
    if req.industry not in VALID_INDUSTRIES:
        raise HTTPException(400, f"Unknown industry: {req.industry}")

    errors: List[str] = []
    inserted = 0
    now = datetime.utcnow()

    db = _get_db_session()
    if db:
        try:
            from app.models.database import MappedTransaction
            for i, row in enumerate(req.rows):
                try:
                    tx = MappedTransaction(
                        user_id=req.user_id or 0,
                        industry=req.industry,
                        country=req.country,
                        data=row,
                        created_at=now,
                    )
                    db.add(tx)
                    inserted += 1
                except Exception as e:
                    errors.append(f"Row {i}: {str(e)}")

            db.commit()
            _close_db(db)
            return TransactionsSaveResponse(
                success=True,
                rows_inserted=inserted,
                industry=req.industry,
                errors=errors,
            )
        except Exception as e:
            db.rollback()
            _close_db(db)
            logger.warning(f"DB transactions save failed, using fallback: {e}")

    for row in req.rows:
        _transactions_store.append({
            "user_id": req.user_id or 0,
            "industry": req.industry,
            "country": req.country,
            "data": row,
            "created_at": now.isoformat(),
        })
        inserted += 1

    return TransactionsSaveResponse(
        success=True,
        rows_inserted=inserted,
        industry=req.industry,
        errors=errors,
    )


@router.get("/transactions/{industry}")
async def get_transactions(industry: str, user_id: int = 0, limit: int = 1000):
    db = _get_db_session()
    if db:
        try:
            from app.models.database import MappedTransaction
            txns = (
                db.query(MappedTransaction)
                .filter_by(user_id=user_id, industry=industry)
                .order_by(MappedTransaction.created_at.desc())
                .limit(limit)
                .all()
            )
            _close_db(db)
            return {
                "industry": industry,
                "count": len(txns),
                "rows": [t.data for t in txns],
            }
        except Exception as e:
            _close_db(db)
            logger.warning(f"DB transactions load failed: {e}")

    rows = [
        t["data"]
        for t in _transactions_store
        if t["user_id"] == (user_id or 0) and t["industry"] == industry
    ][-limit:]

    return {
        "industry": industry,
        "count": len(rows),
        "rows": rows,
    }
