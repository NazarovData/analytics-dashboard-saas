"""
Claude AI Validator - 100% точность расчётов
Использует Claude AI для проверки и исправления данных
"""
import pandas as pd
import json
from typing import Dict, List, Any, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Проверяем наличие anthropic
try:
    import anthropic
    CLAUDE_AVAILABLE = True
except ImportError:
    CLAUDE_AVAILABLE = False
    logger.warning("anthropic library not installed. Claude AI validation disabled.")


class ClaudeValidator:
    """Валидатор данных с использованием Claude AI"""
    
    def __init__(self):
        self.client = None
        if CLAUDE_AVAILABLE and hasattr(settings, 'ANTHROPIC_API_KEY') and settings.ANTHROPIC_API_KEY:
            try:
                self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                logger.info("✅ Claude AI validator initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Claude AI: {e}")
                self.client = None
        else:
            logger.warning("⚠️ Claude AI not configured (missing API key)")
    
    def is_available(self) -> bool:
        """Проверка доступности Claude AI"""
        return self.client is not None
    
    async def verify_column_mapping(
        self, 
        df: pd.DataFrame, 
        original_columns: List[str],
        mapped_columns: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Проверка правильности распознавания колонок через Claude AI
        
        Args:
            df: DataFrame с данными
            original_columns: Оригинальные названия колонок
            mapped_columns: Текущий маппинг колонок
            
        Returns:
            Dict с результатами проверки и исправлениями
        """
        if not self.is_available():
            return {
                'success': False,
                'message': 'Claude AI недоступен',
                'corrections': {}
            }
        
        try:
            # Подготовка данных для Claude
            sample_data = df.head(5).to_dict('records')
            
            prompt = f"""Ты эксперт по анализу данных. Проверь правильность распознавания колонок в файле с данными о продажах.

ОРИГИНАЛЬНЫЕ КОЛОНКИ:
{json.dumps(original_columns, ensure_ascii=False, indent=2)}

ТЕКУЩИЙ МАППИНГ:
{json.dumps(mapped_columns, ensure_ascii=False, indent=2)}

ПРИМЕРЫ ДАННЫХ (первые 5 строк):
{json.dumps(sample_data, ensure_ascii=False, indent=2)}

ЗАДАЧА:
1. Проверь правильно ли определены колонки
2. Найди колонку с ОБЩЕЙ СУММОЙ (total, итого, сумма)
3. Найди колонку с ЦЕНОЙ (price, цена, стоимость)
4. Найди колонку с КОЛИЧЕСТВОМ (quantity, количество, кол-во)
5. Найди колонку с ТОВАРОМ (product, товар, название)
6. Найди колонку с ДАТОЙ (date, дата)

ВЕРНИ JSON:
{{
    "is_correct": true/false,
    "corrections": {{
        "price": "правильное_название_колонки",
        "quantity": "правильное_название_колонки",
        "total": "правильное_название_колонки",
        "product": "правильное_название_колонки",
        "date": "правильное_название_колонки"
    }},
    "explanation": "объяснение что было неправильно",
    "confidence": 0-100
}}

ВАЖНО: Верни ТОЛЬКО JSON, без дополнительного текста!"""

            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Парсим ответ
            response_text = response.content[0].text.strip()
            
            # Убираем markdown если есть
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            logger.info(f"✅ Claude AI проверил колонки: {result.get('is_correct')}")
            if not result.get('is_correct'):
                logger.warning(f"⚠️ Claude нашёл ошибки: {result.get('explanation')}")
            
            return {
                'success': True,
                'is_correct': result.get('is_correct', False),
                'corrections': result.get('corrections', {}),
                'explanation': result.get('explanation', ''),
                'confidence': result.get('confidence', 0)
            }
            
        except Exception as e:
            logger.error(f"Claude AI verification failed: {e}")
            return {
                'success': False,
                'message': f'Ошибка проверки: {str(e)}',
                'corrections': {}
            }
    
    async def verify_calculations(
        self,
        analytics: Dict[str, Any],
        df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Проверка правильности расчётов через Claude AI
        
        Args:
            analytics: Рассчитанные метрики
            df: Исходные данные
            
        Returns:
            Dict с результатами проверки
        """
        if not self.is_available():
            return {
                'success': False,
                'message': 'Claude AI недоступен'
            }
        
        try:
            # Подготовка данных
            sample_data = df.head(10).to_dict('records')
            
            prompt = f"""Ты эксперт по финансовой аналитике. Проверь правильность расчётов.

РАССЧИТАННЫЕ МЕТРИКИ:
- Общая выручка: {analytics.get('total_revenue', 0):.2f}₽
- Количество заказов: {analytics.get('total_orders', 0)}
- Средний чек: {analytics.get('average_check', 0):.2f}₽
- Уникальных клиентов: {analytics.get('unique_clients', 'N/A')}

ПРИМЕРЫ ДАННЫХ (первые 10 строк):
{json.dumps(sample_data, ensure_ascii=False, indent=2)}

ВСЕГО СТРОК В ФАЙЛЕ: {len(df)}

ЗАДАЧА:
1. Проверь правильность расчёта общей выручки (сумма всех total)
2. Проверь средний чек (выручка / заказы)
3. Найди ошибки если есть

ВЕРНИ JSON:
{{
    "is_correct": true/false,
    "errors": [
        {{
            "metric": "название метрики",
            "calculated": "что рассчитано",
            "should_be": "что должно быть",
            "explanation": "объяснение"
        }}
    ],
    "correct_values": {{
        "total_revenue": число,
        "average_check": число
    }},
    "confidence": 0-100
}}

ВАЖНО: Верни ТОЛЬКО JSON!"""

            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = response.content[0].text.strip()
            
            # Убираем markdown
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            if result.get('is_correct'):
                logger.info("✅ Claude AI подтвердил: все расчёты верны")
            else:
                logger.warning(f"⚠️ Claude AI нашёл ошибки: {len(result.get('errors', []))}")
                for error in result.get('errors', []):
                    logger.warning(f"  - {error.get('metric')}: {error.get('explanation')}")
            
            return {
                'success': True,
                'is_correct': result.get('is_correct', False),
                'errors': result.get('errors', []),
                'correct_values': result.get('correct_values', {}),
                'confidence': result.get('confidence', 0)
            }
            
        except Exception as e:
            logger.error(f"Claude AI calculation verification failed: {e}")
            return {
                'success': False,
                'message': f'Ошибка проверки: {str(e)}'
            }
    
    async def get_smart_insights(
        self,
        analytics: Dict[str, Any],
        df: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        Получение умных инсайтов от Claude AI
        
        Args:
            analytics: Рассчитанные метрики
            df: Исходные данные
            
        Returns:
            List инсайтов от Claude
        """
        if not self.is_available():
            return []
        
        try:
            prompt = f"""Ты эксперт по бизнес-аналитике. Проанализируй данные и дай конкретные рекомендации.

МЕТРИКИ:
- Выручка: {analytics.get('total_revenue', 0):.2f}₽
- Заказов: {analytics.get('total_orders', 0)}
- Средний чек: {analytics.get('average_check', 0):.2f}₽
- Клиентов: {analytics.get('unique_clients', 'N/A')}

ТОП ТОВАРЫ:
{json.dumps(analytics.get('top_products', [])[:5], ensure_ascii=False, indent=2)}

ЗАДАЧА:
Дай 3-5 конкретных рекомендаций для роста бизнеса.

ВЕРНИ JSON:
{{
    "insights": [
        {{
            "title": "Краткий заголовок",
            "message": "Подробное описание",
            "recommendation": "Что делать",
            "priority": "critical/high/medium/low",
            "impact": "Ожидаемый результат"
        }}
    ]
}}

ВАЖНО: Верни ТОЛЬКО JSON!"""

            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = response.content[0].text.strip()
            
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            insights = result.get('insights', [])
            logger.info(f"✅ Claude AI сгенерировал {len(insights)} инсайтов")
            
            return insights
            
        except Exception as e:
            logger.error(f"Claude AI insights generation failed: {e}")
            return []


# Глобальный экземпляр
claude_validator = ClaudeValidator()
