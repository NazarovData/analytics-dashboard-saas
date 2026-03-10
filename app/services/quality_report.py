"""
Quality Report Generator - Генератор отчетов о качестве данных
Версия: 1.0 согласно ТЗ от 06.02.2026
"""
from typing import Dict, List, Any
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class QualityReportGenerator:
    """
    Генератор детальных отчетов о качестве данных
    """
    
    def generate(
        self,
        original_df: pd.DataFrame,
        cleaned_df: pd.DataFrame,
        processing_report: Dict[str, Any],
        anomaly_report: Dict[str, Any],
        trust_score: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Генерация полного отчета о качестве данных
        
        Returns:
            Структурированный отчет в формате JSON
        """
        logger.info("📊 Генерация отчета о качестве данных")
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': self._generate_summary(processing_report, trust_score),
            'data_statistics': self._generate_statistics(original_df, cleaned_df),
            'problems': self._generate_problems_section(processing_report, anomaly_report),
            'field_analysis': self._generate_field_analysis(original_df, cleaned_df),
            'recommendations': trust_score.get('recommendations', []),
            'trust_score': trust_score
        }
        
        logger.info("✅ Отчет сгенерирован")
        
        return report
    
    def _generate_summary(
        self,
        processing_report: Dict[str, Any],
        trust_score: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Генерация общей статистики"""
        total_rows = processing_report.get('total_rows', 0)
        valid_rows = processing_report.get('valid_rows', 0)
        skipped_rows = processing_report.get('skipped_rows', 0)
        valid_percent = processing_report.get('valid_percent', 0)
        
        return {
            'total_records': total_rows,
            'valid_records': valid_rows,
            'valid_percent': round(valid_percent, 1),
            'problematic_records': skipped_rows,
            'problematic_percent': round((skipped_rows / total_rows * 100) if total_rows > 0 else 0, 1),
            'trust_score': trust_score.get('score', 0),
            'trust_level': trust_score.get('level', 'unknown')
        }
    
    def _generate_statistics(
        self,
        original_df: pd.DataFrame,
        cleaned_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """Генерация статистики по данным"""
        return {
            'original': {
                'rows': len(original_df),
                'columns': len(original_df.columns),
                'null_values': int(original_df.isnull().sum().sum()),
                'null_percent': round((original_df.isnull().sum().sum() / (len(original_df) * len(original_df.columns)) * 100), 1)
            },
            'cleaned': {
                'rows': len(cleaned_df),
                'columns': len(cleaned_df.columns),
                'null_values': int(cleaned_df.isnull().sum().sum()),
                'null_percent': round((cleaned_df.isnull().sum().sum() / (len(cleaned_df) * len(cleaned_df.columns)) * 100), 1)
            },
            'removed_rows': len(original_df) - len(cleaned_df),
            'removed_percent': round(((len(original_df) - len(cleaned_df)) / len(original_df) * 100) if len(original_df) > 0 else 0, 1)
        }
    
    def _generate_problems_section(
        self,
        processing_report: Dict[str, Any],
        anomaly_report: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Генерация раздела с проблемами"""
        errors = processing_report.get('errors', [])
        warnings = processing_report.get('warnings', [])
        anomalies = anomaly_report.get('details', [])
        
        return {
            'critical_errors': {
                'count': len(errors),
                'details': errors[:10]  # Первые 10
            },
            'warnings': {
                'count': len(warnings),
                'details': warnings[:10]
            },
            'anomalies': {
                'count': anomaly_report.get('total_anomalies', 0),
                'by_method': anomaly_report.get('by_method', {}),
                'by_severity': anomaly_report.get('by_severity', {}),
                'details': anomalies[:10]
            }
        }
    
    def _generate_field_analysis(
        self,
        original_df: pd.DataFrame,
        cleaned_df: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """Анализ каждого поля"""
        field_analysis = []
        
        for col in original_df.columns:
            null_count = original_df[col].isnull().sum()
            null_percent = (null_count / len(original_df) * 100) if len(original_df) > 0 else 0
            
            # Определение типа данных
            dtype = str(original_df[col].dtype)
            
            # Уникальные значения
            unique_count = original_df[col].nunique()
            
            # Статус поля
            if null_percent > 50:
                status = 'critical'
            elif null_percent > 20:
                status = 'warning'
            else:
                status = 'good'
            
            field_info = {
                'name': col,
                'type': dtype,
                'null_count': int(null_count),
                'null_percent': round(null_percent, 1),
                'unique_values': int(unique_count),
                'status': status
            }
            
            # Добавление статистики для числовых полей
            if pd.api.types.is_numeric_dtype(original_df[col]):
                field_info['statistics'] = {
                    'min': float(original_df[col].min()) if not original_df[col].isnull().all() else None,
                    'max': float(original_df[col].max()) if not original_df[col].isnull().all() else None,
                    'mean': float(original_df[col].mean()) if not original_df[col].isnull().all() else None,
                    'median': float(original_df[col].median()) if not original_df[col].isnull().all() else None
                }
            
            field_analysis.append(field_info)
        
        return field_analysis
    
    def generate_text_report(self, report: Dict[str, Any]) -> str:
        """Генерация текстового отчета для логов"""
        lines = []
        lines.append("=" * 60)
        lines.append("📊 ОТЧЁТ О КАЧЕСТВЕ ДАННЫХ")
        lines.append("=" * 60)
        lines.append("")
        
        # 1. Общая статистика
        summary = report['summary']
        lines.append("1. ОБЩАЯ СТАТИСТИКА:")
        lines.append(f"   • Всего записей: {summary['total_records']}")
        lines.append(f"   • Валидных записей: {summary['valid_records']} ({summary['valid_percent']}%)")
        lines.append(f"   • Проблемных записей: {summary['problematic_records']} ({summary['problematic_percent']}%)")
        lines.append("")
        
        # 2. Обнаруженные проблемы
        problems = report['problems']
        lines.append("2. ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:")
        
        if problems['critical_errors']['count'] > 0:
            lines.append(f"   ❌ Критические ошибки: {problems['critical_errors']['count']}")
            for error in problems['critical_errors']['details'][:5]:
                lines.append(f"      • {error.get('message', 'Unknown error')}")
        
        if problems['warnings']['count'] > 0:
            lines.append(f"   ⚠️ Предупреждения: {problems['warnings']['count']}")
            for warning in problems['warnings']['details'][:5]:
                lines.append(f"      • {warning.get('message', 'Unknown warning')}")
        
        if problems['anomalies']['count'] > 0:
            lines.append(f"   🚨 Аномалии: {problems['anomalies']['count']}")
            for method, count in problems['anomalies']['by_method'].items():
                lines.append(f"      • {method}: {count}")
        
        lines.append("")
        
        # 3. Статистика по полям
        lines.append("3. СТАТИСТИКА ПО ПОЛЯМ:")
        for field in report['field_analysis'][:10]:  # Первые 10
            status_emoji = {'good': '✅', 'warning': '⚠️', 'critical': '❌'}.get(field['status'], '❓')
            lines.append(f"   {status_emoji} {field['name']}: {field['null_percent']}% пропущено")
        lines.append("")
        
        # 4. Рекомендации
        lines.append("4. РЕКОМЕНДАЦИИ:")
        for rec in report['recommendations']:
            lines.append(f"   {rec}")
        lines.append("")
        
        # 5. Trust Score
        trust = report['trust_score']
        interpretation = trust.get('interpretation', {})
        lines.append(f"5. TRUST SCORE: {trust['score']}% {interpretation.get('emoji', '')}")
        lines.append(f"   • Данные: {trust['components']['data_quality']}%")
        lines.append(f"   • Расчёты: {trust['components']['calculation']}%")
        lines.append(f"   • Инсайты: {trust['components']['insights']}%")
        lines.append("")
        lines.append("=" * 60)
        
        return "\n".join(lines)
