"""
Forecasting Service
Прогнозирование метрик бизнеса на основе исторических данных
"""
from typing import Dict, List, Any
import statistics
from datetime import datetime, timedelta


class Forecaster:
    """Сервис прогнозирования метрик"""
    
    @staticmethod
    def forecast_revenue(daily_revenue: List[Dict[str, Any]], days_ahead: int = 7) -> Dict[str, Any]:
        """
        Прогноз выручки на N дней вперед
        Использует линейную регрессию и экспоненциальное сглаживание
        """
        if len(daily_revenue) < 3:
            return {
                'success': False,
                'message': 'Недостаточно данных для прогноза (минимум 3 дня)'
            }
        
        # Подготовка данных
        revenues = [day['revenue'] for day in daily_revenue]
        dates = [day['date'] for day in daily_revenue]
        
        # Линейная регрессия (простой тренд)
        n = len(revenues)
        x = list(range(n))
        
        # Вычисляем коэффициенты y = ax + b
        x_mean = statistics.mean(x)
        y_mean = statistics.mean(revenues)
        
        numerator = sum((x[i] - x_mean) * (revenues[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            # Нет тренда, используем среднее
            a = 0
            b = y_mean
        else:
            a = numerator / denominator
            b = y_mean - a * x_mean
        
        # Генерируем прогноз
        forecast_data = []
        last_date = dates[-1] if dates else datetime.now().strftime('%Y-%m-%d')
        
        for i in range(1, days_ahead + 1):
            forecast_value = max(0, a * (n + i - 1) + b)  # Не может быть отрицательной
            
            # Вычисляем дату прогноза
            try:
                last_datetime = datetime.strptime(last_date, '%Y-%m-%d')
                forecast_date = last_datetime + timedelta(days=i)
                forecast_date_str = forecast_date.strftime('%Y-%m-%d')
            except:
                forecast_date_str = f"День +{i}"
            
            forecast_data.append({
                'date': forecast_date_str,
                'revenue': float(round(forecast_value, 2)),
                'is_forecast': True
            })
        
        # Вычисляем тренд - сравниваем первую и вторую половину данных
        mid_point = n // 2
        first_half_avg = statistics.mean(revenues[:mid_point]) if mid_point > 0 else 0
        second_half_avg = statistics.mean(revenues[mid_point:]) if mid_point < n else 0
        
        # Процент изменения между половинами
        if first_half_avg > 0:
            change_percent = ((second_half_avg - first_half_avg) / first_half_avg) * 100
        else:
            change_percent = 0
        
        # Определяем тренд на основе реального изменения
        if change_percent > 5:  # Рост больше 5%
            trend = 'growing'
            trend_text = 'Растущий тренд'
            trend_percentage = abs(change_percent)
        elif change_percent < -5:  # Снижение больше 5%
            trend = 'declining'
            trend_text = 'Снижающийся тренд'
            trend_percentage = abs(change_percent)
        else:  # Изменение в пределах ±5%
            trend = 'stable'
            trend_text = 'Стабильный'
            trend_percentage = abs(change_percent)
        
        # Вычисляем доверительный интервал (простой способ)
        if len(revenues) >= 2:
            actual_volatility = statistics.stdev(revenues)
        else:
            actual_volatility = 0
        
        # Прогнозируемая общая выручка
        total_forecast = float(sum(f['revenue'] for f in forecast_data))
        
        # Средняя историческая выручка
        avg_historical = float(statistics.mean(revenues))
        
        return {
            'success': True,
            'forecast': forecast_data,
            'trend': trend,
            'trend_text': trend_text,
            'trend_percentage': float(round(trend_percentage, 1)),
            'total_forecast': float(round(total_forecast, 2)),
            'avg_historical': float(round(avg_historical, 2)),
            'volatility': float(round(actual_volatility, 2)),
            'confidence': 'medium' if len(revenues) >= 7 else 'low',
            'recommendation': Forecaster._get_forecast_recommendation(trend, trend_percentage, forecast_data)
        }
    
    @staticmethod
    def _get_forecast_recommendation(trend: str, trend_percentage: float, forecast_data: List[Dict]) -> str:
        """Генерация рекомендаций на основе прогноза"""
        if trend == 'growing':
            if trend_percentage > 10:
                return f'Отличная динамика! Прогноз показывает рост на {trend_percentage:.1f}% в день. Подготовьте запасы товаров.'
            else:
                return f'Небольшой рост ({trend_percentage:.1f}% в день). Продолжайте текущую стратегию.'
        elif trend == 'declining':
            if trend_percentage > 10:
                return f'ВНИМАНИЕ! Прогноз показывает снижение на {trend_percentage:.1f}% в день. Срочно проанализируйте причины и запустите акции.'
            else:
                return f'Небольшое снижение ({trend_percentage:.1f}% в день). Рассмотрите возможность корректировки стратегии.'
        else:
            return 'Стабильная выручка. Для роста попробуйте новые маркетинговые каналы.'
    
    @staticmethod
    def predict_stock_shortage(top_products: List[Dict[str, Any]], days_ahead: int = 14) -> List[Dict[str, Any]]:
        """
        Прогноз нехватки товара на складе
        """
        predictions = []
        
        for product in top_products:
            product_name = product.get('product', 'Unknown')
            quantity_sold = product.get('quantity', 0)
            
            # Предполагаем среднюю дневную продажу
            avg_daily_sales = quantity_sold / 30  # Предполагаем 30 дней
            
            # Предполагаемые остатки (в реальности это будет из БД)
            # Для демо используем случайное значение относительно продаж
            estimated_stock = quantity_sold * 1.5  # 1.5x от проданного
            
            if avg_daily_sales > 0:
                days_until_shortage = estimated_stock / avg_daily_sales
                
                if days_until_shortage < days_ahead:
                    urgency = 'critical' if days_until_shortage < 7 else 'warning'
                    
                    predictions.append({
                        'product': product_name,
                        'days_until_shortage': float(round(days_until_shortage, 1)),
                        'avg_daily_sales': float(round(avg_daily_sales, 1)),
                        'estimated_stock': float(round(estimated_stock, 1)),
                        'urgency': urgency,
                        'recommendation': f'Закажите товар в течение {int(days_until_shortage)} дней!'
                    })
        
        return predictions
    
    @staticmethod
    def predict_customer_churn(analytics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Прогноз оттока клиентов (churn prediction)
        """
        unique_clients = analytics.get('unique_clients')
        total_orders = analytics.get('total_orders', 0)
        
        # ⚠️ КРИТИЧНО: unique_clients может быть None если нет client_id в данных!
        if not unique_clients or unique_clients == 0 or total_orders == 0:
            return {
                'success': False,
                'message': 'Недостаточно данных о клиентах'
            }
        
        # Расчет retention rate (упрощенный)
        orders_per_client = total_orders / unique_clients
        
        # Простая модель: если orders_per_client близко к 1, высокий churn
        if orders_per_client < 1.2:
            churn_risk = 'high'
            churn_percentage = 70
            recommendation = 'Высокий риск оттока! Внедрите программу лояльности и реактивационные кампании.'
        elif orders_per_client < 2:
            churn_risk = 'medium'
            churn_percentage = 40
            recommendation = 'Средний риск оттока. Увеличьте коммуникацию с клиентами через email и персональные предложения.'
        else:
            churn_risk = 'low'
            churn_percentage = 20
            recommendation = 'Низкий риск оттока! Ваши клиенты лояльны. Продолжайте предоставлять отличный сервис.'
        
        return {
            'success': True,
            'churn_risk': churn_risk,
            'churn_percentage': int(churn_percentage),
            'orders_per_client': float(round(orders_per_client, 2)),
            'recommendation': recommendation,
            'estimated_churned_clients': int(round(unique_clients * (churn_percentage / 100)))
        }
    
    @staticmethod
    def calculate_ltv(analytics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Расчет Lifetime Value (LTV) клиента
        """
        unique_clients = analytics.get('unique_clients')
        total_revenue = analytics.get('total_revenue', 0)
        total_orders = analytics.get('total_orders', 0)
        
        # ⚠️ КРИТИЧНО: unique_clients может быть None если нет client_id в данных!
        if not unique_clients or unique_clients == 0:
            return {
                'success': False,
                'message': 'Нет данных о клиентах'
            }
        
        # Средняя выручка на клиента
        avg_revenue_per_client = total_revenue / unique_clients
        
        # Средний чек
        avg_check = total_revenue / total_orders if total_orders > 0 else 0
        
        # Количество покупок на клиента
        orders_per_client = total_orders / unique_clients
        
        # Простой LTV (в реальности учитывается retention, период и т.д.)
        ltv = avg_revenue_per_client
        
        # Прогноз годового LTV (экстраполяция)
        # Предполагаем что данные за месяц
        yearly_ltv = ltv * 12
        
        return {
            'success': True,
            'ltv': float(round(ltv, 2)),
            'yearly_ltv': float(round(yearly_ltv, 2)),
            'avg_check': float(round(avg_check, 2)),
            'orders_per_client': float(round(orders_per_client, 2)),
            'recommendation': Forecaster._get_ltv_recommendation(ltv, avg_check)
        }
    
    @staticmethod
    def _get_ltv_recommendation(ltv: float, avg_check: float) -> str:
        """Рекомендации на основе LTV"""
        if ltv > 10000:
            return f'Высокий LTV ({ltv:,.0f}₽)! Фокусируйтесь на удержании таких клиентов. Они очень ценны.'
        elif ltv > 5000:
            return f'Хороший LTV ({ltv:,.0f}₽). Попробуйте увеличить через апсейл и кросс-сейл.'
        else:
            return f'LTV {ltv:,.0f}₽ можно увеличить через программу лояльности и повышение среднего чека.'


