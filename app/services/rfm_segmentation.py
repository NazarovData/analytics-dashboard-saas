"""
RFM Segmentation Service
Сегментация клиентов по модели RFM (Recency, Frequency, Monetary)
"""
from typing import Dict, List, Any, Tuple
from datetime import datetime
import pandas as pd


class RFMSegmentation:
    """Сервис RFM сегментации клиентов"""
    
    # Определение сегментов
    SEGMENTS = {
        'champions': {
            'name': '💎 Champions (Чемпионы)',
            'description': 'Лучшие клиенты! Покупают часто, недавно и на большие суммы.',
            'color': '#10B981',
            'action': 'VIP программа, ранний доступ к новинкам, персональный менеджер'
        },
        'loyal': {
            'name': '⭐ Loyal (Лояльные)',
            'description': 'Постоянные клиенты, покупают регулярно.',
            'color': '#3B82F6',
            'action': 'Программа лояльности, бонусы за рекомендации'
        },
        'potential_loyalist': {
            'name': '🌟 Potential Loyalist (Потенциально лояльные)',
            'description': 'Недавние клиенты с хорошим потенциалом.',
            'color': '#8B5CF6',
            'action': 'Персонализированные предложения, welcome серия писем'
        },
        'new_customers': {
            'name': '✨ New Customers (Новые)',
            'description': 'Совершили первую покупку недавно.',
            'color': '#06B6D4',
            'action': 'Welcome бонус, обучение продукту, стимул для второй покупки'
        },
        'promising': {
            'name': '💫 Promising (Перспективные)',
            'description': 'Недавние покупатели, но пока редко покупают.',
            'color': '#14B8A6',
            'action': 'Таргетированные предложения, показать ценность продукта'
        },
        'need_attention': {
            'name': '⚡ Need Attention (Требуют внимания)',
            'description': 'Раньше покупали хорошо, но активность снижается.',
            'color': '#F59E0B',
            'action': 'Реактивационные кампании, специальные предложения'
        },
        'at_risk': {
            'name': '⚠️ At Risk (В зоне риска)',
            'description': 'Давно не покупали, но раньше были хорошими клиентами.',
            'color': '#EF4444',
            'action': 'Агрессивные скидки, win-back кампании, опросы'
        },
        'hibernating': {
            'name': '😴 Hibernating (Спящие)',
            'description': 'Давно не покупали, низкая активность.',
            'color': '#6B7280',
            'action': 'Последняя попытка вернуть: большие скидки, новинки'
        },
        'lost': {
            'name': '❌ Lost (Потерянные)',
            'description': 'Очень давно не покупали, скорее всего ушли.',
            'color': '#1F2937',
            'action': 'Можно забыть или попробовать радикальное предложение'
        }
    }
    
    @staticmethod
    def segment_customers_from_data(data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Сегментация клиентов из загруженных данных
        """
        if not data:
            return {
                'success': False,
                'message': 'Нет данных для сегментации'
            }
        
        try:
            # Преобразуем в DataFrame для удобства
            df = pd.DataFrame(data)
            
            # Проверяем наличие необходимых колонок
            required_columns = ['client_id', 'revenue', 'date']
            if not all(col in df.columns for col in required_columns):
                return {
                    'success': False,
                    'message': f'Необходимы колонки: {required_columns}'
                }
            
            # Преобразуем дату
            df['date'] = pd.to_datetime(df['date'])
            
            # Текущая дата (последняя дата в данных)
            current_date = df['date'].max()
            
            # Рассчитываем RFM метрики для каждого клиента
            # Используем явную функцию вместо lambda для избежания проблем с datetime
            def calc_recency(x):
                return (current_date - x.max()).days
            
            rfm = df.groupby('client_id').agg({
                'date': calc_recency,  # Recency
                'client_id': 'count',  # Frequency
                'revenue': 'sum'  # Monetary
            }).reset_index()
            
            rfm.columns = ['client_id', 'recency', 'frequency', 'monetary']
            
            # Присваиваем RFM scores (1-4, где 4 - лучше)
            rfm['R'] = pd.qcut(rfm['recency'], q=4, labels=[4, 3, 2, 1], duplicates='drop')
            rfm['F'] = pd.qcut(rfm['frequency'].rank(method='first'), q=4, labels=[1, 2, 3, 4], duplicates='drop')
            rfm['M'] = pd.qcut(rfm['monetary'], q=4, labels=[1, 2, 3, 4], duplicates='drop')
            
            # Преобразуем в числа
            rfm['R'] = rfm['R'].astype(int)
            rfm['F'] = rfm['F'].astype(int)
            rfm['M'] = rfm['M'].astype(int)
            
            # Присваиваем сегменты
            rfm['segment'] = rfm.apply(RFMSegmentation._assign_segment, axis=1)
            
            # Подсчитываем статистику по сегментам
            segment_stats = []
            for segment_key, segment_info in RFMSegmentation.SEGMENTS.items():
                segment_df = rfm[rfm['segment'] == segment_key]
                
                if len(segment_df) > 0:
                    segment_stats.append({
                        'segment': segment_key,
                        'name': segment_info['name'],
                        'description': segment_info['description'],
                        'color': segment_info['color'],
                        'action': segment_info['action'],
                        'count': int(len(segment_df)),
                        'total_revenue': float(segment_df['monetary'].sum()),
                        'avg_revenue': float(segment_df['monetary'].mean()),
                        'avg_frequency': float(segment_df['frequency'].mean()),
                        'avg_recency': float(segment_df['recency'].mean())
                    })
            
            # Сортируем по важности
            segment_order = ['champions', 'loyal', 'potential_loyalist', 'new_customers', 
                           'promising', 'need_attention', 'at_risk', 'hibernating', 'lost']
            segment_stats.sort(key=lambda x: segment_order.index(x['segment']) if x['segment'] in segment_order else 999)
            
            # Общая статистика
            total_customers = int(len(rfm))
            total_revenue = float(rfm['monetary'].sum())
            
            # Топ сегмент по выручке
            top_segment = max(segment_stats, key=lambda x: x['total_revenue']) if segment_stats else None
            
            return {
                'success': True,
                'segments': segment_stats,
                'total_customers': total_customers,
                'total_revenue': total_revenue,
                'top_segment': top_segment,
                'summary': RFMSegmentation._generate_summary(segment_stats, total_customers)
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при сегментации: {str(e)}'
            }
    
    @staticmethod
    def _assign_segment(row) -> str:
        """Присваивание сегмента на основе RFM scores"""
        R, F, M = row['R'], row['F'], row['M']
        
        # Champions: высокие значения по всем параметрам
        if R >= 4 and F >= 4 and M >= 4:
            return 'champions'
        
        # Loyal: высокая частота и сумма, но может быть давно
        if F >= 4 and M >= 4:
            return 'loyal'
        
        # Potential Loyalist: недавно, хорошая сумма
        if R >= 3 and M >= 3 and F >= 2:
            return 'potential_loyalist'
        
        # New Customers: недавно, но мало покупок
        if R >= 4 and F <= 2:
            return 'new_customers'
        
        # Promising: недавно, но низкие F и M
        if R >= 3 and F <= 2 and M <= 2:
            return 'promising'
        
        # Need Attention: раньше были хорошие, но давно не покупали
        if R <= 2 and F >= 3 and M >= 3:
            return 'need_attention'
        
        # At Risk: давно не покупали, но были активны
        if R <= 2 and F >= 2 and M >= 2:
            return 'at_risk'
        
        # Hibernating: давно, редко, мало
        if R <= 2 and F <= 2:
            return 'hibernating'
        
        # Lost: все показатели низкие
        if R == 1:
            return 'lost'
        
        # По умолчанию
        return 'promising'
    
    @staticmethod
    def _generate_summary(segments: List[Dict], total_customers: int) -> str:
        """Генерация краткого резюме по сегментам"""
        if not segments:
            return "Нет данных для анализа"
        
        # Находим самый большой сегмент
        largest_segment = max(segments, key=lambda x: x['count'])
        largest_percent = (largest_segment['count'] / total_customers) * 100
        
        # Находим самый доходный сегмент
        richest_segment = max(segments, key=lambda x: x['total_revenue'])
        richest_percent = (richest_segment['total_revenue'] / sum(s['total_revenue'] for s in segments)) * 100
        
        # Champions
        champions = next((s for s in segments if s['segment'] == 'champions'), None)
        
        summary = f"Самый большой сегмент: {largest_segment['name']} ({largest_percent:.0f}% клиентов). "
        summary += f"Наибольшую выручку дает: {richest_segment['name']} ({richest_percent:.0f}% от общей выручки). "
        
        if champions:
            summary += f"У вас {champions['count']} Champions клиентов - берегите их! "
        
        # Проверяем риски
        at_risk = next((s for s in segments if s['segment'] == 'at_risk'), None)
        if at_risk and at_risk['count'] > 0:
            summary += f"ВНИМАНИЕ: {at_risk['count']} клиентов в зоне риска!"
        
        return summary
    
    @staticmethod
    def get_segment_recommendations(segment_key: str) -> Dict[str, Any]:
        """Получить детальные рекомендации для сегмента"""
        if segment_key not in RFMSegmentation.SEGMENTS:
            return {'success': False, 'message': 'Неизвестный сегмент'}
        
        segment = RFMSegmentation.SEGMENTS[segment_key]
        
        # Детальные рекомендации для каждого сегмента
        detailed_recommendations = {
            'champions': [
                '🎁 Предложите эксклюзивные товары',
                '👑 VIP статус и персональный менеджер',
                '💌 Просите отзывы и рекомендации',
                '🎊 Ранний доступ к новинкам и акциям'
            ],
            'loyal': [
                '🎯 Программа лояльности с накопительными бонусами',
                '🎁 Подарки на день рождения',
                '📧 Регулярная коммуникация с персональными предложениями',
                '⭐ Благодарите за лояльность'
            ],
            'potential_loyalist': [
                '💬 Узнайте их предпочтения через опросы',
                '🎯 Персонализированные рекомендации',
                '🎁 Бонус за вторую и третью покупку',
                '📱 Добавьте в рассылку с релевантным контентом'
            ],
            'new_customers': [
                '👋 Welcome серия писем (3-5 писем)',
                '🎓 Обучите как пользоваться продуктом',
                '💰 Скидка 10% на вторую покупку',
                '❓ Спросите про первый опыт'
            ],
            'promising': [
                '🎯 Покажите самые популярные товары',
                '💡 Расскажите о преимуществах',
                '🎁 Специальное предложение для активации',
                '📱 Вовлекайте через контент'
            ],
            'need_attention': [
                '⚡ "Мы скучаем по вам" кампания',
                '💰 Скидка 15-20% для возврата',
                '🎁 Подарок при следующей покупке',
                '📞 Личный звонок или письмо'
            ],
            'at_risk': [
                '🚨 Агрессивная скидка 25-30%',
                '📧 Win-back кампания (3-5 писем)',
                '❓ Опрос: "Почему ушли?"',
                '🎁 Специальное предложение только для них'
            ],
            'hibernating': [
                '💤 Последняя попытка вернуть',
                '🎊 "Мы изменились" кампания с новинками',
                '💰 Максимальная скидка 40-50%',
                '📱 Попробуйте другой канал коммуникации'
            ],
            'lost': [
                '🤷 Можно удалить из активной базы',
                '📊 Используйте для анализа оттока',
                '🎯 Последняя радикальная акция',
                '❌ Не тратьте много ресурсов'
            ]
        }
        
        return {
            'success': True,
            'segment': segment,
            'recommendations': detailed_recommendations.get(segment_key, [])
        }


