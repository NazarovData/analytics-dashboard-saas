"""
Notification Service
Система умных уведомлений и алертов для бизнеса
"""
from typing import Dict, List, Any
from datetime import datetime as dt_datetime, timedelta


class NotificationService:
    """Сервис генерации уведомлений и алертов"""
    
    @staticmethod
    def generate_notifications(analytics: Dict[str, Any], ai_insights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Генерация всех уведомлений на основе аналитики и AI инсайтов
        """
        notifications = []
        
        # 1. Уведомления из критических инсайтов
        critical_insights = [i for i in ai_insights if i.get('priority') == 'critical']
        for insight in critical_insights:
            notifications.append({
                'id': f"insight_{insight.get('category', 'unknown')}_{len(notifications)}",
                'type': 'alert',
                'priority': 'critical',
                'title': insight.get('title', 'Критическое уведомление'),
                'message': insight.get('message', ''),
                'action': insight.get('recommendation', ''),
                'category': insight.get('category', 'general'),
                'timestamp': dt_datetime.now().isoformat(),
                'read': False,
                'icon': '🚨'
            })
        
        # 2. Высокоприоритетные инсайты
        high_insights = [i for i in ai_insights if i.get('priority') == 'high']
        for insight in high_insights[:3]:  # Берем только топ-3
            notifications.append({
                'id': f"insight_{insight.get('category', 'unknown')}_{len(notifications)}",
                'type': 'warning',
                'priority': 'high',
                'title': insight.get('title', 'Важное уведомление'),
                'message': insight.get('message', ''),
                'action': insight.get('recommendation', ''),
                'category': insight.get('category', 'general'),
                'timestamp': dt_datetime.now().isoformat(),
                'read': False,
                'icon': '⚡'
            })
        
        # 3. Позитивные уведомления
        positive_insights = [i for i in ai_insights if i.get('impact') == 'positive']
        for insight in positive_insights[:2]:  # Топ-2 позитивных
            notifications.append({
                'id': f"success_{insight.get('category', 'unknown')}_{len(notifications)}",
                'type': 'success',
                'priority': 'low',
                'title': insight.get('title', 'Хорошие новости!'),
                'message': insight.get('message', ''),
                'action': insight.get('recommendation', ''),
                'category': insight.get('category', 'general'),
                'timestamp': dt_datetime.now().isoformat(),
                'read': False,
                'icon': '🎉'
            })
        
        # 4. Уведомления о возможностях
        opportunity_insights = [i for i in ai_insights if i.get('impact') == 'opportunity']
        for insight in opportunity_insights[:2]:
            notifications.append({
                'id': f"opportunity_{insight.get('category', 'unknown')}_{len(notifications)}",
                'type': 'info',
                'priority': 'medium',
                'title': insight.get('title', 'Возможность для роста'),
                'message': insight.get('message', ''),
                'action': insight.get('recommendation', ''),
                'category': insight.get('category', 'general'),
                'timestamp': dt_datetime.now().isoformat(),
                'read': False,
                'icon': '💡'
            })
        
        # 5. Автоматические бизнес-алерты
        business_alerts = NotificationService._generate_business_alerts(analytics)
        notifications.extend(business_alerts)
        
        # Сортируем по приоритету
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        notifications.sort(key=lambda x: priority_order.get(x.get('priority', 'low'), 3))
        
        return notifications
    
    @staticmethod
    def _generate_business_alerts(analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Генерация автоматических бизнес-алертов"""
        alerts = []
        
        total_revenue = analytics.get('total_revenue', 0)
        total_orders = analytics.get('total_orders', 0)
        unique_clients = analytics.get('unique_clients', 0)
        average_check = analytics.get('average_check', 0)
        
        # Алерт: Рекордная выручка
        if total_revenue > 1000000:
            alerts.append({
                'id': f'alert_record_revenue',
                'type': 'success',
                'priority': 'low',
                'title': '🏆 Рекордная выручка!',
                'message': f'Поздравляем! Выручка составила {total_revenue:,.0f}₽',
                'action': 'Проанализируйте что привело к успеху и масштабируйте!',
                'category': 'revenue',
                'timestamp': dt_datetime.now().isoformat(),
                'read': False,
                'icon': '🏆'
            })
        
        # Алерт: Первые 100 заказов
        if 95 <= total_orders <= 105:
            alerts.append({
                'id': f'alert_milestone_100',
                'type': 'success',
                'priority': 'low',
                'title': '🎊 Первые 100 заказов!',
                'message': f'Отличная веха: {total_orders} заказов',
                'action': 'Проведите ретроспективу и поставьте новую цель!',
                'category': 'orders',
                'timestamp': dt_datetime.now().isoformat(),
                'read': False,
                'icon': '🎊'
            })
        
        # Алерт: Мало данных
        if total_orders < 5:
            alerts.append({
                'id': f'alert_low_data',
                'type': 'info',
                'priority': 'low',
                'title': 'ℹ️ Загрузите больше данных',
                'message': f'Всего {total_orders} записей. Для точной аналитики нужно больше данных.',
                'action': 'Загрузите полный файл с историей продаж за месяц или больше.',
                'category': 'data',
                'timestamp': dt_datetime.now().isoformat(),
                'read': False,
                'icon': 'ℹ️'
            })
        
        # Алерт: Высокий средний чек
        if average_check > 10000:
            alerts.append({
                'id': f'alert_high_check',
                'type': 'success',
                'priority': 'low',
                'title': '💎 Премиум клиенты!',
                'message': f'Средний чек {average_check:,.0f}₽ - вы работаете с премиум сегментом',
                'action': 'Внедрите VIP программу и персональный сервис.',
                'category': 'clients',
                'timestamp': dt_datetime.now().isoformat(),
                'read': False,
                'icon': '💎'
            })
        
        # 👥 УВЕДОМЛЕНИЯ О VIP-КЛИЕНТАХ (на основе реальных данных)
        top_clients = analytics.get('top_clients_by_ltv', [])
        if top_clients:
            # Находим клиентов, которые не покупали более 30 дней
            today = dt_datetime.now()
            days_threshold = 30
            
            for client in top_clients[:5]:  # Топ-5 клиентов
                client_name = client.get('client_id', 'Клиент')
                client_ltv = client.get('ltv', 0)
                last_purchase_str = client.get('last_purchase')
                
                if last_purchase_str:
                    try:
                        last_purchase = dt_datetime.strptime(last_purchase_str, '%Y-%m-%d')
                        days_inactive = (today - last_purchase).days
                        
                        # Если клиент не покупал более 30 дней и LTV > 50,000
                        if days_inactive >= days_threshold and client_ltv > 50000:
                            alerts.append({
                                'id': f'alert_inactive_vip_{client_name}',
                                'type': 'warning',
                                'priority': 'high',
                                'title': f'👤 VIP-клиент не покупал {days_inactive} дней',
                                'message': f'{client_name} не совершал покупок более {days_inactive} дней. LTV клиента: {client_ltv:,.0f}₽. Рекомендуем связаться.',
                                'action': f'Отправьте персональное предложение клиенту {client_name}',
                                'category': 'clients',
                                'timestamp': dt_datetime.now().isoformat(),
                                'read': False,
                                'icon': '👤',
                                'data': {
                                    'client_id': client_name,
                                    'client_name': client_name,
                                    'last_purchase': last_purchase_str,
                                    'days_inactive': days_inactive,
                                    'ltv': client_ltv,
                                    'segment': 'VIP' if client_ltv > 100000 else 'Premium'
                                }
                            })
                    except (ValueError, TypeError):
                        # Не удалось распарсить дату - пропускаем
                        pass
        
        return alerts
    
    @staticmethod
    def filter_notifications(
        notifications: List[Dict[str, Any]], 
        priority: str = None,
        category: str = None,
        unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Фильтрация уведомлений"""
        filtered = notifications
        
        if priority:
            filtered = [n for n in filtered if n.get('priority') == priority]
        
        if category:
            filtered = [n for n in filtered if n.get('category') == category]
        
        if unread_only:
            filtered = [n for n in filtered if not n.get('read', False)]
        
        return filtered
    
    @staticmethod
    def mark_as_read(notifications: List[Dict[str, Any]], notification_id: str) -> List[Dict[str, Any]]:
        """Отметить уведомление как прочитанное"""
        for notification in notifications:
            if notification.get('id') == notification_id:
                notification['read'] = True
                notification['read_at'] = dt_datetime.now().isoformat()
        
        return notifications
    
    @staticmethod
    def get_notification_summary(notifications: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Получить сводку по уведомлениям"""
        total = len(notifications)
        unread = len([n for n in notifications if not n.get('read', False)])
        
        by_priority = {
            'critical': len([n for n in notifications if n.get('priority') == 'critical']),
            'high': len([n for n in notifications if n.get('priority') == 'high']),
            'medium': len([n for n in notifications if n.get('priority') == 'medium']),
            'low': len([n for n in notifications if n.get('priority') == 'low'])
        }
        
        by_type = {
            'alert': len([n for n in notifications if n.get('type') == 'alert']),
            'warning': len([n for n in notifications if n.get('type') == 'warning']),
            'info': len([n for n in notifications if n.get('type') == 'info']),
            'success': len([n for n in notifications if n.get('type') == 'success'])
        }
        
        return {
            'total': total,
            'unread': unread,
            'by_priority': by_priority,
            'by_type': by_type,
            'requires_attention': by_priority['critical'] + by_priority['high']
        }






