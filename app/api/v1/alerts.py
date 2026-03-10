"""
🔔 Система алертов и уведомлений Analitix AI
Автоматические оповещения о важных событиях
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import json

router = APIRouter(prefix="/alerts", tags=["alerts"])

# === МОДЕЛИ ===

class AlertType(str, Enum):
    REVENUE_DROP = "revenue_drop"          # Падение выручки
    REVENUE_SPIKE = "revenue_spike"        # Рост выручки
    INACTIVE_CLIENT = "inactive_client"    # Неактивный клиент
    LOW_STOCK = "low_stock"                # Низкий остаток
    HIGH_CHURN = "high_churn"              # Высокий отток
    KPI_MISS = "kpi_miss"                  # KPI не выполнен
    ANOMALY = "anomaly"                    # Аномалия в данных

class AlertPriority(str, Enum):
    CRITICAL = "critical"    # 🔴 Критический
    HIGH = "high"            # 🟠 Высокий
    MEDIUM = "medium"        # 🟡 Средний
    LOW = "low"              # 🟢 Низкий

class AlertStatus(str, Enum):
    ACTIVE = "active"        # Активный
    READ = "read"            # Прочитан
    RESOLVED = "resolved"    # Решён
    DISMISSED = "dismissed"  # Отклонён

class AlertRule(BaseModel):
    """Правило для генерации алертов"""
    id: str
    name: str
    type: AlertType
    condition: Dict[str, Any]  # {"metric": "revenue", "operator": "decrease_by", "value": 15, "period": "week"}
    priority: AlertPriority
    enabled: bool = True
    notify_email: bool = False
    notify_telegram: bool = False

class Alert(BaseModel):
    """Алерт/уведомление"""
    id: str
    type: AlertType
    priority: AlertPriority
    status: AlertStatus
    title: str
    message: str
    data: Dict[str, Any]
    created_at: datetime
    read_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

class CreateRuleRequest(BaseModel):
    name: str
    type: AlertType
    condition: Dict[str, Any]
    priority: AlertPriority
    notify_email: bool = False
    notify_telegram: bool = False

class AlertSettings(BaseModel):
    email_notifications: bool = True
    telegram_notifications: bool = False
    telegram_chat_id: Optional[str] = None
    daily_digest: bool = True
    digest_time: str = "09:00"

# === ХРАНИЛИЩЕ (в памяти, для production использовать БД) ===

_alerts: List[Dict] = []
_alert_rules: List[Dict] = [
    {
        "id": "rule_1",
        "name": "Падение выручки >15%",
        "type": "revenue_drop",
        "condition": {"metric": "revenue", "operator": "decrease_by", "value": 15, "period": "week"},
        "priority": "critical",
        "enabled": True,
        "notify_email": True,
        "notify_telegram": False
    },
    {
        "id": "rule_2", 
        "name": "Неактивный клиент 30 дней",
        "type": "inactive_client",
        "condition": {"metric": "last_purchase", "operator": "days_ago", "value": 30},
        "priority": "high",
        "enabled": True,
        "notify_email": False,
        "notify_telegram": False
    },
    {
        "id": "rule_3",
        "name": "KPI не достигнут",
        "type": "kpi_miss",
        "condition": {"metric": "kpi_progress", "operator": "less_than", "value": 80},
        "priority": "high",
        "enabled": True,
        "notify_email": True,
        "notify_telegram": False
    },
    {
        "id": "rule_4",
        "name": "Рост выручки >20%",
        "type": "revenue_spike",
        "condition": {"metric": "revenue", "operator": "increase_by", "value": 20, "period": "week"},
        "priority": "low",
        "enabled": True,
        "notify_email": False,
        "notify_telegram": False
    },
    {
        "id": "rule_5",
        "name": "Высокий отток клиентов",
        "type": "high_churn",
        "condition": {"metric": "churn_rate", "operator": "greater_than", "value": 10},
        "priority": "critical",
        "enabled": True,
        "notify_email": True,
        "notify_telegram": True
    }
]

_alert_settings: Dict = {
    "email_notifications": True,
    "telegram_notifications": False,
    "telegram_chat_id": None,
    "daily_digest": True,
    "digest_time": "09:00"
}

# Демо-алерты
_alerts = [
    {
        "id": "alert_1",
        "type": "revenue_drop",
        "priority": "critical",
        "status": "active",
        "title": "📉 Выручка упала на 15%",
        "message": "Выручка за последнюю неделю снизилась на 15% по сравнению с предыдущей неделей. Рекомендуем проверить маркетинговые кампании.",
        "data": {
            "current_value": 850000,
            "previous_value": 1000000,
            "change_percent": -15,
            "period": "week"
        },
        "created_at": datetime.now().isoformat(),
        "read_at": None,
        "resolved_at": None
    },
    {
        "id": "alert_2",
        "type": "inactive_client",
        "priority": "high",
        "status": "active",
        "title": "👤 Клиент #123 не покупал 30 дней",
        "message": "VIP-клиент Иванов А.А. не совершал покупок более 30 дней. LTV клиента: 450,000₽. Рекомендуем связаться.",
        "data": {
            "client_id": "123",
            "client_name": "Иванов А.А.",
            "last_purchase": "2025-12-10",
            "days_inactive": 31,
            "ltv": 450000,
            "segment": "VIP"
        },
        "created_at": datetime.now().isoformat(),
        "read_at": None,
        "resolved_at": None
    },
    {
        "id": "alert_3",
        "type": "revenue_spike",
        "priority": "low",
        "status": "read",
        "title": "🚀 Выручка выросла на 25%!",
        "message": "Отличные новости! Выручка за неделю выросла на 25%. Основной драйвер: товар 'iPhone 15 Pro'.",
        "data": {
            "current_value": 1250000,
            "previous_value": 1000000,
            "change_percent": 25,
            "top_product": "iPhone 15 Pro"
        },
        "created_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "read_at": datetime.now().isoformat(),
        "resolved_at": None
    },
    {
        "id": "alert_4",
        "type": "kpi_miss",
        "priority": "high",
        "status": "active",
        "title": "⚠️ KPI 'Выручка Q1' отстаёт",
        "message": "Цель по выручке за Q1 выполнена на 67%. До конца квартала осталось 45 дней. Требуется ускорение.",
        "data": {
            "kpi_name": "Выручка Q1",
            "target": 10000000,
            "current": 6700000,
            "progress": 67,
            "days_left": 45
        },
        "created_at": (datetime.now() - timedelta(hours=5)).isoformat(),
        "read_at": None,
        "resolved_at": None
    },
    {
        "id": "alert_5",
        "type": "high_churn",
        "priority": "critical",
        "status": "active",
        "title": "🔴 Высокий отток клиентов: 12%",
        "message": "Отток клиентов достиг 12% в этом месяце. Это выше нормы на 5%. Анализ показывает проблемы с доставкой.",
        "data": {
            "churn_rate": 12,
            "normal_rate": 7,
            "clients_lost": 45,
            "main_reason": "Долгая доставка"
        },
        "created_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        "read_at": None,
        "resolved_at": None
    }
]

# === API ENDPOINTS ===

@router.get("/")
async def get_alerts(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50
):
    """Получить список алертов"""
    alerts = _alerts.copy()
    
    if status:
        alerts = [a for a in alerts if a["status"] == status]
    
    if priority:
        alerts = [a for a in alerts if a["priority"] == priority]
    
    # Сортировка: сначала критические, потом по дате
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: (priority_order.get(x["priority"], 4), x["created_at"]), reverse=True)
    
    return {
        "alerts": alerts[:limit],
        "total": len(_alerts),
        "unread": len([a for a in _alerts if a["status"] == "active"]),
        "critical": len([a for a in _alerts if a["priority"] == "critical" and a["status"] == "active"])
    }

@router.get("/count")
async def get_alerts_count():
    """Получить количество непрочитанных алертов"""
    unread = len([a for a in _alerts if a["status"] == "active"])
    critical = len([a for a in _alerts if a["priority"] == "critical" and a["status"] == "active"])
    
    return {
        "unread": unread,
        "critical": critical,
        "total": len(_alerts)
    }

@router.put("/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    """Пометить алерт как прочитанный"""
    for alert in _alerts:
        if alert["id"] == alert_id:
            alert["status"] = "read"
            alert["read_at"] = datetime.now().isoformat()
            return {"success": True, "alert": alert}
    
    raise HTTPException(status_code=404, detail="Алерт не найден")

@router.put("/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Пометить алерт как решённый"""
    for alert in _alerts:
        if alert["id"] == alert_id:
            alert["status"] = "resolved"
            alert["resolved_at"] = datetime.now().isoformat()
            return {"success": True, "alert": alert}
    
    raise HTTPException(status_code=404, detail="Алерт не найден")

@router.put("/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    """Отклонить алерт"""
    for alert in _alerts:
        if alert["id"] == alert_id:
            alert["status"] = "dismissed"
            return {"success": True, "alert": alert}
    
    raise HTTPException(status_code=404, detail="Алерт не найден")

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    """Удалить алерт"""
    global _alerts
    _alerts = [a for a in _alerts if a["id"] != alert_id]
    return {"success": True}

@router.put("/mark-all-read")
async def mark_all_read():
    """Пометить все алерты как прочитанные"""
    now = datetime.now().isoformat()
    for alert in _alerts:
        if alert["status"] == "active":
            alert["status"] = "read"
            alert["read_at"] = now
    
    return {"success": True, "updated": len(_alerts)}

# === ПРАВИЛА АЛЕРТОВ ===

@router.get("/rules")
async def get_alert_rules():
    """Получить правила алертов"""
    return {"rules": _alert_rules}

@router.post("/rules")
async def create_alert_rule(rule: CreateRuleRequest):
    """Создать новое правило"""
    new_rule = {
        "id": f"rule_{len(_alert_rules) + 1}",
        "name": rule.name,
        "type": rule.type.value,
        "condition": rule.condition,
        "priority": rule.priority.value,
        "enabled": True,
        "notify_email": rule.notify_email,
        "notify_telegram": rule.notify_telegram
    }
    _alert_rules.append(new_rule)
    return {"success": True, "rule": new_rule}

@router.put("/rules/{rule_id}/toggle")
async def toggle_rule(rule_id: str):
    """Включить/выключить правило"""
    for rule in _alert_rules:
        if rule["id"] == rule_id:
            rule["enabled"] = not rule["enabled"]
            return {"success": True, "rule": rule}
    
    raise HTTPException(status_code=404, detail="Правило не найдено")

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    """Удалить правило"""
    global _alert_rules
    _alert_rules = [r for r in _alert_rules if r["id"] != rule_id]
    return {"success": True}

# === НАСТРОЙКИ ===

@router.get("/settings")
async def get_alert_settings():
    """Получить настройки уведомлений"""
    return _alert_settings

@router.put("/settings")
async def update_alert_settings(settings: AlertSettings):
    """Обновить настройки уведомлений"""
    global _alert_settings
    _alert_settings = settings.dict()
    return {"success": True, "settings": _alert_settings}

# === ГЕНЕРАЦИЯ АЛЕРТОВ (для анализа данных) ===

def check_and_generate_alerts(data: Dict[str, Any]) -> List[Dict]:
    """
    Проверяет данные и генерирует алерты на основе правил
    Вызывается после загрузки/обновления данных
    """
    generated_alerts = []
    
    for rule in _alert_rules:
        if not rule["enabled"]:
            continue
        
        alert = None
        condition = rule["condition"]
        
        # Проверка падения выручки
        if rule["type"] == "revenue_drop":
            if "revenue_change" in data:
                change = data["revenue_change"]
                threshold = -condition.get("value", 10)
                if change <= threshold:
                    alert = {
                        "type": "revenue_drop",
                        "priority": rule["priority"],
                        "title": f"📉 Выручка упала на {abs(change):.0f}%",
                        "message": f"Выручка снизилась на {abs(change):.1f}% за {condition.get('period', 'неделю')}.",
                        "data": {"change_percent": change}
                    }
        
        # Проверка роста выручки
        elif rule["type"] == "revenue_spike":
            if "revenue_change" in data:
                change = data["revenue_change"]
                threshold = condition.get("value", 20)
                if change >= threshold:
                    alert = {
                        "type": "revenue_spike",
                        "priority": rule["priority"],
                        "title": f"🚀 Выручка выросла на {change:.0f}%!",
                        "message": f"Отличные новости! Выручка выросла на {change:.1f}%.",
                        "data": {"change_percent": change}
                    }
        
        # Проверка оттока
        elif rule["type"] == "high_churn":
            if "churn_rate" in data:
                churn = data["churn_rate"]
                threshold = condition.get("value", 10)
                if churn >= threshold:
                    alert = {
                        "type": "high_churn",
                        "priority": rule["priority"],
                        "title": f"🔴 Высокий отток: {churn:.0f}%",
                        "message": f"Отток клиентов достиг {churn:.1f}%, что выше нормы.",
                        "data": {"churn_rate": churn}
                    }
        
        if alert:
            alert["id"] = f"alert_{len(_alerts) + len(generated_alerts) + 1}"
            alert["status"] = "active"
            alert["created_at"] = datetime.now().isoformat()
            alert["read_at"] = None
            alert["resolved_at"] = None
            generated_alerts.append(alert)
    
    # Добавляем сгенерированные алерты
    _alerts.extend(generated_alerts)
    
    return generated_alerts


