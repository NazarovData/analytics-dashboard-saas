"""
📊 METRICS CONTRACT - Метрический контракт для Analitix AI
Определяет формулы, обязательные поля и уровни уверенности для каждой метрики.

Версия 2.0 - Enterprise Level
"""
from typing import Dict, List, Any, Optional, Literal
from enum import Enum
from dataclasses import dataclass
from datetime import datetime


class ConfidenceLevel(Enum):
    """Уровни уверенности в метрике"""
    HIGH = "high"        # 🟢 100% данные есть
    MEDIUM = "medium"    # 🟡 Есть допущения
    LOW = "low"          # 🔴 Эвристика / предположение
    UNAVAILABLE = "unavailable"  # ❌ Невозможно рассчитать


@dataclass
class MetricDefinition:
    """Определение метрики с формулой и требованиями"""
    name: str                           # Название метрики
    formula: str                        # Формула расчёта
    required_fields: List[str]          # Обязательные поля в данных
    optional_fields: List[str]          # Опциональные поля
    assumptions: List[str]              # Допущения при расчёте
    unit: str                           # Единица измерения
    description: str                    # Описание для пользователя


# ============================================
# 📐 МЕТРИЧЕСКИЙ КОНТРАКТ
# ============================================
METRICS_CONTRACT: Dict[str, MetricDefinition] = {
    
    # 1️⃣ ОБЩАЯ ВЫРУЧКА
    "total_revenue": MetricDefinition(
        name="Общая выручка",
        formula="SUM(price * quantity) или SUM(revenue)",
        required_fields=["price", "quantity"],  # или ["revenue"]
        optional_fields=["revenue", "total"],
        assumptions=[],
        unit="₽",
        description="Суммарная выручка за период"
    ),
    
    # 2️⃣ КОЛИЧЕСТВО ЗАКАЗОВ
    "total_orders": MetricDefinition(
        name="Количество заказов",
        formula="COUNT(DISTINCT order_id) или COUNT(rows)",
        required_fields=[],  # Каждая строка = транзакция
        optional_fields=["order_id"],
        assumptions=["Если нет order_id: 1 строка = 1 заказ"],
        unit="шт",
        description="Общее количество заказов/транзакций"
    ),
    
    # 3️⃣ СРЕДНИЙ ЧЕК
    "average_check": MetricDefinition(
        name="Средний чек",
        formula="total_revenue / total_orders",
        required_fields=["price"],
        optional_fields=["order_id"],
        assumptions=["Если нет order_id: средняя стоимость транзакции"],
        unit="₽",
        description="Средняя сумма одного заказа"
    ),
    
    # 4️⃣ УНИКАЛЬНЫЕ КЛИЕНТЫ
    "unique_clients": MetricDefinition(
        name="Уникальные клиенты",
        formula="COUNT(DISTINCT client_id)",
        required_fields=["client_id"],  # ОБЯЗАТЕЛЬНО!
        optional_fields=["customer", "customer_name", "client"],
        assumptions=["⚠️ Без client_id метрика недоступна"],
        unit="чел",
        description="Количество уникальных покупателей"
    ),
    
    # 5️⃣ ПОВТОРНЫЕ ПОКУПКИ
    "repeat_purchase_rate": MetricDefinition(
        name="Повторные покупки",
        formula="COUNT(clients с orders > 1) / total_clients",
        required_fields=["client_id", "order_id"],
        optional_fields=["date"],
        assumptions=["Требует идентификацию клиентов и заказов"],
        unit="%",
        description="Доля клиентов с более чем 1 заказом"
    ),
    
    # 6️⃣ LTV (Lifetime Value)
    "ltv": MetricDefinition(
        name="LTV клиента",
        formula="avg_revenue_per_client * avg_lifespan",
        required_fields=["client_id", "price", "date"],
        optional_fields=["order_id"],
        assumptions=["Требует историю заказов по клиентам"],
        unit="₽",
        description="Пожизненная ценность клиента"
    ),
    
    # 7️⃣ ТОП ТОВАРЫ
    "top_products": MetricDefinition(
        name="Топ товары",
        formula="GROUP BY product, SUM(revenue), ORDER BY revenue DESC",
        required_fields=["product", "price"],
        optional_fields=["quantity", "revenue"],
        assumptions=[],
        unit="список",
        description="Товары с максимальной выручкой"
    ),
    
    # 8️⃣ ПРИБЫЛЬ
    "profit": MetricDefinition(
        name="Прибыль",
        formula="SUM(revenue - cost)",
        required_fields=["price", "cost"],
        optional_fields=["revenue"],
        assumptions=["Требует данные о себестоимости"],
        unit="₽",
        description="Чистая прибыль (выручка минус затраты)"
    ),
    
    # 9️⃣ МАРЖИНАЛЬНОСТЬ
    "margin": MetricDefinition(
        name="Маржинальность",
        formula="(revenue - cost) / revenue * 100",
        required_fields=["price", "cost"],
        optional_fields=["revenue"],
        assumptions=["Требует данные о себестоимости"],
        unit="%",
        description="Процент прибыли от выручки"
    ),
    
    # 🔟 ДИНАМИКА ПО ДАТАМ
    "daily_revenue": MetricDefinition(
        name="Динамика выручки",
        formula="GROUP BY date, SUM(revenue)",
        required_fields=["date", "price"],
        optional_fields=["revenue"],
        assumptions=[],
        unit="₽/день",
        description="Выручка по дням"
    )
}


class DataAvailabilityChecker:
    """
    🔍 Проверка доступности данных для расчёта метрик
    """
    
    @staticmethod
    def check_fields(df_columns: List[str]) -> Dict[str, bool]:
        """
        Проверяет какие поля доступны в данных
        
        Args:
            df_columns: Список колонок в DataFrame
            
        Returns:
            Dict с наличием каждого типа данных
        """
        columns_lower = [c.lower() for c in df_columns]
        
        # Паттерны для определения полей (расширенный список)
        field_patterns = {
            "date": ["date", "дата", "datetime", "timestamp", "day", "день", "created", "order_date"],
            "product": ["product", "товар", "item", "название", "name", "sku", "артикул"],
            "price": ["price", "цена", "amount", "сумма", "revenue", "выручка", "total", "итого", "стоимость"],
            "quantity": ["quantity", "количество", "qty", "count", "кол-во", "шт", "units", "pieces"],
            "client_id": ["client_id", "customer_id", "клиент_id", "customer", "client", "клиент", "buyer", "покупатель", "user_id"],
            "order_id": ["order_id", "заказ_id", "order", "заказ", "transaction_id", "транзакция", "invoice", "счет", "receipt", "чек"],
            "cost": ["cost", "себестоимость", "закупка", "purchase_price", "unit_cost", "закупочная"],
            "region": ["region", "регион", "город", "city", "область", "country", "страна", "location", "адрес"],
            "profit": ["profit", "прибыль", "margin", "маржа", "доход"],
            "source": ["source", "источник", "канал", "channel", "utm_source", "campaign", "medium"],
            "category": ["category", "категория", "group", "группа", "type", "тип"],
            "payment_status": ["status", "статус", "payment_status", "оплата", "state", "paid"]
        }
        
        available = {}
        for field, patterns in field_patterns.items():
            available[field] = any(
                any(pattern in col for pattern in patterns) 
                for col in columns_lower
            )
        
        return available
    
    @staticmethod
    def get_metric_confidence(
        metric_name: str, 
        available_fields: Dict[str, bool]
    ) -> Dict[str, Any]:
        """
        Определяет уровень уверенности для конкретной метрики
        
        Returns:
            {
                "level": ConfidenceLevel,
                "reason": str,
                "assumptions": List[str],
                "can_calculate": bool
            }
        """
        if metric_name not in METRICS_CONTRACT:
            return {
                "level": ConfidenceLevel.UNAVAILABLE,
                "reason": "Метрика не определена в контракте",
                "assumptions": [],
                "can_calculate": False
            }
        
        contract = METRICS_CONTRACT[metric_name]
        
        # Проверяем обязательные поля
        missing_required = []
        for field in contract.required_fields:
            # Особый случай: price может быть заменён на revenue
            if field == "price" and (available_fields.get("price") or available_fields.get("revenue")):
                continue
            if not available_fields.get(field, False):
                missing_required.append(field)
        
        # Определяем уровень уверенности
        if not missing_required:
            # Все обязательные поля есть
            if not contract.assumptions:
                return {
                    "level": ConfidenceLevel.HIGH,
                    "reason": "Все необходимые данные доступны",
                    "assumptions": [],
                    "can_calculate": True
                }
            else:
                return {
                    "level": ConfidenceLevel.MEDIUM,
                    "reason": "Данные доступны, но есть допущения",
                    "assumptions": contract.assumptions,
                    "can_calculate": True
                }
        else:
            # Некоторые поля отсутствуют
            # Проверяем можно ли рассчитать с допущениями
            critical_missing = [f for f in missing_required if f in ["client_id", "order_id", "cost"]]
            
            if critical_missing:
                return {
                    "level": ConfidenceLevel.UNAVAILABLE,
                    "reason": f"Отсутствуют критические поля: {', '.join(critical_missing)}",
                    "assumptions": [f"❌ Требуется поле: {f}" for f in critical_missing],
                    "can_calculate": False
                }
            else:
                return {
                    "level": ConfidenceLevel.LOW,
                    "reason": f"Отсутствуют поля: {', '.join(missing_required)}",
                    "assumptions": [f"⚠️ Допущение для: {f}" for f in missing_required],
                    "can_calculate": True
                }


class MetricsCalculator:
    """
    🧮 Калькулятор метрик с учётом доступности данных
    """
    
    def __init__(self, data: List[Dict], columns: List[str]):
        self.data = data
        self.columns = columns
        self.available_fields = DataAvailabilityChecker.check_fields(columns)
        self._confidence_cache = {}
    
    def get_confidence(self, metric_name: str) -> Dict[str, Any]:
        """Получить уровень уверенности для метрики"""
        if metric_name not in self._confidence_cache:
            self._confidence_cache[metric_name] = DataAvailabilityChecker.get_metric_confidence(
                metric_name, self.available_fields
            )
        return self._confidence_cache[metric_name]
    
    def calculate_all_metrics(self) -> Dict[str, Any]:
        """
        Рассчитать все метрики с указанием уверенности
        
        Returns:
            {
                "metrics": {...},
                "confidence": {...},
                "data_quality": {...},
                "assumptions": [...]
            }
        """
        result = {
            "metrics": {},
            "confidence": {},
            "assumptions": [],
            "data_quality": self._calculate_data_quality()
        }
        
        # Рассчитываем каждую метрику
        for metric_name in METRICS_CONTRACT.keys():
            confidence = self.get_confidence(metric_name)
            result["confidence"][metric_name] = {
                "level": confidence["level"].value,
                "reason": confidence["reason"],
                "can_calculate": confidence["can_calculate"]
            }
            
            if confidence["can_calculate"]:
                try:
                    value = self._calculate_metric(metric_name)
                    result["metrics"][metric_name] = value
                except Exception as e:
                    result["metrics"][metric_name] = None
                    result["confidence"][metric_name]["level"] = "unavailable"
                    result["confidence"][metric_name]["reason"] = f"Ошибка расчёта: {str(e)}"
            
            # Собираем допущения
            if confidence["assumptions"]:
                result["assumptions"].extend(confidence["assumptions"])
        
        return result
    
    def _calculate_metric(self, metric_name: str) -> Any:
        """Рассчитать конкретную метрику"""
        if not self.data:
            return None
            
        if metric_name == "total_revenue":
            return sum(
                (row.get("amount") or row.get("price", 0)) * row.get("quantity", 1)
                for row in self.data
            )
        
        elif metric_name == "total_orders":
            if self.available_fields.get("order_id"):
                return len(set(row.get("order_id") for row in self.data if row.get("order_id")))
            return len(self.data)
        
        elif metric_name == "average_check":
            total = self._calculate_metric("total_revenue")
            orders = self._calculate_metric("total_orders")
            return total / orders if orders > 0 else 0
        
        elif metric_name == "unique_clients":
            if not self.available_fields.get("client_id"):
                return None  # Не считаем без client_id!
            clients = set(row.get("customer") or row.get("client_id") for row in self.data)
            clients.discard(None)
            clients.discard("")
            return len(clients)
        
        elif metric_name == "top_products":
            product_stats = {}
            for row in self.data:
                product = row.get("product", "Неизвестно")
                if product not in product_stats:
                    product_stats[product] = {"revenue": 0, "quantity": 0}
                revenue = (row.get("amount") or row.get("price", 0)) * row.get("quantity", 1)
                product_stats[product]["revenue"] += revenue
                product_stats[product]["quantity"] += row.get("quantity", 1)
            
            return sorted(
                [{"product": k, **v} for k, v in product_stats.items()],
                key=lambda x: x["revenue"],
                reverse=True
            )[:10]
        
        elif metric_name == "profit":
            if not self.available_fields.get("cost"):
                return None
            return sum(
                ((row.get("amount") or row.get("price", 0)) - row.get("cost", 0)) * row.get("quantity", 1)
                for row in self.data
            )
        
        elif metric_name == "margin":
            profit = self._calculate_metric("profit")
            revenue = self._calculate_metric("total_revenue")
            if profit is None or revenue == 0:
                return None
            return (profit / revenue) * 100
        
        elif metric_name == "daily_revenue":
            date_stats = {}
            for row in self.data:
                date_key = str(row.get("date", "Неизвестно"))[:10]
                if date_key not in date_stats:
                    date_stats[date_key] = 0
                revenue = (row.get("amount") or row.get("price", 0)) * row.get("quantity", 1)
                date_stats[date_key] += revenue
            
            return [{"date": k, "revenue": v} for k, v in sorted(date_stats.items())]
        
        return None
    
    def _calculate_data_quality(self) -> Dict[str, Any]:
        """Рассчитать качество данных"""
        if not self.data:
            return {
                "score": 0,
                "total_rows": 0,
                "valid_rows": 0,
                "issues": ["Нет данных"]
            }
        
        total = len(self.data)
        issues = []
        
        # Проверяем наличие ключевых полей
        fields_coverage = {
            "date": sum(1 for r in self.data if r.get("date")) / total * 100,
            "product": sum(1 for r in self.data if r.get("product")) / total * 100,
            "price": sum(1 for r in self.data if r.get("amount") or r.get("price")) / total * 100,
            "quantity": sum(1 for r in self.data if r.get("quantity")) / total * 100,
        }
        
        # Добавляем проблемы
        for field, coverage in fields_coverage.items():
            if coverage < 50:
                issues.append(f"Низкое заполнение поля '{field}': {coverage:.0f}%")
        
        # Рассчитываем общий скор
        base_score = sum(fields_coverage.values()) / len(fields_coverage)
        
        # Бонус за наличие важных полей
        bonus = 0
        if self.available_fields.get("client_id"):
            bonus += 10
        if self.available_fields.get("cost"):
            bonus += 10
        if self.available_fields.get("order_id"):
            bonus += 5
        
        score = min(100, base_score + bonus)
        
        return {
            "score": round(score, 1),
            "total_rows": total,
            "valid_rows": sum(1 for r in self.data if r.get("amount") or r.get("price")),
            "fields_coverage": fields_coverage,
            "issues": issues
        }


def calculate_ai_trust_score(metrics_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    🎯 AI TRUST SCORE - Итоговый скоринг качества анализа
    
    Returns:
        {
            "overall_score": int (0-100),
            "data_score": int,
            "math_score": int,
            "insights_score": int,
            "recommendation": str
        }
    """
    # 1. Data Score - качество входных данных
    data_quality = metrics_result.get("data_quality", {})
    data_score = data_quality.get("score", 0)
    
    # 2. Math Score - качество расчётов (% метрик с HIGH confidence)
    confidence = metrics_result.get("confidence", {})
    high_confidence = sum(1 for c in confidence.values() if c.get("level") == "high")
    medium_confidence = sum(1 for c in confidence.values() if c.get("level") == "medium")
    total_metrics = len(confidence) if confidence else 1
    
    math_score = ((high_confidence * 100 + medium_confidence * 70) / total_metrics) if total_metrics > 0 else 0
    
    # 3. Insights Score - зависит от data + math
    insights_score = (data_score * 0.4 + math_score * 0.6)
    
    # 4. Overall Score
    overall_score = round(
        data_score * 0.3 +      # 30% вес данных
        math_score * 0.4 +       # 40% вес математики
        insights_score * 0.3     # 30% вес инсайтов
    )
    
    # 5. Рекомендация
    if overall_score >= 90:
        recommendation = "✅ Высокая достоверность. Данные подходят для бизнес-решений."
    elif overall_score >= 70:
        recommendation = "🟡 Хорошая достоверность. Обратите внимание на допущения."
    elif overall_score >= 50:
        recommendation = "⚠️ Средняя достоверность. Рекомендуем дополнить данные."
    else:
        recommendation = "🔴 Низкая достоверность. Требуется больше данных для точного анализа."
    
    return {
        "overall_score": overall_score,
        "data_score": round(data_score),
        "math_score": round(math_score),
        "insights_score": round(insights_score),
        "recommendation": recommendation,
        "breakdown": {
            "high_confidence_metrics": high_confidence,
            "medium_confidence_metrics": medium_confidence,
            "total_metrics": total_metrics
        }
    }


