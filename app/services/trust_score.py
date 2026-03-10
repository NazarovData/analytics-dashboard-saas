"""
Trust Score Calculator - Система расчета достоверности данных
Версия: 1.0 согласно ТЗ от 06.02.2026
"""
from typing import Dict, List, Any
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class TrustScoreCalculator:
    """
    Калькулятор Trust Score - показателя достоверности анализа
    
    Trust Score = Base Score × Quality Multiplier × Completeness Multiplier
    """
    
    BASE_SCORE = 100
    
    # Веса штрафов
    ERROR_PENALTY = 0.05
    ANOMALY_PENALTY = 0.03
    WARNING_PENALTY = 0.02
    
    # Компоненты Trust Score
    DATA_QUALITY_WEIGHT = 0.40  # 40%
    CALCULATION_WEIGHT = 0.30   # 30%
    INSIGHTS_WEIGHT = 0.30      # 30%
    
    def __init__(self):
        self.components = {
            'data_quality': 0,
            'calculation': 0,
            'insights': 0
        }
        
    def calculate(
        self,
        df: pd.DataFrame,
        errors: List[Dict],
        warnings: List[Dict],
        anomalies: List[Dict],
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Расчет Trust Score
        
        Returns:
            {
                'score': 0-100,
                'level': 'low'|'medium'|'good'|'high',
                'components': {...},
                'recommendations': [...]
            }
        """
        logger.info("🎯 Расчет Trust Score")
        
        # Компонент 1: Качество данных (40%)
        data_quality_score = self._calculate_data_quality(df, errors, warnings, anomalies)
        
        # Компонент 2: Качество расчетов (30%)
        calculation_score = self._calculate_calculation_quality(metrics, errors)
        
        # Компонент 3: Качество инсайтов (30%)
        insights_score = self._calculate_insights_quality(df, metrics)
        
        # Итоговый Trust Score
        total_score = (
            data_quality_score * self.DATA_QUALITY_WEIGHT +
            calculation_score * self.CALCULATION_WEIGHT +
            insights_score * self.INSIGHTS_WEIGHT
        )
        
        # Ограничение 0-100
        total_score = max(0, min(100, total_score))
        
        self.components = {
            'data_quality': round(data_quality_score, 1),
            'calculation': round(calculation_score, 1),
            'insights': round(insights_score, 1)
        }
        
        # Определение уровня
        level = self._get_trust_level(total_score)
        
        # Генерация рекомендаций
        recommendations = self._generate_recommendations(
            total_score, data_quality_score, calculation_score, insights_score,
            errors, warnings, anomalies
        )
        
        result = {
            'score': round(total_score, 1),
            'level': level,
            'components': self.components,
            'recommendations': recommendations,
            'interpretation': self._get_interpretation(level)
        }
        
        logger.info(f"✅ Trust Score: {result['score']}% ({level})")
        
        return result
    
    def _calculate_data_quality(
        self,
        df: pd.DataFrame,
        errors: List[Dict],
        warnings: List[Dict],
        anomalies: List[Dict]
    ) -> float:
        """Расчет качества данных (40%)"""
        base_score = self.BASE_SCORE
        
        # Штраф за ошибки
        error_count = len(errors)
        base_score -= error_count * self.ERROR_PENALTY * 100
        
        # Штраф за предупреждения
        warning_count = len(warnings)
        base_score -= warning_count * self.WARNING_PENALTY * 100
        
        # УСИЛЕННЫЙ штраф за аномалии (КРИТИЧНО!)
        anomaly_count = sum(a.get('count', 0) for a in anomalies)
        # Каждая аномалия снижает score на 2 пункта (было 0.3)
        base_score -= anomaly_count * 2.0
        
        # Дополнительный штраф за высокий процент аномалий
        if len(df) > 0:
            anomaly_percent = (anomaly_count / len(df)) * 100
            if anomaly_percent > 50:
                base_score -= 30  # Критический штраф
            elif anomaly_percent > 20:
                base_score -= 20
            elif anomaly_percent > 10:
                base_score -= 10
        
        # Полнота данных
        null_percent = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        completeness_multiplier = 1 - (null_percent / 100)
        
        score = base_score * completeness_multiplier
        
        return max(0, min(100, score))
    
    def _calculate_calculation_quality(
        self,
        metrics: Dict[str, Any],
        errors: List[Dict]
    ) -> float:
        """Расчет качества расчетов (30%)"""
        score = self.BASE_SCORE
        
        # Проверка на division by zero
        if metrics.get('total_orders', 0) == 0:
            score -= 30
        
        # Проверка на отрицательную прибыль (это нормально, не штраф)
        # Но если маржа < -100% - это ошибка
        margin = metrics.get('margin_percent')
        if margin is not None and (margin < -100 or margin > 100):
            score -= 40
        
        # Проверка на адекватность метрик
        total_revenue = metrics.get('total_revenue', 0)
        total_cost = metrics.get('total_cost', 0)
        
        if total_cost > 0 and total_revenue > 0:
            cost_to_revenue = total_cost / total_revenue
            if cost_to_revenue > 10:  # Себестоимость в 10x раз больше выручки
                score -= 50
        
        # Штраф за ошибки в расчетах
        calculation_errors = [e for e in errors if e.get('type') == 'calculation']
        score -= len(calculation_errors) * 20
        
        return max(0, min(100, score))
    
    def _calculate_insights_quality(
        self,
        df: pd.DataFrame,
        metrics: Dict[str, Any]
    ) -> float:
        """Расчет качества инсайтов (30%)"""
        score = self.BASE_SCORE
        
        # Достаточность данных для анализа
        row_count = len(df)
        
        if row_count < 10:
            score -= 50  # Очень мало данных
        elif row_count < 30:
            score -= 30  # Мало данных
        elif row_count < 100:
            score -= 10  # Приемлемо
        
        # Наличие ключевых метрик
        required_metrics = ['total_revenue', 'total_orders', 'average_check']
        missing_metrics = [m for m in required_metrics if metrics.get(m) is None]
        score -= len(missing_metrics) * 15
        
        # Наличие данных о клиентах
        if metrics.get('unique_customers') is None or metrics.get('unique_customers') == 0:
            score -= 20
        
        # Наличие временных данных для трендов
        date_columns = [col for col in df.columns if 'date' in col.lower() or 'дата' in col.lower()]
        if not date_columns:
            score -= 15
        
        return max(0, min(100, score))
    
    def _get_trust_level(self, score: float) -> str:
        """Определение уровня достоверности"""
        if score >= 90:
            return 'high'
        elif score >= 70:
            return 'good'
        elif score >= 50:
            return 'medium'
        else:
            return 'low'
    
    def _get_interpretation(self, level: str) -> Dict[str, str]:
        """Интерпретация уровня достоверности"""
        interpretations = {
            'high': {
                'emoji': '✅',
                'title': 'Высокая достоверность',
                'description': 'Данные подходят для принятия бизнес-решений',
                'color': 'green'
            },
            'good': {
                'emoji': '🟡',
                'title': 'Хорошая достоверность',
                'description': 'Обратите внимание на предупреждения',
                'color': 'yellow'
            },
            'medium': {
                'emoji': '🟠',
                'title': 'Средняя достоверность',
                'description': 'Рекомендуется проверка данных',
                'color': 'orange'
            },
            'low': {
                'emoji': '🔴',
                'title': 'Низкая достоверность',
                'description': 'Критические проблемы с данными',
                'color': 'red'
            }
        }
        
        return interpretations.get(level, interpretations['low'])
    
    def _generate_recommendations(
        self,
        total_score: float,
        data_quality: float,
        calculation: float,
        insights: float,
        errors: List[Dict],
        warnings: List[Dict],
        anomalies: List[Dict]
    ) -> List[str]:
        """Генерация рекомендаций по улучшению"""
        recommendations = []
        
        # Рекомендации по качеству данных
        if data_quality < 70:
            if errors:
                recommendations.append(f"✅ Исправьте {len(errors)} критических ошибок в данных")
            if warnings:
                recommendations.append(f"⚠️ Обратите внимание на {len(warnings)} предупреждений")
            if anomalies:
                anomaly_count = sum(a.get('count', 0) for a in anomalies)
                recommendations.append(f"🔍 Проверьте {anomaly_count} аномальных значений")
        
        # Рекомендации по расчетам
        if calculation < 70:
            recommendations.append("📊 Проверьте корректность входных данных для расчетов")
            recommendations.append("💡 Убедитесь, что все обязательные поля заполнены")
        
        # Рекомендации по инсайтам
        if insights < 70:
            recommendations.append("📈 Добавьте больше данных для более точного анализа")
            recommendations.append("🎯 Рекомендуется минимум 30 записей для достоверных выводов")
        
        # Общие рекомендации
        if total_score < 50:
            recommendations.append("🚨 КРИТИЧНО: Данные требуют серьезной проверки перед использованием")
            recommendations.append("📝 Добавьте валидацию на стороне ввода данных")
        
        if not recommendations:
            recommendations.append("✅ Данные в отличном состоянии!")
        
        return recommendations
