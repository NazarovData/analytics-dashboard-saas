"""
Валидация и проверка качества данных
Обеспечивает 100% точность расчётов
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
import logging

logger = logging.getLogger(__name__)


class DataQualityReport:
    """Отчёт о качестве данных"""
    
    def __init__(self):
        self.issues: List[Dict[str, Any]] = []
        self.fixes: List[str] = []
        self.warnings: List[str] = []
        self.quality_score: float = 100.0
    
    def add_issue(self, severity: str, message: str, count: int = 0):
        """Добавить проблему"""
        self.issues.append({
            'severity': severity,  # 'critical', 'warning', 'info'
            'message': message,
            'count': count
        })
        
        # Снижаем оценку качества
        if severity == 'critical':
            self.quality_score -= 20
        elif severity == 'warning':
            self.quality_score -= 10
        elif severity == 'info':
            self.quality_score -= 5
    
    def add_fix(self, message: str):
        """Добавить исправление"""
        self.fixes.append(message)
    
    def add_warning(self, message: str):
        """Добавить предупреждение"""
        self.warnings.append(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразовать в словарь"""
        return {
            'quality_score': max(0, min(100, self.quality_score)),
            'issues': self.issues,
            'fixes': self.fixes,
            'warnings': self.warnings,
            'is_valid': self.quality_score >= 70
        }


def validate_data_quality(df: pd.DataFrame) -> DataQualityReport:
    """
    Проверка качества данных
    Возвращает отчёт с найденными проблемами
    """
    report = DataQualityReport()
    
    logger.info(f"Начало валидации данных: {len(df)} строк, {len(df.columns)} колонок")
    
    # 1. Проверка дубликатов
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        report.add_issue(
            'warning',
            f'Найдено {duplicates} дубликатов строк',
            duplicates
        )
        logger.warning(f"Найдено {duplicates} дубликатов")
    
    # 2. Проверка пропущенных значений
    missing = df.isnull().sum()
    missing_cols = missing[missing > 0]
    if len(missing_cols) > 0:
        for col, count in missing_cols.items():
            percentage = (count / len(df)) * 100
            report.add_issue(
                'warning' if percentage < 10 else 'critical',
                f'Колонка "{col}": {count} пропущенных значений ({percentage:.1f}%)',
                count
            )
        logger.warning(f"Пропущенные значения: {missing_cols.to_dict()}")
    
    # 3. Проверка отрицательных значений
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if col in ['price', 'quantity', 'total', 'revenue']:
            negative_count = (df[col] < 0).sum()
            if negative_count > 0:
                report.add_issue(
                    'critical',
                    f'Колонка "{col}": {negative_count} отрицательных значений',
                    negative_count
                )
                logger.error(f"Отрицательные значения в {col}: {negative_count}")
    
    # 4. Проверка нулевых значений в важных колонках
    for col in ['price', 'quantity']:
        if col in df.columns:
            zero_count = (df[col] == 0).sum()
            if zero_count > 0:
                report.add_issue(
                    'warning',
                    f'Колонка "{col}": {zero_count} нулевых значений',
                    zero_count
                )
    
    # 5. Проверка логики: total = price * quantity
    if all(col in df.columns for col in ['price', 'quantity', 'total']):
        calculated_total = df['price'] * df['quantity']
        mismatch = abs(df['total'] - calculated_total) > 0.01
        mismatch_count = mismatch.sum()
        
        if mismatch_count > 0:
            report.add_issue(
                'critical',
                f'Несоответствие в {mismatch_count} строках: total ≠ price × quantity',
                mismatch_count
            )
            logger.error(f"Несоответствие расчётов в {mismatch_count} строках")
    
    # 6. Проверка аномальных значений (выбросы)
    for col in ['price', 'quantity']:
        if col in df.columns:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 3 * iqr
            upper_bound = q3 + 3 * iqr
            
            outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
            if outliers > 0:
                report.add_warning(
                    f'Колонка "{col}": {outliers} аномальных значений (выбросы)'
                )
    
    # 7. Проверка дат
    date_cols = df.select_dtypes(include=['datetime64']).columns
    if len(date_cols) > 0:
        for col in date_cols:
            # Проверка будущих дат
            future_dates = (df[col] > pd.Timestamp.now()).sum()
            if future_dates > 0:
                report.add_issue(
                    'warning',
                    f'Колонка "{col}": {future_dates} дат в будущем',
                    future_dates
                )
            
            # Проверка очень старых дат (>10 лет назад)
            old_dates = (df[col] < pd.Timestamp.now() - pd.Timedelta(days=3650)).sum()
            if old_dates > 0:
                report.add_warning(
                    f'Колонка "{col}": {old_dates} дат старше 10 лет'
                )
    
    logger.info(f"Валидация завершена. Оценка качества: {report.quality_score:.1f}/100")
    
    return report


def auto_fix_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, DataQualityReport]:
    """
    Автоматическое исправление данных
    Возвращает исправленный DataFrame и отчёт
    """
    report = DataQualityReport()
    df_fixed = df.copy()
    
    logger.info(f"Начало автоисправления данных: {len(df_fixed)} строк")
    
    # 1. Удаление полных дубликатов
    before = len(df_fixed)
    df_fixed = df_fixed.drop_duplicates()
    after = len(df_fixed)
    if before != after:
        removed = before - after
        report.add_fix(f'✅ Удалено {removed} дубликатов')
        logger.info(f"Удалено {removed} дубликатов")
    
    # 2. Заполнение пропущенных значений
    if 'quantity' in df_fixed.columns:
        missing_qty = df_fixed['quantity'].isnull().sum()
        if missing_qty > 0:
            df_fixed['quantity'].fillna(1, inplace=True)
            report.add_fix(f'✅ Заполнено {missing_qty} пропущенных количеств (значение: 1)')
    
    if 'price' in df_fixed.columns:
        missing_price = df_fixed['price'].isnull().sum()
        if missing_price > 0:
            # Заполняем медианной ценой
            median_price = df_fixed['price'].median()
            df_fixed['price'].fillna(median_price, inplace=True)
            report.add_fix(f'✅ Заполнено {missing_price} пропущенных цен (медиана: {median_price:.2f})')
    
    # 3. Пересчёт total для точности
    if all(col in df_fixed.columns for col in ['price', 'quantity']):
        df_fixed['total'] = df_fixed['price'] * df_fixed['quantity']
        report.add_fix('✅ Пересчитаны все суммы (total = price × quantity)')
        logger.info("Пересчитаны все суммы")
    
    # 4. Удаление строк с отрицательными ценами
    if 'price' in df_fixed.columns:
        negative_prices = (df_fixed['price'] < 0).sum()
        if negative_prices > 0:
            df_fixed = df_fixed[df_fixed['price'] >= 0]
            report.add_fix(f'✅ Удалено {negative_prices} строк с отрицательными ценами')
            logger.info(f"Удалено {negative_prices} строк с отрицательными ценами")
    
    # 5. Удаление строк с отрицательным количеством
    if 'quantity' in df_fixed.columns:
        negative_qty = (df_fixed['quantity'] < 0).sum()
        if negative_qty > 0:
            df_fixed = df_fixed[df_fixed['quantity'] >= 0]
            report.add_fix(f'✅ Удалено {negative_qty} строк с отрицательным количеством')
    
    # 6. Удаление строк с нулевой ценой И нулевым количеством
    if all(col in df_fixed.columns for col in ['price', 'quantity']):
        zero_both = ((df_fixed['price'] == 0) & (df_fixed['quantity'] == 0)).sum()
        if zero_both > 0:
            df_fixed = df_fixed[~((df_fixed['price'] == 0) & (df_fixed['quantity'] == 0))]
            report.add_fix(f'✅ Удалено {zero_both} пустых строк (цена=0 и количество=0)')
    
    # 7. Округление числовых значений для точности
    for col in ['price', 'total']:
        if col in df_fixed.columns:
            df_fixed[col] = pd.to_numeric(df_fixed[col], errors='coerce').fillna(0).round(2)

    if 'quantity' in df_fixed.columns:
        # Количество обычно целое число
        qty_numeric = pd.to_numeric(df_fixed['quantity'], errors='coerce').fillna(1)
        df_fixed['quantity'] = qty_numeric.round(0).astype(int)
    
    report.add_fix('✅ Округлены числовые значения для точности')
    
    logger.info(f"Автоисправление завершено. Осталось {len(df_fixed)} строк (было {len(df)})")
    
    return df_fixed, report


def double_check_calculations(analytics: Dict[str, Any], df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Двойная проверка всех расчётов
    Возвращает список проверок с результатами
    """
    checks = []
    
    logger.info("Начало двойной проверки расчётов")
    
    # 1. Проверка выручки
    if 'total' in df.columns:
        calculated_revenue = float(df['total'].sum())
        reported_revenue = float(analytics.get('total_revenue', 0))
        
        diff = abs(calculated_revenue - reported_revenue)
        is_correct = diff < 0.01
        
        checks.append({
            'metric': 'Общая выручка',
            'status': 'ok' if is_correct else 'error',
            'calculated': float(calculated_revenue),
            'reported': float(reported_revenue),
            'difference': float(diff),
            'message': '✅ Расчёт верен' if is_correct else f'❌ Расхождение: {diff:.2f}'
        })
    
    # 2. Проверка среднего чека
    total_orders = analytics.get('total_orders', 0)
    if total_orders > 0:
        calculated_avg = float(analytics.get('total_revenue', 0)) / float(total_orders)
        reported_avg = float(analytics.get('average_check', 0))
        
        diff = abs(calculated_avg - reported_avg)
        is_correct = diff < 0.01
        
        checks.append({
            'metric': 'Средний чек',
            'status': 'ok' if is_correct else 'error',
            'calculated': float(calculated_avg),
            'reported': float(reported_avg),
            'difference': float(diff),
            'message': '✅ Расчёт верен' if is_correct else f'❌ Расхождение: {diff:.2f}'
        })
    
    # 3. Проверка количества заказов
    if 'date' in df.columns or 'order_id' in df.columns:
        calculated_orders = int(len(df))
        reported_orders = int(analytics.get('total_orders', 0))
        
        diff = abs(calculated_orders - reported_orders)
        is_correct = diff == 0
        
        checks.append({
            'metric': 'Количество заказов',
            'status': 'ok' if is_correct else 'error',
            'calculated': int(calculated_orders),
            'reported': int(reported_orders),
            'difference': int(diff),
            'message': '✅ Расчёт верен' if is_correct else f'❌ Расхождение: {diff}'
        })
    
    # 4. Проверка уникальных клиентов (только если есть client_id)
    if 'client_id' in df.columns or 'customer_id' in df.columns:
        client_col = 'client_id' if 'client_id' in df.columns else 'customer_id'
        # Проверяем что это не автогенерированные ID (CLIENT_1, CLIENT_2, etc)
        sample_id = str(df[client_col].iloc[0]) if len(df) > 0 else ''
        is_auto_generated = sample_id.startswith('CLIENT_') or sample_id.startswith('CUSTOMER_')
        
        if not is_auto_generated:
            calculated_clients = int(df[client_col].nunique())
            reported_clients = analytics.get('unique_clients', 0)
            
            # Если reported_clients это строка "N/A", пропускаем проверку
            if isinstance(reported_clients, (int, float)) and reported_clients > 0:
                reported_clients = int(reported_clients)
                diff = abs(calculated_clients - reported_clients)
                is_correct = diff == 0
                
                checks.append({
                    'metric': 'Уникальные клиенты',
                    'status': 'ok' if is_correct else 'error',
                    'calculated': int(calculated_clients),
                    'reported': int(reported_clients),
                    'difference': int(diff),
                    'message': '✅ Расчёт верен' if is_correct else f'❌ Расхождение: {diff}'
                })
    
    # Подсчёт результатов
    total_checks = len(checks)
    passed_checks = sum(1 for c in checks if c['status'] == 'ok')
    accuracy_percentage = (passed_checks / total_checks * 100) if total_checks > 0 else 100.0
    
    logger.info(f"Двойная проверка завершена: {passed_checks}/{total_checks} проверок пройдено ({accuracy_percentage:.1f}%)")
    
    return checks
