"""
Data Processor Service - Модуль обработки и валидации данных
Версия: 1.0 согласно ТЗ от 06.02.2026
"""
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime
import logging

try:
    import chardet
except ImportError:
    chardet = None

logger = logging.getLogger(__name__)


class DataProcessor:
    """
    Обработчик данных с полной валидацией и очисткой
    """
    
    # Поддерживаемые форматы дат
    DATE_FORMATS = [
        '%Y-%m-%d',
        '%d.%m.%Y',
        '%m/%d/%Y',
        '%Y/%m/%d',
        '%d-%m-%Y',
        '%Y.%m.%d',
        '%d/%m/%Y'
    ]
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.anomalies = []
        self.processed_rows = 0
        self.valid_rows = 0
        self.skipped_rows = 0
        
    def process(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Полная обработка данных с валидацией и очисткой
        
        Returns:
            (cleaned_df, report)
        """
        logger.info(f"🔄 Начало обработки данных: {len(df)} строк")
        
        self.processed_rows = len(df)
        original_df = df.copy()
        
        # Шаг 1: Валидация структуры
        df = self._validate_structure(df)
        
        # Шаг 2: Очистка текстовых полей
        df = self._clean_text_fields(df)
        
        # Шаг 3: Валидация и очистка дат
        df = self._process_dates(df)
        
        # Шаг 4: Валидация числовых полей
        df = self._validate_numeric_fields(df)
        
        # Шаг 5: Обработка NULL значений
        df = self._handle_nulls(df)
        
        # Шаг 6: Удаление дубликатов
        df = self._remove_duplicates(df)
        
        # Шаг 7: Обработка выбросов
        df = self._mark_outliers(df)
        
        self.valid_rows = len(df)
        self.skipped_rows = self.processed_rows - self.valid_rows
        
        # Генерация отчета
        report = self._generate_report(original_df, df)
        
        logger.info(f"✅ Обработка завершена: {self.valid_rows}/{self.processed_rows} валидных строк")
        
        return df, report
    
    def _validate_structure(self, df: pd.DataFrame) -> pd.DataFrame:
        """Валидация структуры данных"""
        if df is None or len(df) == 0:
            self.errors.append({
                'type': 'critical',
                'message': 'DataFrame пустой',
                'row': None
            })
            return df
        
        if len(df.columns) == 0:
            self.errors.append({
                'type': 'critical',
                'message': 'Нет колонок в данных',
                'row': None
            })
            return df
        
        logger.info(f"📋 Структура: {len(df)} строк, {len(df.columns)} колонок")
        return df
    
    def _clean_text_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Очистка текстовых полей"""
        text_columns = df.select_dtypes(include=['object']).columns
        
        for col in text_columns:
            if col in df.columns:
                # Удаление лишних пробелов
                df[col] = df[col].astype(str).str.strip()
                
                # Обработка кодировки
                try:
                    df[col] = df[col].apply(self._fix_encoding)
                except Exception as e:
                    self.warnings.append({
                        'type': 'encoding',
                        'message': f'Проблема с кодировкой в колонке {col}',
                        'details': str(e)
                    })
        
        logger.info(f"🧹 Очищено {len(text_columns)} текстовых колонок")
        return df
    
    def _fix_encoding(self, text: str) -> str:
        """Исправление кодировки текста"""
        if not isinstance(text, str):
            return str(text)
        
        try:
            if chardet is not None:
                if text.encode('utf-8', errors='ignore').decode('utf-8') != text:
                    detected = chardet.detect(text.encode())
                    if detected['encoding']:
                        return text.encode(detected['encoding'], errors='ignore').decode('utf-8', errors='ignore')
        except:
            pass
        
        return text
    
    def _process_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Обработка и валидация дат"""
        date_columns = []
        
        # Поиск колонок с датами
        for col in df.columns:
            col_lower = col.lower()
            if any(kw in col_lower for kw in ['date', 'дата', 'datetime', 'time']):
                date_columns.append(col)
        
        for col in date_columns:
            df[col] = df[col].apply(lambda x: self._parse_date(x, col))
        
        logger.info(f"📅 Обработано {len(date_columns)} колонок с датами")
        return df
    
    def _parse_date(self, value: Any, column: str) -> Optional[datetime]:
        """Парсинг даты с поддержкой множества форматов"""
        if pd.isna(value):
            return None
        
        if isinstance(value, datetime):
            return value
        
        value_str = str(value).strip()
        
        # Попытка парсинга в разных форматах
        for fmt in self.DATE_FORMATS:
            try:
                parsed = datetime.strptime(value_str, fmt)
                
                # Проверка на разумность даты
                if parsed.year < 1900 or parsed.year > 2100:
                    self.warnings.append({
                        'type': 'date',
                        'message': f'Подозрительная дата: {value_str}',
                        'column': column
                    })
                
                return parsed
            except:
                continue
        
        # Если не удалось распарсить
        self.warnings.append({
            'type': 'date',
            'message': f'Невалидная дата: {value_str}, заменена на текущую',
            'column': column
        })
        
        return datetime.now()
    
    def _validate_numeric_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Валидация числовых полей"""
        numeric_keywords = {
            'quantity': ['quantity', 'qty', 'количество', 'кол-во', 'штук'],
            'price': ['price', 'цена', 'стоимость', 'amount'],
            'cost': ['cost', 'себестоимость', 'затраты'],
            'revenue': ['revenue', 'выручка', 'sales'],
            'profit': ['profit', 'прибыль', 'margin', 'маржа']
        }
        
        for field_type, keywords in numeric_keywords.items():
            for col in df.columns:
                col_lower = col.lower()
                if any(kw in col_lower for kw in keywords):
                    df = self._validate_numeric_column(df, col, field_type)
        
        return df
    
    def _validate_numeric_column(self, df: pd.DataFrame, col: str, field_type: str) -> pd.DataFrame:
        """Валидация конкретной числовой колонки"""
        # Конвертация в числовой тип
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Обработка отрицательных значений
        negative_mask = df[col] < 0
        if negative_mask.any():
            negative_count = negative_mask.sum()
            self.warnings.append({
                'type': 'negative',
                'message': f'Найдено {negative_count} отрицательных значений в {col}',
                'column': col,
                'action': 'Заменены на 0'
            })
            df.loc[negative_mask, col] = 0
        
        # Проверка на 0 для обязательных полей
        if field_type in ['quantity', 'price']:
            zero_mask = df[col] == 0
            if zero_mask.any():
                self.warnings.append({
                    'type': 'zero',
                    'message': f'Найдены нулевые значения в {col}',
                    'column': col
                })
        
        return df
    
    def _handle_nulls(self, df: pd.DataFrame) -> pd.DataFrame:
        """Обработка NULL значений"""
        null_counts = df.isnull().sum()
        
        for col, null_count in null_counts.items():
            if null_count > 0:
                null_percent = (null_count / len(df)) * 100
                
                self.warnings.append({
                    'type': 'null',
                    'message': f'{col}: {null_count} пропущенных значений ({null_percent:.1f}%)',
                    'column': col
                })
                
                # Удаление строк с NULL в критичных полях
                critical_fields = ['quantity', 'price', 'product']
                if any(kw in col.lower() for kw in critical_fields):
                    before_len = len(df)
                    df = df.dropna(subset=[col])
                    removed = before_len - len(df)
                    if removed > 0:
                        logger.info(f"🗑️ Удалено {removed} строк с NULL в {col}")
        
        return df
    
    def _remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Удаление дубликатов"""
        # Поиск колонки OrderID
        order_id_col = None
        for col in df.columns:
            if any(kw in col.lower() for kw in ['order_id', 'order', 'заказ', 'id']):
                order_id_col = col
                break
        
        if order_id_col:
            before_len = len(df)
            df = df.drop_duplicates(subset=[order_id_col], keep='first')
            removed = before_len - len(df)
            
            if removed > 0:
                self.warnings.append({
                    'type': 'duplicates',
                    'message': f'Удалено {removed} дубликатов по {order_id_col}',
                    'count': removed
                })
                logger.info(f"🗑️ Удалено {removed} дубликатов")
        
        return df
    
    def _mark_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Пометка выбросов (не удаление!)"""
        df['_is_outlier'] = False
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if col.startswith('_'):
                continue
            
            outliers = self._detect_outliers_iqr(df, col)
            if len(outliers) > 0:
                df.loc[outliers.index, '_is_outlier'] = True
                
                self.anomalies.append({
                    'type': 'outlier',
                    'column': col,
                    'count': len(outliers),
                    'values': outliers[col].tolist()[:5]  # Первые 5
                })
        
        outlier_count = df['_is_outlier'].sum()
        if outlier_count > 0:
            logger.info(f"🚨 Обнаружено {outlier_count} выбросов (помечены, не удалены)")
        
        return df
    
    def _detect_outliers_iqr(self, df: pd.DataFrame, column: str) -> pd.DataFrame:
        """Детекция выбросов методом IQR"""
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        outliers = df[(df[column] < lower_bound) | (df[column] > upper_bound)]
        return outliers
    
    def _generate_report(self, original_df: pd.DataFrame, cleaned_df: pd.DataFrame) -> Dict[str, Any]:
        """Генерация отчета о качестве данных"""
        return {
            'total_rows': self.processed_rows,
            'valid_rows': self.valid_rows,
            'skipped_rows': self.skipped_rows,
            'valid_percent': (self.valid_rows / self.processed_rows * 100) if self.processed_rows > 0 else 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'anomalies': self.anomalies,
            'columns_processed': len(cleaned_df.columns),
            'null_summary': original_df.isnull().sum().to_dict(),
            'data_types': cleaned_df.dtypes.astype(str).to_dict()
        }
