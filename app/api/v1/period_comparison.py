"""
📊 Сравнение периодов (vs прошлый месяц/неделю)
Analitix AI - Period Comparison API
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum

router = APIRouter(prefix="/period-comparison", tags=["period-comparison"])

class PeriodType(str, Enum):
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"

class MetricComparison(BaseModel):
    """Сравнение метрики"""
    metric: str
    current_value: float
    previous_value: float
    change: float  # абсолютное изменение
    change_percent: float  # процентное изменение
    trend: str  # "up", "down", "stable"
    is_positive: bool

class PeriodComparisonResponse(BaseModel):
    """Результат сравнения периодов"""
    period_type: PeriodType
    current_period: Dict[str, Any]
    previous_period: Dict[str, Any]
    metrics: List[MetricComparison]
    summary: Dict[str, Any]

# Демо-данные (в production из БД)
_demo_data = {
    "revenue": {
        "current": 12500000,
        "previous": 11200000,
    },
    "orders": {
        "current": 850,
        "previous": 720,
    },
    "unique_clients": {
        "current": 450,
        "previous": 380,
    },
    "average_check": {
        "current": 14705.88,
        "previous": 15555.56,
    },
    "repeat_purchase_rate": {
        "current": 68.5,
        "previous": 62.3,
    },
    "ltv": {
        "current": 89000,
        "previous": 82000,
    },
    "churn_rate": {
        "current": 5.2,
        "previous": 7.8,
    },
    "top_products": [
        {"product": "iPhone 15 Pro", "current": 1250000, "previous": 980000},
        {"product": "MacBook Air M3", "current": 980000, "previous": 890000},
        {"product": "AirPods Pro", "current": 750000, "previous": 720000},
    ]
}

@router.get("/compare", response_model=PeriodComparisonResponse)
async def compare_periods(
    period_type: PeriodType = Query(PeriodType.MONTH, description="Тип периода для сравнения"),
    current_start: Optional[str] = Query(None, description="Начало текущего периода (YYYY-MM-DD)"),
    current_end: Optional[str] = Query(None, description="Конец текущего периода (YYYY-MM-DD)"),
):
    """
    Сравнение текущего периода с предыдущим
    
    Примеры:
    - Месяц: январь 2026 vs декабрь 2025
    - Неделя: неделя 1 vs неделя 52
    """
    
    # Определяем периоды
    now = datetime.now()
    
    if period_type == PeriodType.WEEK:
        # Текущая неделя
        current_end = now
        current_start = now - timedelta(days=now.weekday() + 7)  # Начало недели
        previous_end = current_start - timedelta(days=1)
        previous_start = previous_end - timedelta(days=7)
    elif period_type == PeriodType.MONTH:
        # Текущий месяц
        current_start = datetime(now.year, now.month, 1)
        current_end = now
        # Предыдущий месяц
        if now.month == 1:
            previous_start = datetime(now.year - 1, 12, 1)
            previous_end = datetime(now.year, 1, 1) - timedelta(days=1)
        else:
            previous_start = datetime(now.year, now.month - 1, 1)
            previous_end = datetime(now.year, now.month, 1) - timedelta(days=1)
    elif period_type == PeriodType.QUARTER:
        # Текущий квартал
        quarter = (now.month - 1) // 3 + 1
        current_start = datetime(now.year, (quarter - 1) * 3 + 1, 1)
        current_end = now
        # Предыдущий квартал
        if quarter == 1:
            previous_start = datetime(now.year - 1, 10, 1)
            previous_end = datetime(now.year, 1, 1) - timedelta(days=1)
        else:
            prev_quarter_start_month = (quarter - 2) * 3 + 1
            previous_start = datetime(now.year, prev_quarter_start_month, 1)
            previous_end = current_start - timedelta(days=1)
    else:  # YEAR
        current_start = datetime(now.year, 1, 1)
        current_end = now
        previous_start = datetime(now.year - 1, 1, 1)
        previous_end = datetime(now.year - 1, 12, 31)

    # Вычисляем метрики
    metrics = []
    
    # Выручка
    revenue_change = _demo_data["revenue"]["current"] - _demo_data["revenue"]["previous"]
    revenue_change_percent = (revenue_change / _demo_data["revenue"]["previous"]) * 100
    metrics.append(MetricComparison(
        metric="revenue",
        current_value=_demo_data["revenue"]["current"],
        previous_value=_demo_data["revenue"]["previous"],
        change=revenue_change,
        change_percent=revenue_change_percent,
        trend="up" if revenue_change > 0 else "down",
        is_positive=revenue_change > 0
    ))

    # Заказы
    orders_change = _demo_data["orders"]["current"] - _demo_data["orders"]["previous"]
    orders_change_percent = (orders_change / _demo_data["orders"]["previous"]) * 100
    metrics.append(MetricComparison(
        metric="orders",
        current_value=_demo_data["orders"]["current"],
        previous_value=_demo_data["orders"]["previous"],
        change=orders_change,
        change_percent=orders_change_percent,
        trend="up" if orders_change > 0 else "down",
        is_positive=orders_change > 0
    ))

    # Клиенты
    clients_change = _demo_data["unique_clients"]["current"] - _demo_data["unique_clients"]["previous"]
    clients_change_percent = (clients_change / _demo_data["unique_clients"]["previous"]) * 100
    metrics.append(MetricComparison(
        metric="unique_clients",
        current_value=_demo_data["unique_clients"]["current"],
        previous_value=_demo_data["unique_clients"]["previous"],
        change=clients_change,
        change_percent=clients_change_percent,
        trend="up" if clients_change > 0 else "down",
        is_positive=clients_change > 0
    ))

    # Средний чек (обратная логика - снижение плохо)
    avg_check_change = _demo_data["average_check"]["current"] - _demo_data["average_check"]["previous"]
    avg_check_change_percent = (avg_check_change / _demo_data["average_check"]["previous"]) * 100
    metrics.append(MetricComparison(
        metric="average_check",
        current_value=_demo_data["average_check"]["current"],
        previous_value=_demo_data["average_check"]["previous"],
        change=avg_check_change,
        change_percent=avg_check_change_percent,
        trend="up" if avg_check_change > 0 else "down",
        is_positive=avg_check_change > 0  # Рост среднего чека хорошо
    ))

    # Повторные покупки
    repeat_change = _demo_data["repeat_purchase_rate"]["current"] - _demo_data["repeat_purchase_rate"]["previous"]
    metrics.append(MetricComparison(
        metric="repeat_purchase_rate",
        current_value=_demo_data["repeat_purchase_rate"]["current"],
        previous_value=_demo_data["repeat_purchase_rate"]["previous"],
        change=repeat_change,
        change_percent=(repeat_change / _demo_data["repeat_purchase_rate"]["previous"]) * 100,
        trend="up" if repeat_change > 0 else "down",
        is_positive=repeat_change > 0
    ))

    # LTV
    ltv_change = _demo_data["ltv"]["current"] - _demo_data["ltv"]["previous"]
    metrics.append(MetricComparison(
        metric="ltv",
        current_value=_demo_data["ltv"]["current"],
        previous_value=_demo_data["ltv"]["previous"],
        change=ltv_change,
        change_percent=(ltv_change / _demo_data["ltv"]["previous"]) * 100,
        trend="up" if ltv_change > 0 else "down",
        is_positive=ltv_change > 0
    ))

    # Отток (обратная логика - снижение хорошо)
    churn_change = _demo_data["churn_rate"]["current"] - _demo_data["churn_rate"]["previous"]
    metrics.append(MetricComparison(
        metric="churn_rate",
        current_value=_demo_data["churn_rate"]["current"],
        previous_value=_demo_data["churn_rate"]["previous"],
        change=churn_change,
        change_percent=(churn_change / _demo_data["churn_rate"]["previous"]) * 100,
        trend="down" if churn_change < 0 else "up",
        is_positive=churn_change < 0  # Снижение оттока хорошо
    ))

    # Резюме
    positive_metrics = sum(1 for m in metrics if m.is_positive)
    total_metrics = len(metrics)
    
    summary = {
        "total_metrics": total_metrics,
        "positive_changes": positive_metrics,
        "negative_changes": total_metrics - positive_metrics,
        "overall_trend": "positive" if positive_metrics > total_metrics / 2 else "negative",
        "biggest_improvement": max(metrics, key=lambda m: m.change_percent if m.is_positive else -m.change_percent),
        "biggest_decline": min(metrics, key=lambda m: m.change_percent if not m.is_positive else m.change_percent),
        "recommendation": _generate_recommendation(metrics)
    }

    return PeriodComparisonResponse(
        period_type=period_type,
        current_period={
            "start": current_start.isoformat(),
            "end": current_end.isoformat(),
            "label": _format_period_label(current_start, current_end, period_type)
        },
        previous_period={
            "start": previous_start.isoformat(),
            "end": previous_end.isoformat(),
            "label": _format_period_label(previous_start, previous_end, period_type)
        },
        metrics=metrics,
        summary=summary
    )

def _format_period_label(start: datetime, end: datetime, period_type: PeriodType) -> str:
    """Форматирование метки периода"""
    if period_type == PeriodType.WEEK:
        return f"Неделя {start.isocalendar()[1]}"
    elif period_type == PeriodType.MONTH:
        months_ru = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
        return f"{months_ru[start.month - 1]} {start.year}"
    elif period_type == PeriodType.QUARTER:
        quarter = (start.month - 1) // 3 + 1
        return f"Q{quarter} {start.year}"
    else:
        return str(start.year)

def _generate_recommendation(metrics: List[MetricComparison]) -> str:
    """Генерация рекомендации на основе сравнения"""
    revenue_metric = next((m for m in metrics if m.metric == "revenue"), None)
    churn_metric = next((m for m in metrics if m.metric == "churn_rate"), None)
    avg_check_metric = next((m for m in metrics if m.metric == "average_check"), None)
    
    recommendations = []
    
    if revenue_metric and revenue_metric.is_positive and revenue_metric.change_percent > 10:
        recommendations.append("Отличный рост выручки! Продолжайте текущую стратегию.")
    
    if churn_metric and not churn_metric.is_positive and churn_metric.change > 0:
        recommendations.append(f"Внимание: отток вырос на {churn_metric.change_percent:.1f}%. Рекомендуем проверить качество обслуживания.")
    
    if avg_check_metric and not avg_check_metric.is_positive and avg_check_metric.change < 0:
        recommendations.append("Средний чек снизился. Рассмотрите возможности увеличения среднего чека (upsell, кросс-селл).")
    
    if not recommendations:
        recommendations.append("Все метрики стабильны. Продолжайте мониторинг.")
    
    return " ".join(recommendations)


