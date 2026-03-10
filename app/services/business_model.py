"""
Business Model & Advanced LTV Calculation
Точная бизнес-модель с расчетом LTV, CAC, Payback, Unit Economics
"""
from typing import Dict, List, Any, Optional
from datetime import datetime as dt_datetime, timedelta
import statistics
from collections import defaultdict


class BusinessModel:
    """
    Продвинутая бизнес-модель для расчета ключевых метрик
    """
    
    @staticmethod
    def calculate_precise_ltv(
        df_data: List[Dict[str, Any]],
        client_column: str = 'client_id',
        revenue_column: str = 'price',
        date_column: str = 'date',
        cost_column: Optional[str] = None,
        period_months: int = 12
    ) -> Dict[str, Any]:
        """
        Точный расчет LTV с учетом:
        - Retention Rate (удержание клиентов)
        - Churn Rate (отток)
        - Average Revenue Per User (ARPU)
        - Customer Lifespan (средняя продолжительность жизни клиента)
        - Gross Margin (валовая маржа)
        
        Формула: LTV = ARPU × Customer Lifespan × Gross Margin
        Или: LTV = (ARPU × Gross Margin) / Churn Rate
        """
        
        if not df_data:
            return {'success': False, 'message': 'Нет данных'}
        
        # Группируем данные по клиентам
        clients_data = defaultdict(lambda: {
            'orders': [],
            'revenue': 0,
            'cost': 0,
            'first_purchase': None,
            'last_purchase': None,
            'order_count': 0
        })
        
        for row in df_data:
            client_id = row.get(client_column)
            if not client_id:
                continue
                
            revenue = float(row.get(revenue_column, 0))
            cost = float(row.get(cost_column, 0)) if cost_column and cost_column in row else revenue * 0.6  # 60% себестоимость по умолчанию
            
            try:
                order_date = datetime.strptime(str(row.get(date_column)), '%Y-%m-%d')
            except:
                continue
            
            clients_data[client_id]['orders'].append(order_date)
            clients_data[client_id]['revenue'] += revenue
            clients_data[client_id]['cost'] += cost
            clients_data[client_id]['order_count'] += 1
            
            if not clients_data[client_id]['first_purchase']:
                clients_data[client_id]['first_purchase'] = order_date
            else:
                clients_data[client_id]['first_purchase'] = min(
                    clients_data[client_id]['first_purchase'], 
                    order_date
                )
            
            if not clients_data[client_id]['last_purchase']:
                clients_data[client_id]['last_purchase'] = order_date
            else:
                clients_data[client_id]['last_purchase'] = max(
                    clients_data[client_id]['last_purchase'], 
                    order_date
                )
        
        if not clients_data:
            return {'success': False, 'message': 'Нет данных о клиентах'}
        
        # === 1. БАЗОВЫЕ МЕТРИКИ ===
        total_clients = len(clients_data)
        total_revenue = sum(c['revenue'] for c in clients_data.values())
        total_cost = sum(c['cost'] for c in clients_data.values())
        total_orders = sum(c['order_count'] for c in clients_data.values())
        
        # Средняя выручка на клиента (ARPU - Average Revenue Per User)
        arpu = total_revenue / total_clients
        
        # Средний чек
        average_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Валовая маржа (Gross Margin)
        gross_profit = total_revenue - total_cost
        gross_margin_percent = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        gross_margin_ratio = gross_profit / total_revenue if total_revenue > 0 else 0
        
        # === 2. RETENTION & CHURN ===
        
        # Средняя продолжительность жизни клиента (в днях)
        lifespans = []
        for client in clients_data.values():
            if client['first_purchase'] and client['last_purchase']:
                lifespan_days = (client['last_purchase'] - client['first_purchase']).days
                lifespans.append(max(1, lifespan_days))  # Минимум 1 день
        
        avg_lifespan_days = statistics.mean(lifespans) if lifespans else 30
        avg_lifespan_months = avg_lifespan_days / 30
        
        # Количество покупок на клиента
        orders_per_client = total_orders / total_clients
        
        # Churn Rate (упрощенный расчет)
        # Клиенты, которые не покупали более 60 дней считаются ушедшими
        today = dt_datetime.now()
        churned_clients = 0
        active_clients = 0
        
        for client in clients_data.values():
            if client['last_purchase']:
                days_since_last = (today - client['last_purchase']).days
                if days_since_last > 60:
                    churned_clients += 1
                else:
                    active_clients += 1
        
        churn_rate = (churned_clients / total_clients) if total_clients > 0 else 0
        retention_rate = 1 - churn_rate
        
        # === 3. РАСЧЕТ LTV ===
        
        # Метод 1: Простой LTV (историческая выручка на клиента)
        simple_ltv = arpu
        
        # Метод 2: LTV с учетом маржи
        ltv_with_margin = arpu * gross_margin_ratio
        
        # Метод 3: Прогнозный LTV (с учетом retention)
        # LTV = (ARPU × Gross Margin) / Churn Rate
        if churn_rate > 0:
            predictive_ltv = (arpu * gross_margin_ratio) / churn_rate
        else:
            # Если churn = 0, используем среднюю продолжительность жизни
            predictive_ltv = arpu * gross_margin_ratio * (avg_lifespan_months / period_months)
        
        # Метод 4: LTV на основе когорт (упрощенный)
        # LTV = Average Order Value × Purchase Frequency × Customer Lifespan
        purchase_frequency_per_month = orders_per_client / avg_lifespan_months if avg_lifespan_months > 0 else orders_per_client
        cohort_ltv = average_order_value * purchase_frequency_per_month * avg_lifespan_months * gross_margin_ratio
        
        # Итоговый LTV (среднее между методами для точности)
        final_ltv = statistics.mean([ltv_with_margin, predictive_ltv, cohort_ltv])
        
        # === 4. СЕГМЕНТАЦИЯ КЛИЕНТОВ ===
        client_segments = BusinessModel._segment_clients(clients_data, final_ltv)
        
        # === 5. ПРОГНОЗ ===
        # Годовой LTV
        yearly_ltv = final_ltv * (12 / avg_lifespan_months) if avg_lifespan_months > 0 else final_ltv * 12
        
        # Прогноз выручки от текущих клиентов
        projected_revenue_active = active_clients * final_ltv
        
        return {
            'success': True,
            
            # Основные метрики LTV
            'ltv': round(final_ltv, 2),
            'simple_ltv': round(simple_ltv, 2),
            'ltv_with_margin': round(ltv_with_margin, 2),
            'predictive_ltv': round(predictive_ltv, 2),
            'cohort_ltv': round(cohort_ltv, 2),
            'yearly_ltv': round(yearly_ltv, 2),
            
            # Базовые метрики
            'total_clients': total_clients,
            'active_clients': active_clients,
            'churned_clients': churned_clients,
            'total_revenue': round(total_revenue, 2),
            'total_cost': round(total_cost, 2),
            'gross_profit': round(gross_profit, 2),
            
            # Средние значения
            'arpu': round(arpu, 2),
            'average_order_value': round(average_order_value, 2),
            'orders_per_client': round(orders_per_client, 2),
            'purchase_frequency_per_month': round(purchase_frequency_per_month, 2),
            
            # Retention & Churn
            'retention_rate': round(retention_rate * 100, 2),
            'churn_rate': round(churn_rate * 100, 2),
            'avg_lifespan_days': round(avg_lifespan_days, 1),
            'avg_lifespan_months': round(avg_lifespan_months, 1),
            
            # Маржинальность
            'gross_margin_percent': round(gross_margin_percent, 2),
            'gross_margin_ratio': round(gross_margin_ratio, 3),
            
            # Прогнозы
            'projected_revenue_active': round(projected_revenue_active, 2),
            
            # Сегментация
            'segments': client_segments,
            
            # Рекомендации
            'recommendations': BusinessModel._get_ltv_recommendations(
                final_ltv, churn_rate, gross_margin_percent, orders_per_client
            ),
            
            # Метаданные
            'calculation_method': 'advanced_multi_method',
            'period_analyzed_months': round(avg_lifespan_months, 1)
        }
    
    @staticmethod
    def _segment_clients(clients_data: Dict, avg_ltv: float) -> Dict[str, Any]:
        """Сегментация клиентов по LTV"""
        segments = {
            'vip': {'count': 0, 'revenue': 0, 'threshold': avg_ltv * 3},
            'high_value': {'count': 0, 'revenue': 0, 'threshold': avg_ltv * 1.5},
            'medium_value': {'count': 0, 'revenue': 0, 'threshold': avg_ltv * 0.7},
            'low_value': {'count': 0, 'revenue': 0, 'threshold': 0}
        }
        
        for client in clients_data.values():
            revenue = client['revenue']
            
            if revenue >= segments['vip']['threshold']:
                segments['vip']['count'] += 1
                segments['vip']['revenue'] += revenue
            elif revenue >= segments['high_value']['threshold']:
                segments['high_value']['count'] += 1
                segments['high_value']['revenue'] += revenue
            elif revenue >= segments['medium_value']['threshold']:
                segments['medium_value']['count'] += 1
                segments['medium_value']['revenue'] += revenue
            else:
                segments['low_value']['count'] += 1
                segments['low_value']['revenue'] += revenue
        
        return {
            'vip': {
                'count': segments['vip']['count'],
                'revenue': round(segments['vip']['revenue'], 2),
                'avg_ltv': round(segments['vip']['revenue'] / segments['vip']['count'], 2) if segments['vip']['count'] > 0 else 0,
                'percent': round(segments['vip']['count'] / len(clients_data) * 100, 1) if clients_data else 0
            },
            'high_value': {
                'count': segments['high_value']['count'],
                'revenue': round(segments['high_value']['revenue'], 2),
                'avg_ltv': round(segments['high_value']['revenue'] / segments['high_value']['count'], 2) if segments['high_value']['count'] > 0 else 0,
                'percent': round(segments['high_value']['count'] / len(clients_data) * 100, 1) if clients_data else 0
            },
            'medium_value': {
                'count': segments['medium_value']['count'],
                'revenue': round(segments['medium_value']['revenue'], 2),
                'avg_ltv': round(segments['medium_value']['revenue'] / segments['medium_value']['count'], 2) if segments['medium_value']['count'] > 0 else 0,
                'percent': round(segments['medium_value']['count'] / len(clients_data) * 100, 1) if clients_data else 0
            },
            'low_value': {
                'count': segments['low_value']['count'],
                'revenue': round(segments['low_value']['revenue'], 2),
                'avg_ltv': round(segments['low_value']['revenue'] / segments['low_value']['count'], 2) if segments['low_value']['count'] > 0 else 0,
                'percent': round(segments['low_value']['count'] / len(clients_data) * 100, 1) if clients_data else 0
            }
        }
    
    @staticmethod
    def _get_ltv_recommendations(
        ltv: float, 
        churn_rate: float, 
        margin: float, 
        orders_per_client: float
    ) -> List[str]:
        """Генерация рекомендаций на основе LTV метрик"""
        recommendations = []
        
        # LTV
        if ltv < 5000:
            recommendations.append(
                f"💡 LTV низкий ({ltv:,.0f}₽). Увеличьте через программу лояльности и повышение среднего чека."
            )
        elif ltv < 15000:
            recommendations.append(
                f"✅ LTV средний ({ltv:,.0f}₽). Фокус на апсейл и кросс-сейл для роста."
            )
        else:
            recommendations.append(
                f"🌟 Отличный LTV ({ltv:,.0f}₽)! Инвестируйте в удержание таких клиентов."
            )
        
        # Churn
        if churn_rate > 0.5:
            recommendations.append(
                f"⚠️ Высокий отток ({churn_rate*100:.1f}%). Срочно внедрите реактивационные кампании."
            )
        elif churn_rate > 0.3:
            recommendations.append(
                f"📊 Средний отток ({churn_rate*100:.1f}%). Улучшите коммуникацию с клиентами."
            )
        
        # Margin
        if margin < 30:
            recommendations.append(
                f"💰 Низкая маржа ({margin:.1f}%). Оптимизируйте затраты или повысьте цены."
            )
        elif margin > 50:
            recommendations.append(
                f"💎 Отличная маржа ({margin:.1f}%)! Можно инвестировать в маркетинг."
            )
        
        # Repeat purchases
        if orders_per_client < 1.5:
            recommendations.append(
                "🔄 Мало повторных покупок. Запустите email-маркетинг и программу лояльности."
            )
        elif orders_per_client > 3:
            recommendations.append(
                "🎯 Высокая лояльность клиентов! Продолжайте текущую стратегию."
            )
        
        return recommendations
    
    @staticmethod
    def calculate_unit_economics(
        ltv: float,
        cac: float,
        gross_margin_percent: float,
        avg_lifespan_months: float
    ) -> Dict[str, Any]:
        """
        Расчет Unit Economics (юнит-экономики)
        
        Ключевые метрики:
        - LTV/CAC Ratio (должен быть > 3)
        - Payback Period (срок окупаемости)
        - Customer Profitability
        """
        
        # LTV/CAC Ratio
        ltv_cac_ratio = ltv / cac if cac > 0 else 0
        
        # Оценка здоровья бизнеса
        if ltv_cac_ratio >= 3:
            health_status = 'excellent'
            health_message = '🌟 Отличная юнит-экономика! Бизнес масштабируемый.'
        elif ltv_cac_ratio >= 2:
            health_status = 'good'
            health_message = '✅ Хорошая юнит-экономика. Можно масштабироваться.'
        elif ltv_cac_ratio >= 1:
            health_status = 'acceptable'
            health_message = '⚠️ Приемлемо, но нужно улучшать LTV или снижать CAC.'
        else:
            health_status = 'poor'
            health_message = '🚨 Плохая юнит-экономика! Бизнес убыточный.'
        
        # Payback Period (срок окупаемости в месяцах)
        # Сколько месяцев нужно, чтобы вернуть CAC
        monthly_profit = (ltv / avg_lifespan_months) if avg_lifespan_months > 0 else ltv
        payback_months = cac / monthly_profit if monthly_profit > 0 else 999
        
        # Customer Profitability (прибыль с клиента)
        customer_profit = ltv - cac
        
        # ROI на клиента
        customer_roi = ((ltv - cac) / cac * 100) if cac > 0 else 0
        
        return {
            'ltv': round(ltv, 2),
            'cac': round(cac, 2),
            'ltv_cac_ratio': round(ltv_cac_ratio, 2),
            'payback_months': round(payback_months, 1),
            'customer_profit': round(customer_profit, 2),
            'customer_roi': round(customer_roi, 1),
            'gross_margin_percent': round(gross_margin_percent, 2),
            'health_status': health_status,
            'health_message': health_message,
            'recommendations': BusinessModel._get_unit_economics_recommendations(
                ltv_cac_ratio, payback_months, customer_profit
            )
        }
    
    @staticmethod
    def _get_unit_economics_recommendations(
        ltv_cac_ratio: float,
        payback_months: float,
        customer_profit: float
    ) -> List[str]:
        """Рекомендации по юнит-экономике"""
        recommendations = []
        
        if ltv_cac_ratio < 3:
            recommendations.append(
                "📈 Увеличьте LTV/CAC ratio до 3+ через: повышение retention, апсейл, снижение CAC"
            )
        
        if payback_months > 12:
            recommendations.append(
                f"⏱️ Срок окупаемости {payback_months:.1f} мес слишком долгий. Цель: < 12 месяцев"
            )
        
        if customer_profit < 0:
            recommendations.append(
                "🚨 КРИТИЧНО: Убыток на клиента! Срочно пересмотрите ценообразование или снизьте CAC"
            )
        elif customer_profit < 5000:
            recommendations.append(
                "💡 Низкая прибыль на клиента. Увеличьте через повышение цен или снижение затрат"
            )
        
        if ltv_cac_ratio >= 3 and payback_months <= 12:
            recommendations.append(
                "🚀 Отличная юнит-экономика! Можно агрессивно масштабировать маркетинг"
            )
        
        return recommendations
    
    @staticmethod
    def calculate_cac(
        marketing_spend: float,
        new_customers: int
    ) -> Dict[str, Any]:
        """
        Расчет CAC (Customer Acquisition Cost)
        CAC = Маркетинговые расходы / Количество новых клиентов
        """
        if new_customers == 0:
            return {
                'success': False,
                'message': 'Нет данных о новых клиентах'
            }
        
        cac = marketing_spend / new_customers
        
        # Бенчмарки по индустриям (средние значения)
        benchmarks = {
            'ecommerce': {'low': 30, 'avg': 70, 'high': 150},
            'saas': {'low': 100, 'avg': 300, 'high': 1000},
            'retail': {'low': 10, 'avg': 30, 'high': 80}
        }
        
        return {
            'success': True,
            'cac': round(cac, 2),
            'marketing_spend': round(marketing_spend, 2),
            'new_customers': new_customers,
            'benchmarks': benchmarks
        }
