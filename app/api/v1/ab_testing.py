"""
A/B Testing API
Модуль для создания и анализа A/B тестов
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import random
import math

router = APIRouter()

# ============================================
# Models
# ============================================

class TestStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"

class VariantType(str, Enum):
    CONTROL = "control"
    VARIANT = "variant"

class CreateTestRequest(BaseModel):
    name: str
    description: Optional[str] = None
    hypothesis: Optional[str] = None
    metric: str = "conversion"  # conversion, revenue, clicks, time_on_page
    control_name: str = "Контроль (A)"
    variant_name: str = "Вариант (B)"
    traffic_split: int = 50  # % трафика на вариант B
    min_sample_size: int = 1000
    confidence_level: float = 0.95

class UpdateTestRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TestStatus] = None
    traffic_split: Optional[int] = None

# ============================================
# In-memory storage (demo)
# ============================================

# Демо данные для A/B тестов
AB_TESTS = {
    "test_1": {
        "id": "test_1",
        "name": "Новая кнопка CTA",
        "description": "Тестируем зелёную кнопку vs синюю на главной странице",
        "hypothesis": "Зелёная кнопка увеличит конверсию на 15%",
        "metric": "conversion",
        "status": "running",
        "created_at": "2024-12-15T10:00:00",
        "started_at": "2024-12-16T00:00:00",
        "traffic_split": 50,
        "min_sample_size": 1000,
        "confidence_level": 0.95,
        "variants": {
            "control": {
                "name": "Синяя кнопка (A)",
                "visitors": 2847,
                "conversions": 342,
                "revenue": 1520000
            },
            "variant": {
                "name": "Зелёная кнопка (B)",
                "visitors": 2853,
                "conversions": 399,
                "revenue": 1780000
            }
        }
    },
    "test_2": {
        "id": "test_2",
        "name": "Цена на карточке товара",
        "description": "Показ цены сразу vs после клика",
        "hypothesis": "Скрытая цена увеличит клики на 20%",
        "metric": "clicks",
        "status": "running",
        "created_at": "2024-12-18T14:00:00",
        "started_at": "2024-12-19T00:00:00",
        "traffic_split": 50,
        "min_sample_size": 2000,
        "confidence_level": 0.95,
        "variants": {
            "control": {
                "name": "Цена видна (A)",
                "visitors": 1523,
                "conversions": 456,
                "revenue": 890000
            },
            "variant": {
                "name": "Цена скрыта (B)",
                "visitors": 1489,
                "conversions": 521,
                "revenue": 920000
            }
        }
    },
    "test_3": {
        "id": "test_3",
        "name": "Бесплатная доставка в баннере",
        "description": "Баннер с бесплатной доставкой vs скидка 10%",
        "hypothesis": "Бесплатная доставка эффективнее скидки",
        "metric": "revenue",
        "status": "completed",
        "created_at": "2024-12-01T09:00:00",
        "started_at": "2024-12-02T00:00:00",
        "ended_at": "2024-12-14T23:59:59",
        "traffic_split": 50,
        "min_sample_size": 5000,
        "confidence_level": 0.95,
        "winner": "variant",
        "variants": {
            "control": {
                "name": "Скидка 10% (A)",
                "visitors": 8542,
                "conversions": 854,
                "revenue": 4250000
            },
            "variant": {
                "name": "Бесплатная доставка (B)",
                "visitors": 8458,
                "conversions": 1015,
                "revenue": 5120000
            }
        }
    },
    "test_4": {
        "id": "test_4",
        "name": "Форма регистрации",
        "description": "Короткая форма (email) vs полная (email + телефон + имя)",
        "hypothesis": "Короткая форма увеличит регистрации на 30%",
        "metric": "conversion",
        "status": "paused",
        "created_at": "2024-12-20T11:00:00",
        "started_at": "2024-12-21T00:00:00",
        "paused_at": "2024-12-25T15:30:00",
        "traffic_split": 50,
        "min_sample_size": 1500,
        "confidence_level": 0.95,
        "variants": {
            "control": {
                "name": "Полная форма (A)",
                "visitors": 654,
                "conversions": 78,
                "revenue": 0
            },
            "variant": {
                "name": "Короткая форма (B)",
                "visitors": 648,
                "conversions": 124,
                "revenue": 0
            }
        }
    }
}

# ============================================
# Statistical Functions
# ============================================

def calculate_conversion_rate(conversions: int, visitors: int) -> float:
    """Рассчитать конверсию"""
    if visitors == 0:
        return 0
    return (conversions / visitors) * 100

def calculate_standard_error(p: float, n: int) -> float:
    """Рассчитать стандартную ошибку"""
    if n == 0:
        return 0
    return math.sqrt(p * (1 - p) / n)

def calculate_z_score(p1: float, p2: float, n1: int, n2: int) -> float:
    """Рассчитать Z-score для сравнения двух пропорций"""
    if n1 == 0 or n2 == 0:
        return 0
    
    p_pool = (p1 * n1 + p2 * n2) / (n1 + n2)
    se = math.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
    
    if se == 0:
        return 0
    
    return (p2 - p1) / se

def calculate_p_value(z_score: float) -> float:
    """Рассчитать p-value из Z-score (приближение)"""
    # Используем приближение для стандартного нормального распределения
    x = abs(z_score)
    # Приближение CDF для нормального распределения
    t = 1 / (1 + 0.2316419 * x)
    d = 0.3989423 * math.exp(-x * x / 2)
    p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    
    # Двусторонний тест
    return 2 * p

def calculate_confidence_interval(p: float, n: int, confidence: float = 0.95) -> tuple:
    """Рассчитать доверительный интервал"""
    # Z-значение для 95% доверительного интервала
    z = 1.96 if confidence == 0.95 else 2.576  # 99%
    se = calculate_standard_error(p, n)
    margin = z * se
    return (max(0, p - margin), min(1, p + margin))

def calculate_lift(control_rate: float, variant_rate: float) -> float:
    """Рассчитать относительное улучшение (lift)"""
    if control_rate == 0:
        return 0
    return ((variant_rate - control_rate) / control_rate) * 100

def calculate_sample_size_needed(baseline_rate: float, mde: float, power: float = 0.8, alpha: float = 0.05) -> int:
    """
    Рассчитать необходимый размер выборки
    mde = minimum detectable effect (например, 0.05 для 5% улучшения)
    """
    # Z-значения
    z_alpha = 1.96 if alpha == 0.05 else 2.576
    z_beta = 0.84 if power == 0.8 else 1.28  # 0.9 power
    
    p1 = baseline_rate
    p2 = baseline_rate * (1 + mde)
    
    numerator = (z_alpha * math.sqrt(2 * p1 * (1 - p1)) + z_beta * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
    denominator = (p2 - p1) ** 2
    
    if denominator == 0:
        return 10000
    
    return int(math.ceil(numerator / denominator))

# ============================================
# API Endpoints
# ============================================

@router.get("/tests")
async def get_all_tests():
    """Получить список всех A/B тестов"""
    tests = []
    for test_id, test in AB_TESTS.items():
        # Рассчитываем статистику
        control = test["variants"]["control"]
        variant = test["variants"]["variant"]
        
        control_rate = calculate_conversion_rate(control["conversions"], control["visitors"]) / 100
        variant_rate = calculate_conversion_rate(variant["conversions"], variant["visitors"]) / 100
        
        lift = calculate_lift(control_rate, variant_rate)
        z_score = calculate_z_score(control_rate, variant_rate, control["visitors"], variant["visitors"])
        p_value = calculate_p_value(z_score)
        
        is_significant = p_value < (1 - test["confidence_level"])
        
        tests.append({
            **test,
            "stats": {
                "control_rate": round(control_rate * 100, 2),
                "variant_rate": round(variant_rate * 100, 2),
                "lift": round(lift, 2),
                "p_value": round(p_value, 4),
                "is_significant": is_significant,
                "total_visitors": control["visitors"] + variant["visitors"],
                "days_running": calculate_days_running(test)
            }
        })
    
    return {"tests": tests}

@router.get("/tests/{test_id}")
async def get_test(test_id: str):
    """Получить детали A/B теста"""
    if test_id not in AB_TESTS:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    test = AB_TESTS[test_id]
    control = test["variants"]["control"]
    variant = test["variants"]["variant"]
    
    # Расчёт статистики
    control_rate = control["conversions"] / control["visitors"] if control["visitors"] > 0 else 0
    variant_rate = variant["conversions"] / variant["visitors"] if variant["visitors"] > 0 else 0
    
    lift = calculate_lift(control_rate, variant_rate)
    z_score = calculate_z_score(control_rate, variant_rate, control["visitors"], variant["visitors"])
    p_value = calculate_p_value(z_score)
    
    control_ci = calculate_confidence_interval(control_rate, control["visitors"])
    variant_ci = calculate_confidence_interval(variant_rate, variant["visitors"])
    
    is_significant = p_value < (1 - test["confidence_level"])
    
    # Определение победителя
    winner = None
    if is_significant:
        winner = "variant" if variant_rate > control_rate else "control"
    
    # Прогноз завершения
    current_sample = control["visitors"] + variant["visitors"]
    needed_sample = test["min_sample_size"] * 2
    daily_visitors = current_sample / max(1, calculate_days_running(test))
    days_to_completion = max(0, (needed_sample - current_sample) / daily_visitors) if daily_visitors > 0 else 999
    
    # Генерация данных по дням для графика
    daily_data = generate_daily_data(test)
    
    return {
        **test,
        "detailed_stats": {
            "control": {
                "rate": round(control_rate * 100, 2),
                "ci_lower": round(control_ci[0] * 100, 2),
                "ci_upper": round(control_ci[1] * 100, 2),
                "visitors": control["visitors"],
                "conversions": control["conversions"],
                "revenue": control["revenue"]
            },
            "variant": {
                "rate": round(variant_rate * 100, 2),
                "ci_lower": round(variant_ci[0] * 100, 2),
                "ci_upper": round(variant_ci[1] * 100, 2),
                "visitors": variant["visitors"],
                "conversions": variant["conversions"],
                "revenue": variant["revenue"]
            },
            "comparison": {
                "lift": round(lift, 2),
                "lift_ci_lower": round(lift - 5, 2),  # Упрощение
                "lift_ci_upper": round(lift + 5, 2),
                "z_score": round(z_score, 3),
                "p_value": round(p_value, 4),
                "is_significant": is_significant,
                "confidence_level": test["confidence_level"] * 100,
                "winner": winner
            },
            "progress": {
                "current_sample": current_sample,
                "needed_sample": needed_sample,
                "progress_percent": min(100, round(current_sample / needed_sample * 100, 1)),
                "days_running": calculate_days_running(test),
                "estimated_days_to_completion": round(days_to_completion, 1)
            }
        },
        "daily_data": daily_data,
        "recommendations": generate_recommendations(test, is_significant, lift, p_value)
    }

@router.post("/tests")
async def create_test(request: CreateTestRequest):
    """Создать новый A/B тест"""
    test_id = f"test_{len(AB_TESTS) + 1}"
    
    new_test = {
        "id": test_id,
        "name": request.name,
        "description": request.description,
        "hypothesis": request.hypothesis,
        "metric": request.metric,
        "status": "draft",
        "created_at": datetime.now().isoformat(),
        "traffic_split": request.traffic_split,
        "min_sample_size": request.min_sample_size,
        "confidence_level": request.confidence_level,
        "variants": {
            "control": {
                "name": request.control_name,
                "visitors": 0,
                "conversions": 0,
                "revenue": 0
            },
            "variant": {
                "name": request.variant_name,
                "visitors": 0,
                "conversions": 0,
                "revenue": 0
            }
        }
    }
    
    AB_TESTS[test_id] = new_test
    
    return {"message": "Тест создан", "test": new_test}

@router.put("/tests/{test_id}")
async def update_test(test_id: str, request: UpdateTestRequest):
    """Обновить A/B тест"""
    if test_id not in AB_TESTS:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    test = AB_TESTS[test_id]
    
    if request.name:
        test["name"] = request.name
    if request.description:
        test["description"] = request.description
    if request.traffic_split:
        test["traffic_split"] = request.traffic_split
    if request.status:
        test["status"] = request.status
        if request.status == "running" and "started_at" not in test:
            test["started_at"] = datetime.now().isoformat()
        elif request.status == "paused":
            test["paused_at"] = datetime.now().isoformat()
        elif request.status == "completed":
            test["ended_at"] = datetime.now().isoformat()
    
    return {"message": "Тест обновлён", "test": test}

@router.post("/tests/{test_id}/start")
async def start_test(test_id: str):
    """Запустить A/B тест"""
    if test_id not in AB_TESTS:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    test = AB_TESTS[test_id]
    test["status"] = "running"
    test["started_at"] = datetime.now().isoformat()
    
    return {"message": "Тест запущен", "test": test}

@router.post("/tests/{test_id}/stop")
async def stop_test(test_id: str):
    """Остановить A/B тест"""
    if test_id not in AB_TESTS:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    test = AB_TESTS[test_id]
    test["status"] = "completed"
    test["ended_at"] = datetime.now().isoformat()
    
    # Определяем победителя
    control = test["variants"]["control"]
    variant = test["variants"]["variant"]
    control_rate = control["conversions"] / control["visitors"] if control["visitors"] > 0 else 0
    variant_rate = variant["conversions"] / variant["visitors"] if variant["visitors"] > 0 else 0
    
    z_score = calculate_z_score(control_rate, variant_rate, control["visitors"], variant["visitors"])
    p_value = calculate_p_value(z_score)
    
    if p_value < (1 - test["confidence_level"]):
        test["winner"] = "variant" if variant_rate > control_rate else "control"
    else:
        test["winner"] = None
    
    return {"message": "Тест завершён", "test": test, "winner": test["winner"]}

@router.delete("/tests/{test_id}")
async def delete_test(test_id: str):
    """Удалить A/B тест"""
    if test_id not in AB_TESTS:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    del AB_TESTS[test_id]
    return {"message": "Тест удалён"}

@router.get("/tests/{test_id}/assign")
async def assign_variant(test_id: str, user_id: str):
    """Назначить вариант пользователю"""
    if test_id not in AB_TESTS:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    test = AB_TESTS[test_id]
    
    if test["status"] != "running":
        return {"variant": "control", "message": "Тест не активен"}
    
    # Детерминированное назначение на основе user_id
    hash_value = hash(user_id + test_id) % 100
    variant = "variant" if hash_value < test["traffic_split"] else "control"
    
    return {
        "test_id": test_id,
        "user_id": user_id,
        "variant": variant,
        "variant_name": test["variants"][variant]["name"]
    }

@router.post("/tests/{test_id}/track")
async def track_conversion(test_id: str, user_id: str, variant: str, revenue: float = 0):
    """Записать конверсию"""
    if test_id not in AB_TESTS:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    test = AB_TESTS[test_id]
    
    if variant not in ["control", "variant"]:
        raise HTTPException(status_code=400, detail="Неверный вариант")
    
    # Записываем конверсию (в реальности это было бы в БД)
    test["variants"][variant]["conversions"] += 1
    test["variants"][variant]["revenue"] += revenue
    
    return {"message": "Конверсия записана"}

@router.get("/calculator")
async def sample_size_calculator(
    baseline_rate: float = 0.1,
    minimum_effect: float = 0.1,
    power: float = 0.8,
    significance: float = 0.05
):
    """Калькулятор размера выборки"""
    sample_size = calculate_sample_size_needed(
        baseline_rate=baseline_rate,
        mde=minimum_effect,
        power=power,
        alpha=significance
    )
    
    return {
        "input": {
            "baseline_rate": f"{baseline_rate * 100}%",
            "minimum_detectable_effect": f"{minimum_effect * 100}%",
            "statistical_power": f"{power * 100}%",
            "significance_level": f"{significance * 100}%"
        },
        "result": {
            "sample_size_per_variant": sample_size,
            "total_sample_size": sample_size * 2,
            "estimated_days": {
                "at_100_visitors_per_day": round(sample_size * 2 / 100),
                "at_500_visitors_per_day": round(sample_size * 2 / 500),
                "at_1000_visitors_per_day": round(sample_size * 2 / 1000)
            }
        }
    }

# ============================================
# Helper Functions
# ============================================

def calculate_days_running(test: dict) -> int:
    """Рассчитать количество дней теста"""
    if "started_at" not in test:
        return 0
    
    start = datetime.fromisoformat(test["started_at"].replace("Z", ""))
    end = datetime.now()
    
    if "ended_at" in test:
        end = datetime.fromisoformat(test["ended_at"].replace("Z", ""))
    elif "paused_at" in test:
        end = datetime.fromisoformat(test["paused_at"].replace("Z", ""))
    
    return max(1, (end - start).days)

def generate_daily_data(test: dict) -> list:
    """Генерация данных по дням для графика"""
    days = calculate_days_running(test)
    daily_data = []
    
    control_total = test["variants"]["control"]["conversions"]
    variant_total = test["variants"]["variant"]["conversions"]
    control_visitors = test["variants"]["control"]["visitors"]
    variant_visitors = test["variants"]["variant"]["visitors"]
    
    for i in range(days):
        # Симуляция накопления данных
        progress = (i + 1) / days
        
        control_conv = int(control_total * progress * (0.9 + random.random() * 0.2))
        variant_conv = int(variant_total * progress * (0.9 + random.random() * 0.2))
        control_vis = int(control_visitors * progress * (0.9 + random.random() * 0.2))
        variant_vis = int(variant_visitors * progress * (0.9 + random.random() * 0.2))
        
        daily_data.append({
            "day": i + 1,
            "date": (datetime.now() - timedelta(days=days - i - 1)).strftime("%d.%m"),
            "control_rate": round(control_conv / max(1, control_vis) * 100, 2),
            "variant_rate": round(variant_conv / max(1, variant_vis) * 100, 2),
            "control_visitors": control_vis,
            "variant_visitors": variant_vis
        })
    
    return daily_data

def generate_recommendations(test: dict, is_significant: bool, lift: float, p_value: float) -> list:
    """Генерация рекомендаций"""
    recommendations = []
    
    control = test["variants"]["control"]
    variant = test["variants"]["variant"]
    total_visitors = control["visitors"] + variant["visitors"]
    needed = test["min_sample_size"] * 2
    
    if total_visitors < needed:
        progress = total_visitors / needed * 100
        recommendations.append({
            "type": "info",
            "icon": "⏳",
            "text": f"Собрано {progress:.0f}% от минимальной выборки. Продолжайте тест."
        })
    
    if is_significant:
        winner_name = test["variants"]["variant"]["name"] if lift > 0 else test["variants"]["control"]["name"]
        recommendations.append({
            "type": "success",
            "icon": "🎉",
            "text": f"Статистически значимый результат! Победитель: {winner_name}"
        })
        
        if abs(lift) > 10:
            recommendations.append({
                "type": "success",
                "icon": "🚀",
                "text": f"Отличный результат! Lift {lift:+.1f}% - внедряйте изменения"
            })
    else:
        if p_value > 0.3:
            recommendations.append({
                "type": "warning",
                "icon": "⚠️",
                "text": "Пока нет значимой разницы между вариантами"
            })
        else:
            recommendations.append({
                "type": "info",
                "icon": "📊",
                "text": f"Результат приближается к значимости (p={p_value:.3f}). Подождите ещё."
            })
    
    # Проверка баланса трафика
    traffic_ratio = control["visitors"] / max(1, variant["visitors"])
    if traffic_ratio < 0.9 or traffic_ratio > 1.1:
        recommendations.append({
            "type": "warning",
            "icon": "⚖️",
            "text": "Трафик распределён неравномерно. Проверьте настройки."
        })
    
    return recommendations














