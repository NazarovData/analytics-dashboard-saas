"""
Business Metrics API
Точные расчеты LTV, CAC, Unit Economics, ROI
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime as dt_datetime, timedelta
from app.services.business_model import BusinessModel

router = APIRouter()


class LTVCalculationRequest(BaseModel):
    """Запрос на расчет LTV"""
    data: List[Dict[str, Any]] = Field(..., description="Данные о транзакциях")
    client_column: str = Field(default='client_id', description="Название колонки с ID клиента")
    revenue_column: str = Field(default='price', description="Название колонки с выручкой")
    date_column: str = Field(default='date', description="Название колонки с датой")
    cost_column: Optional[str] = Field(default=None, description="Название колонки с себестоимостью")
    period_months: int = Field(default=12, description="Период анализа в месяцах")


class CACCalculationRequest(BaseModel):
    """Запрос на расчет CAC"""
    marketing_spend: float = Field(..., description="Маркетинговые расходы", gt=0)
    new_customers: int = Field(..., description="Количество новых клиентов", gt=0)


class UnitEconomicsRequest(BaseModel):
    """Запрос на расчет Unit Economics"""
    ltv: float = Field(..., description="Lifetime Value клиента", gt=0)
    cac: float = Field(..., description="Customer Acquisition Cost", gt=0)
    gross_margin_percent: float = Field(..., description="Валовая маржа в процентах", ge=0, le=100)
    avg_lifespan_months: float = Field(..., description="Средняя продолжительность жизни клиента в месяцах", gt=0)


@router.post("/ltv/calculate")
async def calculate_ltv(
    request: LTVCalculationRequest
):
    """
    Точный расчет LTV с использованием продвинутых методов:
    - Простой LTV (историческая выручка)
    - LTV с учетом маржи
    - Прогнозный LTV (с retention)
    - Когортный LTV
    
    Также рассчитывает:
    - ARPU (Average Revenue Per User)
    - Churn Rate и Retention Rate
    - Сегментацию клиентов
    - Прогнозы выручки
    """
    try:
        result = BusinessModel.calculate_precise_ltv(
            df_data=request.data,
            client_column=request.client_column,
            revenue_column=request.revenue_column,
            date_column=request.date_column,
            cost_column=request.cost_column,
            period_months=request.period_months
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('message', 'Ошибка расчета'))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при расчете LTV: {str(e)}")


@router.post("/cac/calculate")
async def calculate_cac(
    request: CACCalculationRequest
):
    """
    Расчет CAC (Customer Acquisition Cost)
    
    CAC = Маркетинговые расходы / Количество новых клиентов
    
    Включает бенчмарки по индустриям для сравнения.
    """
    try:
        result = BusinessModel.calculate_cac(
            marketing_spend=request.marketing_spend,
            new_customers=request.new_customers
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('message', 'Ошибка расчета'))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при расчете CAC: {str(e)}")


@router.post("/unit-economics/calculate")
async def calculate_unit_economics(
    request: UnitEconomicsRequest
):
    """
    Расчет Unit Economics (юнит-экономики)
    
    Ключевые метрики:
    - LTV/CAC Ratio (должен быть > 3 для здорового бизнеса)
    - Payback Period (срок окупаемости клиента)
    - Customer Profitability (прибыль с клиента)
    - Customer ROI
    
    Оценка здоровья бизнеса:
    - Excellent: LTV/CAC >= 3
    - Good: LTV/CAC >= 2
    - Acceptable: LTV/CAC >= 1
    - Poor: LTV/CAC < 1
    """
    try:
        result = BusinessModel.calculate_unit_economics(
            ltv=request.ltv,
            cac=request.cac,
            gross_margin_percent=request.gross_margin_percent,
            avg_lifespan_months=request.avg_lifespan_months
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при расчете Unit Economics: {str(e)}")


@router.get("/ltv/demo")
async def get_ltv_demo():
    """
    Демо-данные для расчета LTV
    Показывает пример использования с реальными данными
    """
    # Генерируем демо-данные
    import random
    
    demo_data = []
    clients = [f"Client_{i}" for i in range(1, 51)]  # 50 клиентов
    
    start_date = dt_datetime.now() - timedelta(days=365)
    
    for client_id in clients:
        # Каждый клиент делает от 1 до 10 покупок
        num_orders = random.randint(1, 10)
        
        for order_num in range(num_orders):
            order_date = start_date + timedelta(days=random.randint(0, 365))
            revenue = random.uniform(500, 5000)
            cost = revenue * random.uniform(0.5, 0.7)  # 50-70% себестоимость
            
            demo_data.append({
                'client_id': client_id,
                'price': round(revenue, 2),
                'cost': round(cost, 2),
                'date': order_date.strftime('%Y-%m-%d')
            })
    
    # Рассчитываем LTV
    result = BusinessModel.calculate_precise_ltv(
        df_data=demo_data,
        client_column='client_id',
        revenue_column='price',
        date_column='date',
        cost_column='cost',
        period_months=12
    )
    
    return {
        'demo_data_sample': demo_data[:10],  # Первые 10 записей для примера
        'total_records': len(demo_data),
        'ltv_analysis': result
    }


@router.get("/business-health")
async def get_business_health():
    """
    Общая оценка здоровья бизнеса
    Комплексный анализ всех ключевых метрик
    """
    # Это демо-версия, в реальности данные берутся из БД пользователя
    
    return {
        'overall_health': 'good',
        'health_score': 78,  # из 100
        'metrics': {
            'ltv': {
                'value': 15000,
                'status': 'good',
                'benchmark': 12000,
                'trend': 'up'
            },
            'cac': {
                'value': 4500,
                'status': 'good',
                'benchmark': 5000,
                'trend': 'down'
            },
            'ltv_cac_ratio': {
                'value': 3.33,
                'status': 'excellent',
                'benchmark': 3.0,
                'trend': 'up'
            },
            'churn_rate': {
                'value': 25,
                'status': 'acceptable',
                'benchmark': 20,
                'trend': 'stable'
            },
            'gross_margin': {
                'value': 42,
                'status': 'good',
                'benchmark': 40,
                'trend': 'up'
            },
            'payback_period': {
                'value': 8.5,
                'status': 'excellent',
                'benchmark': 12,
                'trend': 'down'
            }
        },
        'alerts': [
            {
                'type': 'warning',
                'metric': 'churn_rate',
                'message': 'Churn rate выше бенчмарка. Рекомендуем усилить retention-маркетинг.'
            }
        ],
        'recommendations': [
            '🎯 LTV/CAC ratio отличный (3.33). Можно увеличить маркетинговый бюджет.',
            '📉 Работайте над снижением churn rate с 25% до 20%.',
            '💰 Gross margin хороший. Продолжайте оптимизацию затрат.',
            '⚡ Payback period 8.5 мес - отлично! Бизнес быстро окупается.'
        ],
        'next_steps': [
            'Запустите реактивационную кампанию для снижения churn',
            'Увеличьте маркетинговый бюджет на 20% (юнит-экономика позволяет)',
            'Внедрите программу лояльности для повышения LTV',
            'Оптимизируйте воронку продаж для снижения CAC'
        ]
    }


@router.get("/benchmarks")
async def get_industry_benchmarks():
    """
    Бенчмарки по индустриям
    Средние значения ключевых метрик для сравнения
    """
    return {
        'ecommerce': {
            'ltv': {'low': 5000, 'avg': 15000, 'high': 50000},
            'cac': {'low': 30, 'avg': 70, 'high': 150},
            'ltv_cac_ratio': {'low': 2, 'avg': 3.5, 'high': 5},
            'churn_rate': {'low': 15, 'avg': 25, 'high': 40},
            'gross_margin': {'low': 30, 'avg': 45, 'high': 60},
            'payback_months': {'low': 6, 'avg': 12, 'high': 18}
        },
        'saas': {
            'ltv': {'low': 10000, 'avg': 30000, 'high': 100000},
            'cac': {'low': 100, 'avg': 300, 'high': 1000},
            'ltv_cac_ratio': {'low': 3, 'avg': 5, 'high': 10},
            'churn_rate': {'low': 5, 'avg': 10, 'high': 20},
            'gross_margin': {'low': 70, 'avg': 85, 'high': 95},
            'payback_months': {'low': 12, 'avg': 18, 'high': 24}
        },
        'retail': {
            'ltv': {'low': 2000, 'avg': 8000, 'high': 25000},
            'cac': {'low': 10, 'avg': 30, 'high': 80},
            'ltv_cac_ratio': {'low': 2, 'avg': 4, 'high': 8},
            'churn_rate': {'low': 20, 'avg': 35, 'high': 50},
            'gross_margin': {'low': 25, 'avg': 40, 'high': 55},
            'payback_months': {'low': 3, 'avg': 8, 'high': 15}
        },
        'b2b': {
            'ltv': {'low': 20000, 'avg': 80000, 'high': 300000},
            'cac': {'low': 500, 'avg': 2000, 'high': 10000},
            'ltv_cac_ratio': {'low': 3, 'avg': 6, 'high': 15},
            'churn_rate': {'low': 5, 'avg': 12, 'high': 25},
            'gross_margin': {'low': 50, 'avg': 70, 'high': 85},
            'payback_months': {'low': 12, 'avg': 24, 'high': 36}
        }
    }


@router.get("/formulas")
async def get_formulas():
    """
    Справочник формул для расчета бизнес-метрик
    """
    return {
        'ltv': {
            'name': 'Lifetime Value (LTV)',
            'description': 'Прогнозируемая прибыль от клиента за все время сотрудничества',
            'formulas': [
                {
                    'name': 'Простой LTV',
                    'formula': 'LTV = Средняя выручка на клиента',
                    'use_case': 'Базовый расчет для начала'
                },
                {
                    'name': 'LTV с маржой',
                    'formula': 'LTV = ARPU × Gross Margin',
                    'use_case': 'Учет реальной прибыльности'
                },
                {
                    'name': 'Прогнозный LTV',
                    'formula': 'LTV = (ARPU × Gross Margin) / Churn Rate',
                    'use_case': 'Прогноз с учетом оттока'
                },
                {
                    'name': 'Когортный LTV',
                    'formula': 'LTV = AOV × Purchase Frequency × Customer Lifespan × Gross Margin',
                    'use_case': 'Наиболее точный расчет'
                }
            ]
        },
        'cac': {
            'name': 'Customer Acquisition Cost (CAC)',
            'description': 'Стоимость привлечения одного клиента',
            'formula': 'CAC = Маркетинговые расходы / Количество новых клиентов',
            'components': [
                'Реклама (контекст, таргет, SEO)',
                'Зарплата маркетологов',
                'Инструменты и сервисы',
                'Комиссии партнеров'
            ]
        },
        'ltv_cac_ratio': {
            'name': 'LTV/CAC Ratio',
            'description': 'Соотношение ценности клиента к стоимости привлечения',
            'formula': 'LTV/CAC Ratio = LTV / CAC',
            'benchmarks': {
                'poor': '< 1 (убыточно)',
                'acceptable': '1-2 (окупается)',
                'good': '2-3 (прибыльно)',
                'excellent': '> 3 (очень прибыльно)'
            }
        },
        'payback_period': {
            'name': 'Payback Period',
            'description': 'Срок окупаемости клиента (в месяцах)',
            'formula': 'Payback = CAC / (Monthly Revenue per Customer × Gross Margin)',
            'target': '< 12 месяцев для здорового бизнеса'
        },
        'churn_rate': {
            'name': 'Churn Rate',
            'description': 'Процент клиентов, которые перестали покупать',
            'formula': 'Churn Rate = (Ушедшие клиенты / Всего клиентов) × 100%',
            'inverse': 'Retention Rate = 100% - Churn Rate'
        },
        'arpu': {
            'name': 'Average Revenue Per User (ARPU)',
            'description': 'Средняя выручка на одного пользователя',
            'formula': 'ARPU = Общая выручка / Количество клиентов'
        },
        'gross_margin': {
            'name': 'Gross Margin',
            'description': 'Валовая маржа (прибыль до операционных расходов)',
            'formula': 'Gross Margin = ((Выручка - Себестоимость) / Выручка) × 100%'
        },
        'customer_roi': {
            'name': 'Customer ROI',
            'description': 'Возврат инвестиций на клиента',
            'formula': 'Customer ROI = ((LTV - CAC) / CAC) × 100%'
        }
    }
