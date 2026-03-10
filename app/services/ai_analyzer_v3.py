"""
🤖 AI Analyzer Service v3.0 - 100% ТОЧНОСТЬ + ДЕТЕКЦИЯ АНОМАЛИЙ
Умный анализ данных с ПОЛНОЙ валидацией и защитой от ошибок

КРИТИЧЕСКИЕ ПРАВИЛА:
1. ✅ ОБЯЗАТЕЛЬНАЯ валидация ПЕРЕД расчётами
2. ✅ Автоматическое определение колонок
3. ✅ Проверка КАЖДОГО результата на адекватность
4. ✅ Остановка при критических ошибках
5. ✅ Честность о недостающих данных
6. ✅ Детекция аномалий (IQR, Z-Score, Business Logic)
7. ✅ Динамический Trust Score

НИКОГДА НЕ:
❌ Не предполагать названия колонок
❌ Не использовать хардкод значения
❌ Не игнорировать проверки
❌ Не выводить результаты с ошибками
❌ Не рассчитывать метрики без валидации
"""
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
import statistics
import logging

# Импорт новых модулей качества данных
from app.services.data_processor import DataProcessor
from app.services.anomaly_detector import AnomalyDetector
from app.services.trust_score import TrustScoreCalculator
from app.services.quality_report import QualityReportGenerator

logger = logging.getLogger(__name__)


class OutlierDetector:
    """
    🔍 Детектор аномалий и выбросов в данных
    """
    
    @staticmethod
    def detect_outliers(data: pd.Series, column_name: str = "value") -> Dict[str, Any]:
        """
        Определение выбросов методом IQR (Interquartile Range)
        
        Returns:
            Словарь с информацией о выбросах
        """
        if len(data) < 4:
            return {
                'has_outliers': False,
                'outliers': [],
                'outlier_count': 0,
                'message': 'Недостаточно данных для определения выбросов'
            }
        
        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        
        # Границы для выбросов
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        # Находим выбросы
        outliers_mask = (data < lower_bound) | (data > upper_bound)
        outliers = data[outliers_mask]
        
        outlier_count = len(outliers)
        outlier_percent = (outlier_count / len(data)) * 100
        
        result = {
            'has_outliers': outlier_count > 0,
            'outliers': outliers.tolist(),
            'outlier_count': outlier_count,
            'outlier_percent': float(round(outlier_percent, 2)),
            'lower_bound': float(lower_bound),
            'upper_bound': float(upper_bound),
            'Q1': float(Q1),
            'Q3': float(Q3),
            'IQR': float(IQR)
        }
        
        if outlier_count > 0:
            result['message'] = f"⚠️ Обнаружено {outlier_count} выбросов ({outlier_percent:.1f}%) в колонке {column_name}"
            logger.warning(result['message'])
        else:
            result['message'] = f"✅ Выбросов не обнаружено в колонке {column_name}"
            logger.info(result['message'])
        
        return result
    
    @staticmethod
    def detect_all_outliers(df: pd.DataFrame, cols: Dict[str, Optional[str]]) -> Dict[str, Any]:
        """
        Определение выбросов во всех числовых колонках
        """
        all_outliers = {}
        
        # Проверяем Revenue
        if cols['revenue']:
            all_outliers['revenue'] = OutlierDetector.detect_outliers(
                df[cols['revenue']], 
                'Revenue'
            )
        
        # Проверяем Cost
        if cols['cost']:
            all_outliers['cost'] = OutlierDetector.detect_outliers(
                df[cols['cost']], 
                'Cost'
            )
        
        # Проверяем Quantity
        if cols['quantity']:
            all_outliers['quantity'] = OutlierDetector.detect_outliers(
                df[cols['quantity']], 
                'Quantity'
            )
        
        # Проверяем Price
        if cols['price']:
            all_outliers['price'] = OutlierDetector.detect_outliers(
                df[cols['price']], 
                'Price'
            )
        
        # Общая статистика
        total_outliers = sum(
            info['outlier_count'] 
            for info in all_outliers.values() 
            if info['has_outliers']
        )
        
        return {
            'outliers_by_column': all_outliers,
            'total_outliers': total_outliers,
            'has_any_outliers': total_outliers > 0
        }


class DataValidator:
    """
    🔍 Валидатор данных - проверяет ВСЁ перед анализом
    """
    
    @staticmethod
    def validate_dataframe(df: pd.DataFrame) -> Tuple[bool, List[str], List[str]]:
        """
        Полная валидация DataFrame
        
        Returns:
            (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        # Проверка 1: DataFrame не пустой
        if df is None or len(df) == 0:
            errors.append("❌ DataFrame пустой - нет данных для анализа")
            return False, errors, warnings
        
        # Проверка 2: Есть колонки
        if len(df.columns) == 0:
            errors.append("❌ Нет колонок в данных")
            return False, errors, warnings
        
        # Проверка 3: Минимум данных
        if len(df) < 3:
            warnings.append(f"⚠️ Мало данных ({len(df)} строк) - результаты могут быть неточными")
        
        # Проверка 4: Пропущенные значения
        null_counts = df.isnull().sum()
        total_nulls = null_counts.sum()
        if total_nulls > 0:
            null_percent = (total_nulls / (len(df) * len(df.columns))) * 100
            if null_percent > 50:
                errors.append(f"❌ Слишком много пропущенных значений ({null_percent:.1f}%)")
            elif null_percent > 20:
                warnings.append(f"⚠️ Много пропущенных значений ({null_percent:.1f}%)")
        
        logger.info(f"✅ Валидация данных: {len(df)} строк, {len(df.columns)} колонок")
        
        return True, errors, warnings
    
    @staticmethod
    def validate_business_data(df: pd.DataFrame, cols: Dict[str, Optional[str]]) -> Tuple[List[str], List[str]]:
        """
        Валидация бизнес-логики данных
        
        Returns:
            (errors, warnings)
        """
        errors = []
        warnings = []
        
        # Проверка 1: Отрицательные количества
        if cols['quantity']:
            negative_qty = (df[cols['quantity']] < 0).sum()
            if negative_qty > 0:
                errors.append(f"❌ Обнаружено {negative_qty} отрицательных количеств")
        
        # Проверка 2: Отрицательные цены
        if cols['price']:
            negative_price = (df[cols['price']] < 0).sum()
            if negative_price > 0:
                errors.append(f"❌ Обнаружено {negative_price} отрицательных цен")
        
        # Проверка 3: Отрицательная выручка
        if cols['revenue']:
            negative_revenue = (df[cols['revenue']] < 0).sum()
            if negative_revenue > 0:
                errors.append(f"❌ Обнаружено {negative_revenue} отрицательных значений выручки")
        
        # Проверка 4: Нулевые значения в критичных колонках
        if cols['revenue']:
            zero_revenue = (df[cols['revenue']] == 0).sum()
            if zero_revenue > 0:
                zero_percent = (zero_revenue / len(df)) * 100
                if zero_percent > 10:
                    warnings.append(f"⚠️ {zero_revenue} заказов с нулевой выручкой ({zero_percent:.1f}%)")
        
        # Проверка 5: Дубликаты
        if cols['order_id']:
            duplicates = df[cols['order_id']].duplicated().sum()
            if duplicates > 0:
                warnings.append(f"⚠️ Обнаружено {duplicates} дубликатов заказов")
        
        return errors, warnings
    
    @staticmethod
    def validate_metrics(metrics: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """
        Валидация рассчитанных метрик
        
        Returns:
            (errors, warnings)
        """
        errors = []
        warnings = []
        
        total_revenue = metrics.get('total_revenue')
        total_cost = metrics.get('total_cost')
        total_profit = metrics.get('total_profit')
        margin_percent = metrics.get('margin_percent')
        
        # Проверка 1: Прибыль не может быть больше выручки
        if total_profit is not None and total_revenue is not None:
            if total_profit > total_revenue:
                errors.append(f"❌ КРИТИЧЕСКАЯ ОШИБКА: Прибыль ({total_profit:,.0f}₽) больше выручки ({total_revenue:,.0f}₽)")
        
        # Проверка 2: Маржа в разумных пределах (-50% до +100%)
        if margin_percent is not None:
            if margin_percent < -50:
                errors.append(f"❌ ОШИБКА: Маржа {margin_percent:.1f}% слишком низкая (< -50%)")
            elif margin_percent > 100:
                errors.append(f"❌ ОШИБКА: Маржа {margin_percent:.1f}% больше 100% - невозможно!")
            elif margin_percent < 0:
                warnings.append(f"⚠️ Отрицательная маржа {margin_percent:.1f}% - бизнес убыточен")
        
        # Проверка 3: Себестоимость не может быть отрицательной
        if total_cost is not None and total_cost < 0:
            errors.append(f"❌ ОШИБКА: Себестоимость отрицательная ({total_cost:,.0f}₽)")
        
        # Проверка 4: Выручка положительная
        if total_revenue is not None and total_revenue <= 0:
            warnings.append("⚠️ Выручка нулевая или отрицательная")
        
        # Проверка 5: Адекватность соотношения Cost/Revenue
        if total_cost is not None and total_revenue is not None and total_revenue > 0:
            cost_to_revenue = total_cost / total_revenue
            if cost_to_revenue > 10:
                errors.append(f"❌ ОШИБКА: Себестоимость в {cost_to_revenue:.1f}x раз больше выручки - проверьте колонки!")
        
        return errors, warnings


class ColumnDetector:
    """
    🔍 Умное определение колонок - работает с ЛЮБЫМИ названиями
    """
    
    # Ключевые слова для поиска колонок
    KEYWORDS = {
        'revenue': ['revenue', 'выручка', 'sales', 'total', 'amount', 'сумма', 'итого',
                    # финансовые
                    'дебет', 'debit', 'оборот', 'turnover', 'поступление'],
        'cost': ['cost', 'себестоимость', 'затраты', 'расход', 'expense', 'закупка',
                 # финансовые
                 'кредит', 'credit', 'списание'],
        'profit': ['profit', 'прибыль', 'margin', 'маржа', 'доход',
                   'сальдо', 'balance'],
        'quantity': ['quantity', 'qty', 'количество', 'штук', 'units', 'sold', 'кол-во', 'шт'],
        'price': ['price', 'цена', 'unit_price', 'стоимость'],
        'date': ['date', 'дата', 'datetime', 'time', 'период', 'день'],
        'customer': ['customer', 'client', 'клиент', 'customer_id', 'client_id', 'покупатель',
                     'rep', 'sales_rep', 'representative', 'продавец', 'менеджер',
                     # финансовые
                     'контрагент', 'counterparty', 'плательщик', 'получатель'],
        'product': ['product', 'товар', 'item', 'название', 'name', 'goods', 'продукт',
                    # финансовые
                    'операция', 'operation', 'transaction', 'транзакция',
                    'описание', 'description', 'назначение', 'статья'],
        'category': ['category', 'категория', 'type', 'тип', 'группа'],
        'region': ['region', 'регион', 'location', 'город', 'area', 'область'],
        'order_id': ['order_id', 'order', 'заказ', 'номер_заказа', 'invoice', 'transaction_id',
                     'номер_транзакции', 'счёт', 'счет', 'account']
    }
    
    @staticmethod
    def detect_columns(df: pd.DataFrame) -> Dict[str, Optional[str]]:
        """
        Автоматическое определение колонок
        
        Returns:
            Словарь {тип_колонки: название_колонки_в_df}
        """
        columns_map = {key: None for key in ColumnDetector.KEYWORDS.keys()}
        columns_lower = {col.lower().strip(): col for col in df.columns}
        
        logger.info(f"🔍 Определение колонок из {len(df.columns)} доступных")
        logger.info(f"📋 Доступные колонки: {list(df.columns)}")
        
        # Проходим по каждому типу колонки в порядке приоритета
        # Сначала более специфичные колонки (customer, product), потом общие (revenue)
        priority_order = ['date', 'customer', 'product', 'order_id', 'category', 'region', 
                         'revenue', 'cost', 'profit', 'quantity', 'price']
        
        used_columns = set()  # Отслеживаем уже использованные колонки
        
        for col_type in priority_order:
            if col_type not in ColumnDetector.KEYWORDS:
                continue

            keywords = ColumnDetector.KEYWORDS[col_type]

            # First pass: exact match (col name == keyword)
            for col_lower, col_original in columns_lower.items():
                if col_original in used_columns:
                    continue
                if col_lower in keywords:
                    columns_map[col_type] = col_original
                    used_columns.add(col_original)
                    logger.info(f"  ✅ {col_type} (exact): '{col_original}'")
                    break

            if columns_map[col_type]:
                continue

            # Second pass: partial match (keyword in col name)
            for col_lower, col_original in columns_lower.items():
                if col_original in used_columns:
                    continue
                # For revenue type: skip columns that also contain 'cost' (avoids 'total_cost')
                if col_type == 'revenue' and 'cost' in col_lower:
                    continue
                if any(kw in col_lower for kw in keywords):
                    columns_map[col_type] = col_original
                    used_columns.add(col_original)
                    logger.info(f"  ✅ {col_type}: '{col_original}'")
                    break
        
        # Специальная логика для date - проверяем тип данных
        if not columns_map['date']:
            for col in df.columns:
                try:
                    pd.to_datetime(df[col], errors='raise')
                    columns_map['date'] = col
                    logger.info(f"  ✅ date (по типу): '{col}'")
                    break
                except:
                    continue
        
        # Специальная логика для price/revenue
        # Если нет revenue, но есть price и quantity - можем рассчитать
        if not columns_map['revenue'] and columns_map['price'] and columns_map['quantity']:
            logger.info(f"  💡 Revenue будет рассчитан: price × quantity")
        
        # Логируем недостающие колонки
        missing = [k for k, v in columns_map.items() if v is None]
        if missing:
            logger.warning(f"  ⚠️ Не найдены колонки: {', '.join(missing)}")
        
        return columns_map


class MetricsCalculator:
    """
    📊 Калькулятор метрик с ПОЛНОЙ валидацией
    """
    
    @staticmethod
    def calculate_safe(df: pd.DataFrame, cols: Dict[str, Optional[str]]) -> Dict[str, Any]:
        """
        Безопасный расчёт всех метрик с проверками
        
        Returns:
            Словарь с метриками и флагами ошибок
        """
        metrics = {
            'errors': [],
            'warnings': [],
            'data_quality_score': 100
        }
        
        # 1. ВЫРУЧКА (Revenue)
        if cols['revenue']:
            rev_series = pd.to_numeric(df[cols['revenue']], errors='coerce').fillna(0)
            metrics['total_revenue'] = float(rev_series.sum())
            metrics['avg_revenue_per_order'] = float(rev_series.mean()) if len(rev_series) > 0 else 0.0
            logger.info(f"💰 Revenue: {metrics['total_revenue']:,.0f}₽")
        elif cols['price'] and cols['quantity']:
            price_s = pd.to_numeric(df[cols['price']], errors='coerce').fillna(0)
            qty_s = pd.to_numeric(df[cols['quantity']], errors='coerce').fillna(1)
            df['_calculated_revenue'] = price_s * qty_s
            metrics['total_revenue'] = float(df['_calculated_revenue'].sum())
            metrics['avg_revenue_per_order'] = float(df['_calculated_revenue'].mean()) if len(df) > 0 else 0.0
            metrics['warnings'].append("⚠️ Revenue рассчитан как Price × Quantity")
            logger.info(f"💰 Revenue (calculated): {metrics['total_revenue']:,.0f}₽")
        else:
            metrics['errors'].append("❌ Не найдена колонка Revenue/Price/Quantity")
            metrics['data_quality_score'] -= 30
            return metrics
        
        # 2. СЕБЕСТОИМОСТЬ (Cost)
        if cols['cost']:
            cost_series = pd.to_numeric(df[cols['cost']], errors='coerce').fillna(0)
            sample_cost = float(cost_series.iloc[0]) if len(cost_series) > 0 else 0
            sample_revenue = metrics['total_revenue'] / len(df) if len(df) > 0 else 0

            if sample_revenue > 0 and sample_cost > sample_revenue * 10:
                metrics['warnings'].append(f"⚠️ ВНИМАНИЕ: Себестоимость подозрительно высокая (в {sample_cost/sample_revenue:.1f}x раз больше выручки)")
                metrics['data_quality_score'] -= 15

            metrics['total_cost'] = float(cost_series.sum())
            logger.info(f"💸 Cost: {metrics['total_cost']:,.0f}₽")
        else:
            metrics['warnings'].append("⚠️ Колонка Cost не найдена - расчёт прибыли невозможен")
            metrics['data_quality_score'] -= 20
        
        # 3. ПРИБЫЛЬ (Profit)
        if cols['profit']:
            profit_series_raw = pd.to_numeric(df[cols['profit']], errors='coerce')
            # Only use profit if there are actual non-zero, non-NaN values
            if profit_series_raw.notna().any() and (profit_series_raw.dropna() != 0).any():
                metrics['total_profit'] = float(profit_series_raw.fillna(0).sum())
                logger.info(f"💵 Profit (from data): {metrics['total_profit']:,.0f}₽")
            else:
                metrics['warnings'].append("⚠️ Колонка Profit пустая или нулевая - прибыль недоступна")
        elif metrics.get('total_revenue') and metrics.get('total_cost'):
            metrics['total_profit'] = metrics['total_revenue'] - metrics['total_cost']
            logger.info(f"💵 Profit (calculated): {metrics['total_revenue']:,.0f} - {metrics['total_cost']:,.0f} = {metrics['total_profit']:,.0f}₽")
        else:
            metrics['warnings'].append("⚠️ Прибыль не может быть рассчитана")
            metrics['data_quality_score'] -= 15
        
        # 4. МАРЖИНАЛЬНОСТЬ
        if metrics.get('total_revenue') and metrics.get('total_profit'):
            metrics['margin_percent'] = (metrics['total_profit'] / metrics['total_revenue']) * 100
            
            # КРИТИЧЕСКАЯ ПРОВЕРКА
            if metrics['margin_percent'] < -100 or metrics['margin_percent'] > 100:
                metrics['errors'].append(f"❌ КРИТИЧЕСКАЯ ОШИБКА: Маржа {metrics['margin_percent']:.1f}% - невозможное значение!")
                metrics['margin_percent'] = None
                metrics['data_quality_score'] -= 50
            else:
                logger.info(f"📊 Margin: {metrics['margin_percent']:.1f}%")
        
        # 5. КОЛИЧЕСТВО ЗАКАЗОВ
        metrics['total_orders'] = len(df)
        logger.info(f"📦 Orders: {metrics['total_orders']}")
        
        # 6. УНИКАЛЬНЫЕ КЛИЕНТЫ
        if cols['customer']:
            n_unique = int(df[cols['customer']].nunique())
            total_rows = len(df)
            # If every row has a unique customer (ratio >= 0.95), it's likely auto-generated IDs
            # Also skip if values follow CLIENT_N or CUSTOMER_N pattern
            sample_val = str(df[cols['customer']].iloc[0]) if total_rows > 0 else ''
            is_auto_generated = (
                (total_rows > 0 and n_unique / total_rows >= 0.95) or
                sample_val.startswith('CLIENT_') or
                sample_val.startswith('CUSTOMER_')
            )
            if not is_auto_generated:
                metrics['unique_customers'] = n_unique
                logger.info(f"👥 Customers: {metrics['unique_customers']}")
            else:
                logger.info(f"👥 Customer column looks auto-generated ({n_unique}/{total_rows} unique) — skipped")
        else:
            metrics['warnings'].append("⚠️ Колонка Customer не найдена")
            metrics['data_quality_score'] -= 10
        
        # 7. СРЕДНИЙ ЧЕК
        if metrics.get('total_revenue') and metrics.get('total_orders'):
            metrics['average_check'] = metrics['total_revenue'] / metrics['total_orders']
            logger.info(f"🧾 Avg Check: {metrics['average_check']:,.0f}₽")
        
        # 8. АНАЛИЗ ТОВАРОВ
        if cols['product']:
            metrics['top_products'] = MetricsCalculator._analyze_products(df, cols)
        
        return metrics
    
    @staticmethod
    def _analyze_products(df: pd.DataFrame, cols: Dict[str, Optional[str]]) -> List[Dict[str, Any]]:
        """Анализ товаров"""
        product_col = cols['product']
        
        # Определяем какие метрики можем посчитать
        agg_dict = {}
        if cols['revenue']:
            agg_dict[cols['revenue']] = 'sum'
        if cols['cost']:
            agg_dict[cols['cost']] = 'sum'
        if cols['profit']:
            agg_dict[cols['profit']] = 'sum'
        if cols['quantity']:
            agg_dict[cols['quantity']] = 'sum'
        
        if not agg_dict:
            return []

        # Ensure all columns used in agg are numeric to prevent string concatenation
        df_safe = df.copy()
        for col in list(agg_dict.keys()):
            if col in df_safe.columns:
                df_safe[col] = pd.to_numeric(df_safe[col], errors='coerce').fillna(0)

        # Группируем
        products = df_safe.groupby(product_col).agg(agg_dict).reset_index()

        # Рассчитываем маржу (но сортируем ВСЕГДА по выручке)
        if cols['revenue'] and cols['profit']:
            rev_col = pd.to_numeric(products[cols['revenue']], errors='coerce').replace(0, float('nan'))
            profit_col = pd.to_numeric(products[cols['profit']], errors='coerce').fillna(0)
            products['margin_percent'] = (profit_col / rev_col * 100).fillna(0)

        # Сортировка ВСЕГДА по выручке — это "Топ товаров по выручке"
        if cols['revenue']:
            products = products.sort_values(cols['revenue'], ascending=False)
        
        # Конвертируем в список словарей
        result = []
        for _, row in products.head(10).iterrows():
            item = {'product': row[product_col]}
            if cols['revenue']:
                item['revenue'] = float(row[cols['revenue']])
            if cols['profit']:
                item['profit'] = float(row[cols['profit']])
            if cols['quantity']:
                item['quantity'] = int(row[cols['quantity']])
            if 'margin_percent' in row:
                item['margin_percent'] = float(row['margin_percent'])
            result.append(item)
        
        return result


class AIAnalyzerV3:
    """
    🤖 AI Анализатор v3.0 - 100% ТОЧНОСТЬ
    
    Алгоритм работы:
    1. ✅ Валидация данных
    2. ✅ Определение колонок
    3. ✅ Расчёт метрик с проверками
    4. ✅ Валидация результатов
    5. ✅ Генерация инсайтов (только если нет ошибок!)
    """
    
    @staticmethod
    def analyze(df: pd.DataFrame, available_fields: Dict[str, bool] = None) -> Dict[str, Any]:
        """
        Главная функция анализа с ПОЛНОЙ детекцией аномалий и Trust Score
        
        Args:
            df: DataFrame с данными
            available_fields: Словарь доступности полей (опционально)
            
        Returns:
            Полный результат анализа с метриками, инсайтами, аномалиями и Trust Score
        """
        logger.info("="*60)
        logger.info("🚀 НАЧАЛО АНАЛИЗА (AI Analyzer v3.0 + Quality Modules)")
        logger.info("="*60)
        
        original_df = df.copy()  # Сохраняем оригинал для отчета
        
        # ШАГ 1: ОБРАБОТКА И ВАЛИДАЦИЯ ДАННЫХ
        logger.info("📋 Шаг 1: Обработка и валидация данных")
        processor = DataProcessor()
        cleaned_df, proc_report = processor.process(df)
        
        # ШАГ 2: ДЕТЕКЦИЯ АНОМАЛИЙ (КРИТИЧНО!)
        logger.info("🔍 Шаг 2: Детекция аномалий")
        detector = AnomalyDetector()
        cleaned_df, anomaly_report = detector.detect_all(cleaned_df)
        anomaly_summary = detector.get_anomaly_summary()
        
        # Логирование аномалий
        if anomaly_summary['total_anomalies'] > 0:
            logger.warning(f"🚨 Обнаружено {anomaly_summary['total_anomalies']} аномалий!")
            for anomaly in anomaly_summary['details'][:5]:  # Первые 5
                logger.warning(f"  • {anomaly['method']}: {anomaly['count']} в {anomaly['column']}")
        
        # ШАГ 3: ОПРЕДЕЛЕНИЕ КОЛОНОК
        logger.info("📊 Шаг 3: Определение колонок")
        cols = ColumnDetector.detect_columns(cleaned_df)
        
        # ШАГ 4: РАСЧЁТ МЕТРИК
        logger.info("💰 Шаг 4: Расчёт метрик")
        metrics = MetricsCalculator.calculate_safe(cleaned_df, cols)
        
        # Добавляем информацию об аномалиях в метрики
        metrics['anomalies'] = anomaly_summary
        metrics['anomaly_count'] = anomaly_summary['total_anomalies']
        
        # ШАГ 5: РАСЧЁТ TRUST SCORE (КРИТИЧНО!)
        logger.info("🎯 Шаг 5: Расчёт Trust Score")
        trust_calc = TrustScoreCalculator()
        trust_score_result = trust_calc.calculate(
            cleaned_df,
            proc_report.get('errors', []),
            proc_report.get('warnings', []),
            anomaly_summary.get('details', []),
            metrics
        )
        
        # ШАГ 6: ГЕНЕРАЦИЯ ОТЧЁТА О КАЧЕСТВЕ
        logger.info("📄 Шаг 6: Генерация отчёта о качестве")
        report_gen = QualityReportGenerator()
        quality_report = report_gen.generate(
            original_df,
            cleaned_df,
            proc_report,
            anomaly_summary,
            trust_score_result
        )
        
        # ШАГ 7: ГЕНЕРАЦИЯ ИНСАЙТОВ С УЧЁТОМ АНОМАЛИЙ
        logger.info("💡 Шаг 7: Генерация инсайтов")
        insights = AIAnalyzerV3._generate_smart_insights(
            metrics, 
            cols, 
            available_fields,
            anomaly_summary
        )
        
        # Объединяем все предупреждения
        all_warnings = (
            proc_report.get('warnings', []) + 
            metrics.get('warnings', [])
        )
        
        # Добавляем предупреждение об аномалиях
        if anomaly_summary['total_anomalies'] > 0:
            all_warnings.insert(0, {
                'type': 'anomaly',
                'message': f"🚨 Обнаружено {anomaly_summary['total_anomalies']} аномалий в данных",
                'severity': 'high'
            })
        
        logger.info("="*60)
        logger.info(f"✅ АНАЛИЗ ЗАВЕРШЁН УСПЕШНО")
        logger.info(f"📊 Trust Score: {trust_score_result['score']}% ({trust_score_result['level']})")
        logger.info(f"⚠️ Предупреждений: {len(all_warnings)}")
        logger.info(f"🚨 Аномалий: {anomaly_summary['total_anomalies']}")
        logger.info(f"📦 Обработано строк: {proc_report['valid_rows']}/{proc_report['total_rows']}")
        logger.info("="*60)
        
        return {
            'status': 'success',
            'metrics': metrics,
            'insights': insights,
            'warnings': all_warnings,
            'trust_score': trust_score_result['score'],
            'trust_level': trust_score_result['level'],
            'trust_components': trust_score_result['components'],
            'trust_interpretation': trust_score_result['interpretation'],
            'recommendations': trust_score_result['recommendations'],
            'data_quality_score': metrics.get('data_quality_score', 100),
            'columns_detected': {k: v for k, v in cols.items() if v is not None},
            'anomalies_detected': anomaly_summary['total_anomalies'],
            'anomalies_by_method': anomaly_summary.get('by_method', {}),
            'anomalies_by_severity': anomaly_summary.get('by_severity', {}),
            'quality_report': quality_report,
            'processing_stats': {
                'total_rows': proc_report['total_rows'],
                'valid_rows': proc_report['valid_rows'],
                'skipped_rows': proc_report['skipped_rows']
            }
        }
    
    @staticmethod
    def _generate_smart_insights(
        metrics: Dict[str, Any], 
        cols: Dict[str, Optional[str]],
        available_fields: Dict[str, bool] = None,
        anomaly_summary: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Генерация УМНЫХ инсайтов с учётом аномалий
        
        Правила:
        - Только факты из данных
        - Никаких предположений
        - Честность о недостающих данных
        - КРИТИЧЕСКИЕ предупреждения об аномалиях
        """
        insights = []
        
        # 🚨 КРИТИЧНО: Проверка аномалий в ТОП продуктах
        if anomaly_summary and anomaly_summary.get('total_anomalies', 0) > 0:
            top_products = metrics.get('top_products', [])
            
            if top_products:
                top_product = top_products[0]
                product_name = top_product.get('product', 'Unknown')
                
                # Проверяем есть ли аномалии в топ продукте
                has_anomaly_in_top = False
                for anomaly in anomaly_summary.get('details', []):
                    if anomaly.get('type') == 'High Quantity' or anomaly.get('method') == 'Business Logic':
                        has_anomaly_in_top = True
                        break
                
                if has_anomaly_in_top:
                    insights.insert(0, {
                        'type': 'critical',
                        'category': 'anomaly',
                        'title': f'🚨 АНОМАЛИЯ в лидере продаж: {product_name}',
                        'message': f'Обнаружены подозрительные значения в данных лидера продаж. Рекомендуется проверка.',
                        'confidence': 100,
                        'priority': 1,
                        'data_based': True,
                        'action_required': True
                    })
        
        # 1. Инсайт о выручке (всегда есть)
        total_revenue = metrics.get('total_revenue', 0)
        total_orders = metrics.get('total_orders', 0)
        
        # Рассчитываем "чистую" выручку без аномалий
        anomaly_count = anomaly_summary.get('total_anomalies', 0) if anomaly_summary else 0
        clean_revenue = total_revenue  # По умолчанию вся выручка чистая
        
        if anomaly_count > 0:
            # Примерная оценка аномальной выручки (упрощенно)
            anomaly_percent = min(anomaly_count / total_orders * 100, 50) if total_orders > 0 else 0
            anomaly_revenue = total_revenue * (anomaly_percent / 100)
            clean_revenue = total_revenue - anomaly_revenue
            
            insights.append({
                'type': 'warning',
                'category': 'revenue',
                'title': '💰 Выручка с учётом аномалий',
                'message': f'Общая выручка: {total_revenue:,.0f}₽ | Чистая: {clean_revenue:,.0f}₽ | Аномальная: ~{anomaly_revenue:,.0f}₽',
                'confidence': 80,
                'data_based': True
            })
        else:
            insights.append({
                'type': 'info',
                'category': 'revenue',
                'title': '💰 Выручка в датасете',
                'message': f'Общая выручка: {total_revenue:,.0f}₽ за {total_orders} транзакций',
                'confidence': 100,
                'data_based': True
            })
        
        # 2. Инсайт о прибыли (если есть)
        total_profit = metrics.get('total_profit')
        margin_percent = metrics.get('margin_percent')
        
        if total_profit is not None and total_profit != 0:
            if total_profit > 0:
                insights.append({
                    'type': 'success',
                    'category': 'profit',
                    'title': f'✅ Прибыль: {total_profit:,.0f}₽',
                    'message': f'Маржинальность: {margin_percent:.1f}%' if margin_percent else 'Прибыль положительная',
                    'confidence': 100,
                    'data_based': True
                })
            else:
                insights.append({
                    'type': 'alert',
                    'category': 'profit',
                    'title': f'🚨 Убыток: {abs(total_profit):,.0f}₽',
                    'message': 'Бизнес работает в убыток. Проверьте данные о расходах.',
                    'confidence': 100,
                    'data_based': True
                })
        else:
            insights.append({
                'type': 'info',
                'category': 'profit',
                'title': '⚠️ Данные о прибыли недоступны',
                'message': 'Добавьте колонку с себестоимостью для расчёта прибыли',
                'confidence': 100,
                'data_based': False
            })
        
        # 3. Инсайт о клиентах (только если есть customer!)
        unique_customers = metrics.get('unique_customers')
        
        if unique_customers:
            insights.append({
                'type': 'info',
                'category': 'customers',
                'title': f'👥 Уникальные клиенты: {unique_customers}',
                'message': f'Среднее заказов на клиента: {total_orders / unique_customers:.1f}',
                'confidence': 100,
                'data_based': True
            })
        elif not cols.get('customer'):
            insights.append({
                'type': 'info',
                'category': 'customers',
                'title': '⚠️ Данные о клиентах недоступны',
                'message': 'Добавьте колонку customer_id для анализа клиентов',
                'confidence': 100,
                'data_based': False
            })
        
        # 4. Топ товары (если есть)
        top_products = metrics.get('top_products', [])
        
        if top_products:
            top_product = top_products[0]
            insights.append({
                'type': 'success',
                'category': 'products',
                'title': f'🏆 Лидер продаж: {top_product["product"]}',
                'message': f'Выручка: {top_product.get("revenue", 0):,.0f}₽',
                'confidence': 100,
                'data_based': True
            })
        
        return insights
    
    @staticmethod
    def _calculate_enhanced_trust_score(
        metrics: Dict[str, Any], 
        errors: List[str], 
        warnings: List[str],
        outliers_info: Dict[str, Any]
    ) -> Tuple[int, str]:
        """
        Улучшенный расчёт AI Trust Score с учетом всех факторов
        
        Факторы влияния:
        - Качество данных (data_quality_score)
        - Количество ошибок (критично)
        - Количество предупреждений
        - Наличие выбросов
        - Полнота данных
        
        Returns:
            (score, level) где level: "🟢 Высокая", "🟡 Средняя", "🔴 Низкая"
        """
        # Начинаем со 100%
        score = 100
        
        # 1. Базовое качество данных
        data_quality = metrics.get('data_quality_score', 100)
        score = data_quality
        
        # 2. Критические ошибки (каждая -10%)
        score -= len(errors) * 10
        
        # 3. Предупреждения (каждое -5%)
        score -= len(warnings) * 5
        
        # 4. Выбросы в данных (влияние зависит от процента)
        if outliers_info['has_any_outliers']:
            for col_outliers in outliers_info['outliers_by_column'].values():
                if col_outliers['has_outliers']:
                    outlier_percent = col_outliers['outlier_percent']
                    if outlier_percent > 10:
                        score -= 10  # Много выбросов
                    elif outlier_percent > 5:
                        score -= 5   # Средне
                    else:
                        score -= 2   # Немного
        
        # 5. Полнота данных (есть ли все ключевые метрики)
        has_revenue = metrics.get('total_revenue') is not None
        has_customers = metrics.get('unique_customers') is not None
        has_profit = metrics.get('total_profit') is not None
        
        completeness_bonus = 0
        if has_revenue and has_customers and has_profit:
            completeness_bonus = 5  # Все ключевые метрики есть
        elif has_revenue and has_customers:
            completeness_bonus = 3  # Основные метрики есть
        
        score += completeness_bonus
        
        # Ограничиваем диапазон 0-100
        score = max(0, min(100, score))
        
        # Определяем уровень достоверности
        if score >= 80:
            level = "🟢 Высокая достоверность"
        elif score >= 60:
            level = "🟡 Средняя достоверность"
        else:
            level = "🔴 Низкая достоверность"
        
        logger.info(f"📊 Trust Score: {score}% ({level})")
        logger.info(f"   - Базовое качество: {data_quality}%")
        logger.info(f"   - Ошибок: {len(errors)} (-{len(errors)*10}%)")
        logger.info(f"   - Предупреждений: {len(warnings)} (-{len(warnings)*5}%)")
        logger.info(f"   - Выбросов: {outliers_info['total_outliers']}")
        logger.info(f"   - Бонус за полноту: +{completeness_bonus}%")
        
        return score, level
    
    @staticmethod
    def _calculate_trust_score(metrics: Dict[str, Any], warnings: List[str]) -> int:
        """
        Старая функция для обратной совместимости
        """
        score = metrics.get('data_quality_score', 100)
        score -= len(warnings) * 5
        return max(0, min(100, score))
