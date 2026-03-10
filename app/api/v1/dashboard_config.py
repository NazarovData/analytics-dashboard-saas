"""
📊 Dashboard Config API
API для сохранения конфигурации виджетов и KPI целей
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

router = APIRouter()

# In-memory storage (в продакшене использовать БД)
dashboard_configs: Dict[str, Dict] = {}
kpi_goals: Dict[str, List[Dict]] = {}


# ============================================
# 📦 МОДЕЛИ
# ============================================

class WidgetConfig(BaseModel):
    id: str
    type: str
    title: str
    size: str  # small, medium, large, full
    position: int
    visible: bool
    config: Optional[Dict[str, Any]] = None


class DashboardConfigRequest(BaseModel):
    user_id: str
    widgets: List[WidgetConfig]


class DashboardConfigResponse(BaseModel):
    success: bool
    user_id: str
    widgets: List[WidgetConfig]
    updated_at: str


class KPIGoalRequest(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    period: str
    target_value: float
    current_value: float
    start_value: float
    unit: str
    start_date: str
    end_date: str
    status: str
    milestones: Optional[List[Dict]] = None
    history: Optional[List[Dict]] = None


class KPIGoalsRequest(BaseModel):
    user_id: str
    goals: List[KPIGoalRequest]


class KPIGoalsResponse(BaseModel):
    success: bool
    user_id: str
    goals: List[KPIGoalRequest]
    total_goals: int
    completed_goals: int
    avg_progress: float


# ============================================
# 🧩 ВИДЖЕТЫ API
# ============================================

@router.post("/widgets/save", response_model=DashboardConfigResponse)
async def save_widget_config(request: DashboardConfigRequest):
    """Сохранить конфигурацию виджетов"""
    dashboard_configs[request.user_id] = {
        "widgets": [w.dict() for w in request.widgets],
        "updated_at": datetime.now().isoformat()
    }
    
    return DashboardConfigResponse(
        success=True,
        user_id=request.user_id,
        widgets=request.widgets,
        updated_at=datetime.now().isoformat()
    )


@router.get("/widgets/{user_id}")
async def get_widget_config(user_id: str):
    """Получить конфигурацию виджетов пользователя"""
    config = dashboard_configs.get(user_id)
    
    if not config:
        # Возвращаем дефолтную конфигурацию
        return {
            "success": True,
            "user_id": user_id,
            "widgets": get_default_widgets(),
            "is_default": True
        }
    
    return {
        "success": True,
        "user_id": user_id,
        "widgets": config["widgets"],
        "updated_at": config["updated_at"],
        "is_default": False
    }


@router.delete("/widgets/{user_id}")
async def reset_widget_config(user_id: str):
    """Сбросить конфигурацию виджетов к дефолтной"""
    if user_id in dashboard_configs:
        del dashboard_configs[user_id]
    
    return {
        "success": True,
        "message": "Конфигурация сброшена к дефолтной"
    }


# ============================================
# 🎯 KPI ЦЕЛИ API
# ============================================

@router.post("/kpi/save", response_model=KPIGoalsResponse)
async def save_kpi_goals(request: KPIGoalsRequest):
    """Сохранить KPI цели"""
    goals_list = [g.dict() for g in request.goals]
    kpi_goals[request.user_id] = goals_list
    
    # Рассчитываем статистику
    total = len(goals_list)
    completed = len([g for g in goals_list if g['status'] in ['completed', 'exceeded']])
    avg_progress = sum(
        (g['current_value'] / g['target_value'] * 100) if g['target_value'] > 0 else 0
        for g in goals_list
    ) / total if total > 0 else 0
    
    return KPIGoalsResponse(
        success=True,
        user_id=request.user_id,
        goals=request.goals,
        total_goals=total,
        completed_goals=completed,
        avg_progress=round(avg_progress, 1)
    )


@router.get("/kpi/{user_id}")
async def get_kpi_goals(user_id: str):
    """Получить KPI цели пользователя"""
    goals = kpi_goals.get(user_id, [])
    
    if not goals:
        # Возвращаем демо цели
        return {
            "success": True,
            "user_id": user_id,
            "goals": get_default_kpi_goals(),
            "is_default": True
        }
    
    total = len(goals)
    completed = len([g for g in goals if g['status'] in ['completed', 'exceeded']])
    avg_progress = sum(
        (g['current_value'] / g['target_value'] * 100) if g['target_value'] > 0 else 0
        for g in goals
    ) / total if total > 0 else 0
    
    return {
        "success": True,
        "user_id": user_id,
        "goals": goals,
        "total_goals": total,
        "completed_goals": completed,
        "avg_progress": round(avg_progress, 1),
        "is_default": False
    }


@router.post("/kpi/{user_id}/goal")
async def add_kpi_goal(user_id: str, goal: KPIGoalRequest):
    """Добавить новую KPI цель"""
    if user_id not in kpi_goals:
        kpi_goals[user_id] = []
    
    kpi_goals[user_id].append(goal.dict())
    
    return {
        "success": True,
        "message": "Цель добавлена",
        "goal": goal
    }


@router.put("/kpi/{user_id}/goal/{goal_id}")
async def update_kpi_goal(user_id: str, goal_id: str, goal: KPIGoalRequest):
    """Обновить KPI цель"""
    if user_id not in kpi_goals:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    for i, g in enumerate(kpi_goals[user_id]):
        if g['id'] == goal_id:
            kpi_goals[user_id][i] = goal.dict()
            return {"success": True, "message": "Цель обновлена", "goal": goal}
    
    raise HTTPException(status_code=404, detail="Цель не найдена")


@router.delete("/kpi/{user_id}/goal/{goal_id}")
async def delete_kpi_goal(user_id: str, goal_id: str):
    """Удалить KPI цель"""
    if user_id not in kpi_goals:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    kpi_goals[user_id] = [g for g in kpi_goals[user_id] if g['id'] != goal_id]
    
    return {"success": True, "message": "Цель удалена"}


@router.post("/kpi/{user_id}/goal/{goal_id}/progress")
async def update_kpi_progress(user_id: str, goal_id: str, progress: float):
    """Обновить прогресс KPI цели"""
    if user_id not in kpi_goals:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    for g in kpi_goals[user_id]:
        if g['id'] == goal_id:
            g['current_value'] += progress
            
            # Обновляем статус
            ratio = g['current_value'] / g['target_value'] if g['target_value'] > 0 else 0
            if ratio >= 1:
                g['status'] = 'exceeded' if ratio > 1 else 'completed'
            elif ratio >= 0.75:
                g['status'] = 'on_track'
            elif ratio >= 0.5:
                g['status'] = 'at_risk'
            else:
                g['status'] = 'behind'
            
            # Добавляем в историю
            if 'history' not in g:
                g['history'] = []
            g['history'].append({
                "date": datetime.now().isoformat(),
                "value": g['current_value']
            })
            
            return {"success": True, "goal": g}
    
    raise HTTPException(status_code=404, detail="Цель не найдена")


# ============================================
# 🎨 ДЕФОЛТНЫЕ ДАННЫЕ
# ============================================

def get_default_widgets():
    """Дефолтная конфигурация виджетов"""
    return [
        {"id": "w1", "type": "metric", "title": "Выручка", "size": "small", "position": 0, "visible": True, "config": {"metric": "revenue", "color": "blue"}},
        {"id": "w2", "type": "metric", "title": "Заказы", "size": "small", "position": 1, "visible": True, "config": {"metric": "orders", "color": "green"}},
        {"id": "w3", "type": "metric", "title": "Клиенты", "size": "small", "position": 2, "visible": True, "config": {"metric": "customers", "color": "purple"}},
        {"id": "w4", "type": "metric", "title": "Средний чек", "size": "small", "position": 3, "visible": True, "config": {"metric": "avgCheck", "color": "orange"}},
        {"id": "w5", "type": "chart-area", "title": "Динамика продаж", "size": "large", "position": 4, "visible": True},
        {"id": "w6", "type": "kpi-progress", "title": "Цель месяца", "size": "medium", "position": 5, "visible": True, "config": {"target": 5000000, "current": 3750000}},
        {"id": "w7", "type": "chart-pie", "title": "Категории", "size": "medium", "position": 6, "visible": True},
        {"id": "w8", "type": "top-products", "title": "Топ товары", "size": "medium", "position": 7, "visible": True},
    ]


def get_default_kpi_goals():
    """Дефолтные KPI цели"""
    return [
        {
            "id": "kpi1",
            "title": "Выручка за месяц",
            "description": "Достичь 5 млн рублей выручки",
            "category": "revenue",
            "period": "monthly",
            "target_value": 5000000,
            "current_value": 3750000,
            "start_value": 0,
            "unit": "₽",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "status": "on_track",
            "milestones": [
                {"value": 1000000, "label": "1M", "achieved": True},
                {"value": 2500000, "label": "2.5M", "achieved": True},
                {"value": 4000000, "label": "4M", "achieved": False},
                {"value": 5000000, "label": "5M", "achieved": False},
            ]
        },
        {
            "id": "kpi2",
            "title": "Новые клиенты",
            "description": "Привлечь 500 новых клиентов",
            "category": "customers",
            "period": "monthly",
            "target_value": 500,
            "current_value": 312,
            "start_value": 0,
            "unit": "клиентов",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "status": "at_risk"
        },
        {
            "id": "kpi3",
            "title": "Конверсия сайта",
            "description": "Увеличить конверсию до 3.5%",
            "category": "conversion",
            "period": "quarterly",
            "target_value": 3.5,
            "current_value": 2.8,
            "start_value": 2.1,
            "unit": "%",
            "start_date": "2024-01-01",
            "end_date": "2024-03-31",
            "status": "on_track"
        }
    ]













