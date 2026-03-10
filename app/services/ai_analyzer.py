"""
🤖 AI Analyzer Service v2.0
Умный анализ данных с защитой от галлюцинаций

✅ Safe AI Insights - не делает выводов без данных
✅ Confidence Level - показывает уровень уверенности
✅ Data Availability Check - проверяет наличие полей
✅ AI Trust Score - итоговый скоринг качества
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import statistics

from app.services.metrics_contract import (
    ConfidenceLevel, 
    DataAvailabilityChecker,
    MetricsCalculator,
    calculate_ai_trust_score,
    METRICS_CONTRACT
)


class AIAnalyzer:
    """
    🧠 AI Анализатор данных v2.0
    
    Главные принципы:
    1. НЕ делать выводов без достаточных данных
    2. ВСЕГДА показывать уровень уверенности
    3. Использовать БЕЗОПАСНЫЕ формулировки
    4. Явно указывать ДОПУЩЕНИЯ
    """
    
    def __init__(self, available_fields: Dict[str, bool] = None):
        """
        Args:
            available_fields: Словарь с наличием полей в данных
        """
        self.available_fields = available_fields or {}
    
    @staticmethod
    def analyze_data(
        analytics: Dict[str, Any], 
        available_fields: Dict[str, bool] = None
    ) -> List[Dict[str, Any]]:
        """
        Главная функция анализа данных
        
        Args:
            analytics: Рассчитанные метрики
            available_fields: Наличие полей в исходных данных
            
        Returns:
            Список инсайтов с рекомендациями и уровнями уверенности
        """
        analyzer = AIAnalyzer(available_fields)
        insights = []
        
        # 1. Анализ выручки (всегда доступен)
        revenue_insights = analyzer._analyze_revenue_safe(analytics)
        insights.extend(revenue_insights)
        
        # 2. 💰 Анализ прибыли (если доступна)
        profit_insights = analyzer._analyze_profit_safe(analytics)
        insights.extend(profit_insights)
        
        # 3. Анализ среднего чека
        average_check_insights = analyzer._analyze_average_check_safe(analytics)
        insights.extend(average_check_insights)
        
        # 4. Анализ товаров
        product_insights = analyzer._analyze_products_safe(analytics)
        insights.extend(product_insights)
        
        # 5. Анализ клиентов (только если есть client_id!)
        client_insights = analyzer._analyze_clients_safe(analytics)
        insights.extend(client_insights)
        
        # 6. Анализ трендов (только если есть даты)
        trend_insights = analyzer._analyze_trends_safe(analytics)
        insights.extend(trend_insights)
        
        # 7. Аномалии
        anomaly_insights = analyzer._detect_anomalies_safe(analytics)
        insights.extend(anomaly_insights)
        
        # Сортируем по приоритету
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        insights.sort(key=lambda x: priority_order.get(x.get('priority', 'low'), 3))
        
        return insights
    
    # ============================================
    # 💰 SAFE REVENUE ANALYSIS
    # ============================================
    def _analyze_revenue_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасный анализ выручки"""
        insights = []
        total_revenue = analytics.get('total_revenue', 0)
        total_orders = analytics.get('total_orders', 0)
        
        if total_revenue <= 0:
            insights.append({
                'type': 'info',
                'category': 'revenue',
                'title': '📊 Данные о выручке',
                'message': 'В загруженном датасете не обнаружена выручка или она равна нулю.',
                'recommendation': 'Проверьте что в данных есть колонка с ценой или суммой (price, amount, revenue).',
                'priority': 'high',
                'impact': 'neutral',
                'confidence': 'high',
                'data_based': True
            })
            return insights
        
        # Относительные метрики вместо абсолютных порогов
        avg_per_order = total_revenue / max(total_orders, 1)
        
        # Формируем инсайт с фактами
        insights.append({
            'type': 'info',
            'category': 'revenue',
            'title': '💰 Выручка в текущем датасете',
            'message': f'Общая выручка: {total_revenue:,.0f}₽ за {total_orders} транзакций.',
            'recommendation': f'Средняя транзакция: {avg_per_order:,.0f}₽. Для оценки динамики загрузите данные за несколько периодов.',
            'priority': 'low',
            'impact': 'neutral',
            'confidence': 'high',
            'data_based': True,
            'formula': 'SUM(price * quantity)'
        })
        
        return insights
    
    # ============================================
    # 💰 SAFE PROFIT ANALYSIS
    # ============================================
    def _analyze_profit_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасный анализ прибыли"""
        insights = []
        has_profit_data = analytics.get('has_profit_data', False)
        total_profit = analytics.get('total_profit')
        total_cost = analytics.get('total_cost')
        total_revenue = analytics.get('total_revenue', 0)
        margin_percent = analytics.get('margin_percent')
        profitability_percent = analytics.get('profitability_percent')
        
        if not has_profit_data:
            insights.append({
                'type': 'warning',
                'category': 'Прибыль',
                'title': '⚠️ Данные о прибыли недоступны',
                'message': 'В данных отсутствует колонка с себестоимостью (cost, себестоимость, закупка)',
                'recommendation': 'Добавьте колонку с себестоимостью товаров для расчета прибыли и маржинальности',
                'priority': 'high',
                'impact': 'Без данных о прибыли невозможно оценить реальную эффективность бизнеса',
                'data_based': True
            })
            return insights
        
        if total_profit is None:
            return insights
        
        # Анализ общей прибыли
        if total_profit > 0:
            insights.append({
                'type': 'success',
                'category': 'Прибыль',
                'title': f'✅ Общая прибыль: {total_profit:,.0f} ₽',
                'message': f'Прибыль составляет {total_profit:,.0f} ₽ при выручке {total_revenue:,.0f} ₽',
                'recommendation': 'Продолжайте текущую стратегию продаж',
                'priority': 'high',
                'impact': 'Положительная прибыль - бизнес работает эффективно',
                'data_based': True
            })
        elif total_profit < 0:
            insights.append({
                'type': 'alert',
                'category': 'Прибыль',
                'title': f'🚨 Убыток: {abs(total_profit):,.0f} ₽',
                'message': f'Бизнес работает в убыток. Расходы ({total_cost:,.0f} ₽) превышают выручку ({total_revenue:,.0f} ₽)',
                'recommendation': 'Срочно пересмотрите ценообразование или снизьте себестоимость',
                'priority': 'critical',
                'impact': 'Критическая ситуация - бизнес теряет деньги',
                'data_based': True
            })
        else:
            insights.append({
                'type': 'warning',
                'category': 'Прибыль',
                'title': '⚠️ Прибыль равна нулю',
                'message': 'Бизнес работает в ноль - нет прибыли',
                'recommendation': 'Оптимизируйте цены или снизьте расходы',
                'priority': 'high',
                'impact': 'Бизнес не приносит прибыли',
                'data_based': True
            })
        
        # Анализ маржинальности
        if margin_percent is not None:
            if margin_percent > 30:
                insights.append({
                    'type': 'success',
                    'category': 'Маржинальность',
                    'title': f'✅ Высокая маржинальность: {margin_percent:.1f}%',
                    'message': f'Маржинальность {margin_percent:.1f}% - отличный показатель',
                    'recommendation': 'Можно рассмотреть возможность снижения цен для увеличения объема продаж',
                    'priority': 'medium',
                    'impact': 'Высокая маржинальность позволяет гибко управлять ценообразованием',
                    'data_based': True
                })
            elif margin_percent > 15:
                insights.append({
                    'type': 'info',
                    'category': 'Маржинальность',
                    'title': f'📊 Нормальная маржинальность: {margin_percent:.1f}%',
                    'message': f'Маржинальность {margin_percent:.1f}% находится в нормальных пределах',
                    'recommendation': 'Поддерживайте текущий уровень маржинальности',
                    'priority': 'low',
                    'impact': 'Стабильная маржинальность обеспечивает устойчивость бизнеса',
                    'data_based': True
                })
            elif margin_percent > 0:
                insights.append({
                    'type': 'warning',
                    'category': 'Маржинальность',
                    'title': f'⚠️ Низкая маржинальность: {margin_percent:.1f}%',
                    'message': f'Маржинальность {margin_percent:.1f}% слишком низкая - высокий риск',
                    'recommendation': 'Рассмотрите возможность повышения цен или снижения себестоимости',
                    'priority': 'high',
                    'impact': 'Низкая маржинальность делает бизнес уязвимым к колебаниям',
                    'data_based': True
                })
            else:
                insights.append({
                    'type': 'alert',
                    'category': 'Маржинальность',
                    'title': f'🚨 Отрицательная маржинальность: {margin_percent:.1f}%',
                    'message': 'Маржинальность отрицательная - бизнес работает в убыток',
                    'recommendation': 'Срочно пересмотрите ценообразование или снизьте расходы',
                    'priority': 'critical',
                    'impact': 'Критическая ситуация - требуется немедленное вмешательство',
                    'data_based': True
                })
        
        # Анализ рентабельности
        if profitability_percent is not None:
            if profitability_percent > 50:
                insights.append({
                    'type': 'success',
                    'category': 'Рентабельность',
                    'title': f'✅ Отличная рентабельность: {profitability_percent:.1f}%',
                    'message': f'Рентабельность {profitability_percent:.1f}% - бизнес очень эффективен',
                    'recommendation': 'Отличные показатели! Продолжайте в том же духе',
                    'priority': 'low',
                    'impact': 'Высокая рентабельность обеспечивает устойчивый рост',
                    'data_based': True
                })
            elif profitability_percent > 20:
                insights.append({
                    'type': 'info',
                    'category': 'Рентабельность',
                    'title': f'📊 Хорошая рентабельность: {profitability_percent:.1f}%',
                    'message': f'Рентабельность {profitability_percent:.1f}% - хороший показатель',
                    'recommendation': 'Поддерживайте текущий уровень эффективности',
                    'priority': 'low',
                    'impact': 'Хорошая рентабельность обеспечивает стабильность',
                    'data_based': True
                })
            else:
                insights.append({
                    'type': 'warning',
                    'category': 'Рентабельность',
                    'title': f'⚠️ Низкая рентабельность: {profitability_percent:.1f}%',
                    'message': f'Рентабельность {profitability_percent:.1f}% ниже нормы',
                    'recommendation': 'Оптимизируйте бизнес-процессы для повышения рентабельности',
                    'priority': 'medium',
                    'impact': 'Низкая рентабельность ограничивает возможности роста',
                    'data_based': True
                })
        
        # Анализ прибыли по товарам
        top_products = analytics.get('top_products', [])
        if top_products:
            # Убыточные товары теперь показываются в топе по прибыли, но оставляем отдельное уведомление если их много
            unprofitable_products = [p for p in top_products if p.get('profit') is not None and p.get('profit', 0) < 0]
            if unprofitable_products and len(unprofitable_products) > 3:
                # Если убыточных товаров много, показываем отдельное предупреждение
                unprofitable_list = ', '.join([p.get('product', 'Товар') for p in unprofitable_products[:5]])
                insights.append({
                    'type': 'alert',
                    'category': 'Товары',
                    'title': f'🚨 Много убыточных товаров обнаружено',
                    'message': f'Найдено {len(unprofitable_products)} товаров с отрицательной прибылью: {unprofitable_list}',
                    'recommendation': 'Пересмотрите цены на убыточные товары или исключите их из ассортимента',
                    'priority': 'high',
                    'impact': 'Убыточные товары снижают общую прибыльность бизнеса',
                    'data_based': True
                })
            
            # Находим товары с высокой маржинальностью
            high_margin_products = [p for p in top_products if p.get('margin_percent') is not None and p.get('margin_percent', 0) > 40]
            if high_margin_products:
                high_margin_list = ', '.join([f"{p.get('product', 'Товар')} ({p.get('margin_percent', 0):.1f}%)" for p in high_margin_products[:5]])
                insights.append({
                    'type': 'success',
                    'category': 'Товары',
                    'title': f'✅ Товары с высокой маржинальностью',
                    'message': f'Найдено {len(high_margin_products)} товаров с маржинальностью >40%: {high_margin_list}',
                    'recommendation': 'Увеличьте продвижение высокомаржинальных товаров — они приносят больше прибыли на каждый рубль выручки',
                    'priority': 'medium',
                    'impact': 'Фокус на высокомаржинальных товарах увеличит общую прибыль',
                    'data_based': True
                })
            
            # Топ товаров по прибыли (не по выручке!)
            products_with_profit = [p for p in top_products if p.get('profit') is not None]
            if products_with_profit:
                top_by_profit = sorted(products_with_profit, key=lambda x: x.get('profit', 0), reverse=True)[:5]
                
                # Рассчитываем общую прибыль для процентов
                total_profit_sum = sum(p.get('profit', 0) for p in products_with_profit)
                
                # Формируем детальный список
                top_profit_list = []
                for i, p in enumerate(top_by_profit):
                    product_name = p.get('product', 'Товар')
                    profit = p.get('profit', 0)
                    revenue = p.get('revenue', 0)
                    margin = p.get('margin_percent')
                    
                    # Процент от общей прибыли
                    profit_share = (profit / total_profit_sum * 100) if total_profit_sum > 0 else 0
                    
                    item_text = f"{i+1}. **{product_name}**\n"
                    item_text += f"   💰 Прибыль: {profit:,.0f} ₽ ({profit_share:.1f}%)\n"
                    item_text += f"   📊 Выручка: {revenue:,.0f} ₽"
                    
                    if margin is not None:
                        item_text += f" | Маржа: {margin:.1f}%"
                    
                    top_profit_list.append(item_text)
                
                message = f"💰 **Топ-5 товаров по ПРИБЫЛИ:**\n\n" + "\n\n".join(top_profit_list)
                
                # Добавляем информацию об убыточных товарах, если они есть
                unprofitable_products = [p for p in top_products if p.get('profit') is not None and p.get('profit', 0) < 0]
                if unprofitable_products:
                    unprofitable_list = '\n'.join([
                        f"• {p.get('product', 'Товар')} — убыток {abs(p.get('profit', 0)):,.0f} ₽"
                        for p in unprofitable_products[:5]
                    ])
                    message += f"\n\n🚨 **Убыточные товары ({len(unprofitable_products)}):**\n{unprofitable_list}"
                
                insights.append({
                    'type': 'info',
                    'category': 'Товары',
                    'title': f'💰 Топ-5 товаров по прибыли',
                    'message': message,
                    'recommendation': 'Фокусируйтесь на товарах с высокой прибылью, а не только на тех, что дают больше выручки',
                    'priority': 'medium',
                    'impact': 'Оптимизация ассортимента по прибыли увеличит общую рентабельность',
                    'data_based': True
                })
        
        return insights
    
    # ============================================
    # 📈 SAFE AVERAGE CHECK ANALYSIS
    # ============================================
    def _analyze_average_check_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасный анализ среднего чека"""
        insights = []
        avg_check = analytics.get('average_check', 0)
        total_orders = analytics.get('total_orders', 0)
        
        if avg_check <= 0 or total_orders <= 0:
            return insights
        
        # Факт без оценки
        insights.append({
            'type': 'info',
            'category': 'average_check',
            'title': '🧾 Средний чек',
            'message': f'Средний чек: {avg_check:,.0f}₽ (рассчитан на основе {total_orders} транзакций)',
            'recommendation': 'Для оценки "хороший/плохой" нужны данные об отрасли и истории.',
            'priority': 'low',
            'impact': 'neutral',
            'confidence': 'high',
            'data_based': True,
            'formula': 'total_revenue / total_orders'
        })
        
        return insights
    
    # ============================================
    # 📦 SAFE PRODUCTS ANALYSIS
    # ============================================
    def _analyze_products_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасный анализ товаров"""
        insights = []
        top_products = analytics.get('top_products', [])
        total_revenue = analytics.get('total_revenue', 0)
        
        if not top_products:
            # НЕ делаем вывод если нет данных о товарах
            if self.available_fields and not self.available_fields.get('product'):
                insights.append({
                    'type': 'info',
                    'category': 'products',
                    'title': '📦 Данные о товарах',
                    'message': 'В датасете не обнаружена колонка с названием товара.',
                    'recommendation': 'Добавьте колонку "product" или "товар" для анализа ассортимента.',
                    'priority': 'low',
                    'impact': 'neutral',
                    'confidence': 'high',
                    'data_based': False
                })
            return insights
        
        # Топ продукт - ФАКТ
        if top_products:
            top_product = top_products[0]
            product_share = (top_product['revenue'] / total_revenue * 100) if total_revenue > 0 else 0
            
            insights.append({
                'type': 'success',
                'category': 'products',
                'title': f'🏆 Лидер продаж: {top_product["product"]}',
                'message': f'Выручка: {top_product["revenue"]:,.0f}₽ ({product_share:.1f}% от общей), Количество: {top_product.get("quantity", "N/A")} шт',
                'recommendation': 'Убедитесь что товар всегда в наличии.',
                'priority': 'medium',
                'impact': 'positive',
                'confidence': 'high',
                'data_based': True
            })
        
        # Концентрация продаж - с оговоркой
        if len(top_products) >= 3 and total_revenue > 0:
            top_3_revenue = sum(p['revenue'] for p in top_products[:3])
            concentration = (top_3_revenue / total_revenue) * 100
            
            if concentration > 70:
                insights.append({
                    'type': 'warning',
                    'category': 'products',
                    'title': '⚠️ Концентрация продаж',
                    'message': f'ТОП-3 товара дают {concentration:.0f}% выручки в текущем датасете.',
                    'recommendation': '💡 Это может быть риском (зависимость от нескольких товаров) или нормой для вашей отрасли.',
                    'priority': 'medium',
                    'impact': 'risk',
                    'confidence': 'high',
                    'data_based': True,
                    'assumption': 'Оценка риска зависит от специфики бизнеса'
                })
        
        return insights
    
    # ============================================
    # 👥 SAFE CLIENTS ANALYSIS - КРИТИЧНО!
    # ============================================
    def _analyze_clients_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Безопасный анализ клиентов
        
        ⚠️ КРИТИЧНО: НЕ делаем выводы о клиентах без client_id!
        """
        insights = []
        unique_clients = analytics.get('unique_clients')  # Может быть None!
        total_orders = analytics.get('total_orders', 0)
        
        # Проверяем есть ли данные о клиентах
        has_client_id = self.available_fields.get('client_id', False) if self.available_fields else False
        
        if not has_client_id:
            # НЕТ CLIENT_ID - НЕ ДЕЛАЕМ ВЫВОДЫ!
            insights.append({
                'type': 'info',
                'category': 'clients',
                'title': '👥 Данные о клиентах',
                'message': '⚠️ В датасете не обнаружена колонка идентификации клиентов (client_id, customer).',
                'recommendation': 'Для анализа клиентов (LTV, повторные покупки, churn) добавьте колонку с ID клиента.',
                'priority': 'medium',
                'impact': 'neutral',
                'confidence': 'high',
                'data_based': False,
                'unavailable_metrics': ['unique_clients', 'repeat_purchase_rate', 'ltv', 'churn']
            })
            return insights
        
        # Есть client_id - можем анализировать
        if unique_clients is None or unique_clients == 0:
            return insights
        
        # Факт о количестве клиентов
        insights.append({
            'type': 'info',
            'category': 'clients',
            'title': '👥 Уникальные клиенты',
            'message': f'В датасете обнаружено {unique_clients} уникальных клиентов.',
            'recommendation': 'Для оценки "мало/много" нужен контекст: период данных и специфика бизнеса.',
            'priority': 'low',
            'impact': 'neutral',
            'confidence': 'high',
            'data_based': True
        })
        
        # Повторные покупки - только если можно рассчитать
        if total_orders > 0 and unique_clients > 0:
            orders_per_client = total_orders / unique_clients
            
            insights.append({
                'type': 'info',
                'category': 'clients',
                'title': '🔄 Среднее заказов на клиента',
                'message': f'{orders_per_client:.1f} транзакций на клиента в текущем датасете.',
                'recommendation': 'Значение < 1.5 может указывать на низкую повторность, но зависит от периода и отрасли.',
                'priority': 'low',
                'impact': 'neutral',
                'confidence': 'medium',  # Medium - есть допущение!
                'data_based': True,
                'assumption': 'Рассчитано на основе доступного периода данных'
            })
        
        return insights
    
    # ============================================
    # 📈 SAFE TRENDS ANALYSIS
    # ============================================
    def _analyze_trends_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасный анализ трендов"""
        insights = []
        daily_revenue = analytics.get('daily_revenue', [])
        
        # Проверяем наличие дат
        has_dates = self.available_fields.get('date', False) if self.available_fields else False
        
        if not has_dates or len(daily_revenue) < 3:
            if not has_dates:
                insights.append({
                    'type': 'info',
                    'category': 'trends',
                    'title': '📅 Данные о датах',
                    'message': 'В датасете не обнаружена колонка с датой.',
                    'recommendation': 'Для анализа трендов добавьте колонку "date" или "дата".',
                    'priority': 'low',
                    'impact': 'neutral',
                    'confidence': 'high',
                    'data_based': False
                })
            return insights
        
        # Анализ тренда
        revenues = [day['revenue'] for day in daily_revenue if day.get('revenue')]
        
        if len(revenues) >= 5:
            # Есть данные для анализа
            first_half = statistics.mean(revenues[:len(revenues)//2])
            second_half = statistics.mean(revenues[len(revenues)//2:])
            
            if first_half > 0:
                change = ((second_half - first_half) / first_half) * 100
                
                if abs(change) > 20:
                    direction = "рост" if change > 0 else "снижение"
                    insights.append({
                        'type': 'info',
                        'category': 'trends',
                        'title': f'📈 Тренд выручки',
                        'message': f'Наблюдается {direction} на {abs(change):.0f}% (сравнение первой и второй половины периода).',
                        'recommendation': 'Для точного анализа трендов рекомендуем данные минимум за 30 дней.',
                        'priority': 'medium',
                        'impact': 'positive' if change > 0 else 'negative',
                        'confidence': 'medium',
                        'data_based': True,
                        'assumption': f'Анализ на основе {len(daily_revenue)} дней данных'
                    })
        
        return insights
    
    # ============================================
    # 🔍 SAFE ANOMALY DETECTION
    # ============================================
    def _detect_anomalies_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасное обнаружение аномалий"""
        insights = []
        daily_revenue = analytics.get('daily_revenue', [])
        
        if len(daily_revenue) < 5:
            return insights
        
        revenues = [day['revenue'] for day in daily_revenue if day.get('revenue')]
        
        if len(revenues) >= 5:
            try:
                avg_revenue = statistics.mean(revenues)
                std_revenue = statistics.stdev(revenues) if len(revenues) > 1 else 0
                
                # Последнее значение
                last_revenue = revenues[-1]
                last_date = daily_revenue[-1].get('date', 'последний день')
                
                # Проверяем аномалию (более 2 стандартных отклонений)
                if std_revenue > 0 and abs(last_revenue - avg_revenue) > 2 * std_revenue:
                    direction = "выше" if last_revenue > avg_revenue else "ниже"
                    insights.append({
                        'type': 'info',
                        'category': 'anomaly',
                        'title': f'🔍 Необычное значение',
                        'message': f'Выручка {last_date}: {last_revenue:,.0f}₽ — значительно {direction} среднего ({avg_revenue:,.0f}₽).',
                        'recommendation': 'Проверьте причину: акция, технический сбой, внешний фактор.',
                        'priority': 'medium',
                        'impact': 'positive' if last_revenue > avg_revenue else 'negative',
                        'confidence': 'medium',
                        'data_based': True,
                        'assumption': 'Аномалия определена как отклонение более 2σ от среднего'
                    })
            except Exception:
                pass
        
        return insights
    
    @staticmethod
    def get_priority_score(insight: Dict[str, Any]) -> int:
        """Получить числовую оценку приоритета"""
        priority_map = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        }
        return priority_map.get(insight.get('priority', 'low'), 1)


class SafeInsightGenerator:
    """
    🛡️ Генератор безопасных инсайтов
    
    Принципы:
    1. Никогда не утверждать без данных
    2. Всегда указывать источник и уверенность
    3. Использовать осторожные формулировки
    """
    
    SAFE_PHRASES = {
        'observation': [
            'В текущем датасете наблюдается...',
            'На основе загруженных данных...',
            'Анализ показывает...',
        ],
        'caveat': [
            'Для точной оценки требуется...',
            'Результат зависит от...',
            'Рекомендуем проверить...',
        ],
        'missing_data': [
            'Для данного анализа требуется поле...',
            'Метрика недоступна без...',
            'Добавьте данные о...',
        ]
    }
    
    @staticmethod
    def generate_safe_insight(
        category: str,
        fact: str,
        confidence: ConfidenceLevel,
        recommendation: str = None,
        assumption: str = None
    ) -> Dict[str, Any]:
        """
        Генерирует безопасный инсайт
        """
        insight = {
            'type': 'info',
            'category': category,
            'title': f'📊 {category.replace("_", " ").title()}',
            'message': fact,
            'confidence': confidence.value,
            'data_based': confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM],
            'priority': 'low'
        }
        
        if recommendation:
            insight['recommendation'] = recommendation
        
        if assumption:
            insight['assumption'] = assumption
        
        if confidence == ConfidenceLevel.LOW:
            insight['caveat'] = '⚠️ Низкая уверенность — требуется больше данных'
        
        if confidence == ConfidenceLevel.UNAVAILABLE:
            insight['caveat'] = '❌ Недостаточно данных для расчёта'
        
        return insight
    
    # ============================================
    # 📈 SAFE AVERAGE CHECK ANALYSIS
    # ============================================
    def _analyze_average_check_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасный анализ среднего чека"""
        insights = []
        avg_check = analytics.get('average_check', 0)
        total_orders = analytics.get('total_orders', 0)
        
        if avg_check <= 0 or total_orders <= 0:
            return insights
        
        # Факт без оценки
        insights.append({
            'type': 'info',
            'category': 'average_check',
            'title': '🧾 Средний чек',
            'message': f'Средний чек: {avg_check:,.0f}₽ (рассчитан на основе {total_orders} транзакций)',
            'recommendation': 'Для оценки "хороший/плохой" нужны данные об отрасли и истории.',
            'priority': 'low',
            'impact': 'neutral',
            'confidence': 'high',
            'data_based': True,
            'formula': 'total_revenue / total_orders'
        })
        
        return insights
    
    # ============================================
    # 📦 SAFE PRODUCTS ANALYSIS
    # ============================================
    def _analyze_products_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасный анализ товаров"""
        insights = []
        top_products = analytics.get('top_products', [])
        total_revenue = analytics.get('total_revenue', 0)
        
        if not top_products:
            # НЕ делаем вывод если нет данных о товарах
            if self.available_fields and not self.available_fields.get('product'):
                insights.append({
                    'type': 'info',
                    'category': 'products',
                    'title': '📦 Данные о товарах',
                    'message': 'В датасете не обнаружена колонка с названием товара.',
                    'recommendation': 'Добавьте колонку "product" или "товар" для анализа ассортимента.',
                    'priority': 'low',
                    'impact': 'neutral',
                    'confidence': 'high',
                    'data_based': False
                })
            return insights
        
        # Топ продукт - ФАКТ
        if top_products:
            top_product = top_products[0]
            product_share = (top_product['revenue'] / total_revenue * 100) if total_revenue > 0 else 0
            
            insights.append({
                'type': 'success',
                'category': 'products',
                'title': f'🏆 Лидер продаж: {top_product["product"]}',
                'message': f'Выручка: {top_product["revenue"]:,.0f}₽ ({product_share:.1f}% от общей), Количество: {top_product.get("quantity", "N/A")} шт',
                'recommendation': 'Убедитесь что товар всегда в наличии.',
                'priority': 'medium',
                'impact': 'positive',
                'confidence': 'high',
                'data_based': True
            })
        
        # Концентрация продаж - с оговоркой
        if len(top_products) >= 3 and total_revenue > 0:
            top_3_revenue = sum(p['revenue'] for p in top_products[:3])
            concentration = (top_3_revenue / total_revenue) * 100
            
            if concentration > 70:
                insights.append({
                    'type': 'warning',
                    'category': 'products',
                    'title': '⚠️ Концентрация продаж',
                    'message': f'ТОП-3 товара дают {concentration:.0f}% выручки в текущем датасете.',
                    'recommendation': '💡 Это может быть риском (зависимость от нескольких товаров) или нормой для вашей отрасли.',
                    'priority': 'medium',
                    'impact': 'risk',
                    'confidence': 'high',
                    'data_based': True,
                    'assumption': 'Оценка риска зависит от специфики бизнеса'
                })
        
        return insights
    
    # ============================================
    # 👥 SAFE CLIENTS ANALYSIS - КРИТИЧНО!
    # ============================================
    def _analyze_clients_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Безопасный анализ клиентов
        
        ⚠️ КРИТИЧНО: НЕ делаем выводы о клиентах без client_id!
        """
        insights = []
        unique_clients = analytics.get('unique_clients')  # Может быть None!
        total_orders = analytics.get('total_orders', 0)
        
        # Проверяем есть ли данные о клиентах
        has_client_id = self.available_fields.get('client_id', False) if self.available_fields else False
        
        if not has_client_id:
            # НЕТ CLIENT_ID - НЕ ДЕЛАЕМ ВЫВОДЫ!
            insights.append({
                'type': 'info',
                'category': 'clients',
                'title': '👥 Данные о клиентах',
                'message': '⚠️ В датасете не обнаружена колонка идентификации клиентов (client_id, customer).',
                'recommendation': 'Для анализа клиентов (LTV, повторные покупки, churn) добавьте колонку с ID клиента.',
                'priority': 'medium',
                'impact': 'neutral',
                'confidence': 'high',
                'data_based': False,
                'unavailable_metrics': ['unique_clients', 'repeat_purchase_rate', 'ltv', 'churn']
            })
            return insights
        
        # Есть client_id - можем анализировать
        if unique_clients is None or unique_clients == 0:
            return insights
        
        # Факт о количестве клиентов
        insights.append({
            'type': 'info',
            'category': 'clients',
            'title': '👥 Уникальные клиенты',
            'message': f'В датасете обнаружено {unique_clients} уникальных клиентов.',
            'recommendation': 'Для оценки "мало/много" нужен контекст: период данных и специфика бизнеса.',
            'priority': 'low',
            'impact': 'neutral',
            'confidence': 'high',
            'data_based': True
        })
        
        # Повторные покупки - только если можно рассчитать
        if total_orders > 0 and unique_clients > 0:
            orders_per_client = total_orders / unique_clients
            
            insights.append({
                'type': 'info',
                'category': 'clients',
                'title': '🔄 Среднее заказов на клиента',
                'message': f'{orders_per_client:.1f} транзакций на клиента в текущем датасете.',
                'recommendation': 'Значение < 1.5 может указывать на низкую повторность, но зависит от периода и отрасли.',
                'priority': 'low',
                'impact': 'neutral',
                'confidence': 'medium',  # Medium - есть допущение!
                'data_based': True,
                'assumption': 'Рассчитано на основе доступного периода данных'
            })
        
        return insights
    
    # ============================================
    # 📈 SAFE TRENDS ANALYSIS
    # ============================================
    def _analyze_trends_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасный анализ трендов"""
        insights = []
        daily_revenue = analytics.get('daily_revenue', [])
        
        # Проверяем наличие дат
        has_dates = self.available_fields.get('date', False) if self.available_fields else False
        
        if not has_dates or len(daily_revenue) < 3:
            if not has_dates:
                insights.append({
                    'type': 'info',
                    'category': 'trends',
                    'title': '📅 Данные о датах',
                    'message': 'В датасете не обнаружена колонка с датой.',
                    'recommendation': 'Для анализа трендов добавьте колонку "date" или "дата".',
                    'priority': 'low',
                    'impact': 'neutral',
                    'confidence': 'high',
                    'data_based': False
                })
            return insights
        
        # Анализ тренда
        revenues = [day['revenue'] for day in daily_revenue if day.get('revenue')]
        
        if len(revenues) >= 5:
            # Есть данные для анализа
            first_half = statistics.mean(revenues[:len(revenues)//2])
            second_half = statistics.mean(revenues[len(revenues)//2:])
            
            if first_half > 0:
                change = ((second_half - first_half) / first_half) * 100
                
                if abs(change) > 20:
                    direction = "рост" if change > 0 else "снижение"
                    insights.append({
                        'type': 'info',
                        'category': 'trends',
                        'title': f'📈 Тренд выручки',
                        'message': f'Наблюдается {direction} на {abs(change):.0f}% (сравнение первой и второй половины периода).',
                        'recommendation': 'Для точного анализа трендов рекомендуем данные минимум за 30 дней.',
                        'priority': 'medium',
                        'impact': 'positive' if change > 0 else 'negative',
                        'confidence': 'medium',
                        'data_based': True,
                        'assumption': f'Анализ на основе {len(daily_revenue)} дней данных'
                    })
        
        return insights
    
    # ============================================
    # 🔍 SAFE ANOMALY DETECTION
    # ============================================
    def _detect_anomalies_safe(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Безопасное обнаружение аномалий"""
        insights = []
        daily_revenue = analytics.get('daily_revenue', [])
        
        if len(daily_revenue) < 5:
            return insights
        
        revenues = [day['revenue'] for day in daily_revenue if day.get('revenue')]
        
        if len(revenues) >= 5:
            try:
                avg_revenue = statistics.mean(revenues)
                std_revenue = statistics.stdev(revenues) if len(revenues) > 1 else 0
                
                # Последнее значение
                last_revenue = revenues[-1]
                last_date = daily_revenue[-1].get('date', 'последний день')
                
                # Проверяем аномалию (более 2 стандартных отклонений)
                if std_revenue > 0 and abs(last_revenue - avg_revenue) > 2 * std_revenue:
                    direction = "выше" if last_revenue > avg_revenue else "ниже"
                    insights.append({
                        'type': 'info',
                        'category': 'anomaly',
                        'title': f'🔍 Необычное значение',
                        'message': f'Выручка {last_date}: {last_revenue:,.0f}₽ — значительно {direction} среднего ({avg_revenue:,.0f}₽).',
                        'recommendation': 'Проверьте причину: акция, технический сбой, внешний фактор.',
                        'priority': 'medium',
                        'impact': 'positive' if last_revenue > avg_revenue else 'negative',
                        'confidence': 'medium',
                        'data_based': True,
                        'assumption': 'Аномалия определена как отклонение более 2σ от среднего'
                    })
            except Exception:
                pass
        
        return insights
    
    @staticmethod
    def get_priority_score(insight: Dict[str, Any]) -> int:
        """Получить числовую оценку приоритета"""
        priority_map = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        }
        return priority_map.get(insight.get('priority', 'low'), 1)


class SafeInsightGenerator:
    """
    🛡️ Генератор безопасных инсайтов
    
    Принципы:
    1. Никогда не утверждать без данных
    2. Всегда указывать источник и уверенность
    3. Использовать осторожные формулировки
    """
    
    SAFE_PHRASES = {
        'observation': [
            'В текущем датасете наблюдается...',
            'На основе загруженных данных...',
            'Анализ показывает...',
        ],
        'caveat': [
            'Для точной оценки требуется...',
            'Результат зависит от...',
            'Рекомендуем проверить...',
        ],
        'missing_data': [
            'Для данного анализа требуется поле...',
            'Метрика недоступна без...',
            'Добавьте данные о...',
        ]
    }
    
    @staticmethod
    def generate_safe_insight(
        category: str,
        fact: str,
        confidence: ConfidenceLevel,
        recommendation: str = None,
        assumption: str = None
    ) -> Dict[str, Any]:
        """
        Генерирует безопасный инсайт
        """
        insight = {
            'type': 'info',
            'category': category,
            'title': f'📊 {category.replace("_", " ").title()}',
            'message': fact,
            'confidence': confidence.value,
            'data_based': confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM],
            'priority': 'low'
        }
        
        if recommendation:
            insight['recommendation'] = recommendation
        
        if assumption:
            insight['assumption'] = assumption
        
        if confidence == ConfidenceLevel.LOW:
            insight['caveat'] = '⚠️ Низкая уверенность — требуется больше данных'
        
        if confidence == ConfidenceLevel.UNAVAILABLE:
            insight['caveat'] = '❌ Недостаточно данных для расчёта'
        
        return insight
