"""
Anomaly Detector - Детектор аномалий в данных
Версия: 1.0 согласно ТЗ от 06.02.2026
"""
from typing import Dict, List, Any, Tuple, Optional
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Детектор аномалий с использованием множества методов
    """
    
    def __init__(self):
        self.anomalies = []
        
    def detect_all(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """
        Обнаружение всех типов аномалий
        
        Returns:
            (df_with_flags, anomalies_list)
        """
        logger.info("🔍 Начало детекции аномалий")
        
        # Метод 1: IQR (Interquartile Range)
        df = self._detect_iqr(df)
        
        # Метод 2: Z-Score
        df = self._detect_zscore(df)
        
        # Метод 3: Percentile-based
        df = self._detect_percentile(df)
        
        # Метод 4: Business Logic
        df = self._detect_business_logic(df)
        
        # Объединение всех флагов
        df['_anomaly_score'] = self._calculate_anomaly_score(df)
        
        logger.info(f"✅ Детекция завершена: найдено {len(self.anomalies)} аномалий")
        
        return df, self.anomalies
    
    def _detect_iqr(self, df: pd.DataFrame) -> pd.DataFrame:
        """Детекция выбросов методом IQR"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if col.startswith('_'):
                continue
            
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outlier_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
            df[f'_iqr_outlier_{col}'] = outlier_mask
            
            if outlier_mask.any():
                outlier_count = outlier_mask.sum()
                outlier_values = df.loc[outlier_mask, col].tolist()
                
                self.anomalies.append({
                    'method': 'IQR',
                    'column': col,
                    'count': int(outlier_count),
                    'lower_bound': float(lower_bound),
                    'upper_bound': float(upper_bound),
                    'sample_values': outlier_values[:5],
                    'severity': 'medium'
                })
                
                logger.info(f"  📊 IQR: {outlier_count} выбросов в {col}")
        
        return df
    
    def _detect_zscore(self, df: pd.DataFrame) -> pd.DataFrame:
        """Детекция выбросов методом Z-Score"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if col.startswith('_'):
                continue
            
            # Расчет Z-Score
            mean = df[col].mean()
            std = df[col].std()
            
            if std == 0:
                continue
            
            z_scores = np.abs((df[col] - mean) / std)
            outlier_mask = z_scores > 3
            
            df[f'_zscore_outlier_{col}'] = outlier_mask
            
            if outlier_mask.any():
                outlier_count = outlier_mask.sum()
                outlier_values = df.loc[outlier_mask, col].tolist()
                
                self.anomalies.append({
                    'method': 'Z-Score',
                    'column': col,
                    'count': int(outlier_count),
                    'threshold': 3.0,
                    'sample_values': outlier_values[:5],
                    'severity': 'high'
                })
                
                logger.info(f"  📈 Z-Score: {outlier_count} выбросов в {col}")
        
        return df
    
    def _detect_percentile(self, df: pd.DataFrame) -> pd.DataFrame:
        """Детекция выбросов методом перцентилей"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if col.startswith('_'):
                continue
            
            p1 = df[col].quantile(0.01)
            p99 = df[col].quantile(0.99)
            
            outlier_mask = (df[col] < p1) | (df[col] > p99)
            df[f'_percentile_outlier_{col}'] = outlier_mask
            
            if outlier_mask.any():
                outlier_count = outlier_mask.sum()
                outlier_values = df.loc[outlier_mask, col].tolist()
                
                self.anomalies.append({
                    'method': 'Percentile',
                    'column': col,
                    'count': int(outlier_count),
                    'p1': float(p1),
                    'p99': float(p99),
                    'sample_values': outlier_values[:5],
                    'severity': 'low'
                })
                
                logger.info(f"  📉 Percentile: {outlier_count} выбросов в {col}")
        
        return df
    
    def _detect_business_logic(self, df: pd.DataFrame) -> pd.DataFrame:
        """Детекция аномалий на основе бизнес-логики"""
        # Поиск колонок
        quantity_col = self._find_column(df, ['quantity', 'qty', 'количество'])
        price_col = self._find_column(df, ['price', 'цена', 'стоимость'])
        
        # Проверка 1: Нереалистичное количество (> 100)
        if quantity_col:
            high_qty_mask = df[quantity_col] > 100
            df['_business_high_quantity'] = high_qty_mask
            
            if high_qty_mask.any():
                count = high_qty_mask.sum()
                self.anomalies.append({
                    'method': 'Business Logic',
                    'type': 'High Quantity',
                    'column': quantity_col,
                    'count': int(count),
                    'threshold': 100,
                    'message': 'Подозрительно высокое количество товара',
                    'severity': 'medium'
                })
                logger.info(f"  💼 Business: {count} записей с высоким количеством")
        
        # Проверка 2: Нереалистичная цена (> 1,000,000)
        if price_col:
            high_price_mask = df[price_col] > 1_000_000
            df['_business_high_price'] = high_price_mask
            
            if high_price_mask.any():
                count = high_price_mask.sum()
                self.anomalies.append({
                    'method': 'Business Logic',
                    'type': 'High Price',
                    'column': price_col,
                    'count': int(count),
                    'threshold': 1_000_000,
                    'message': 'Подозрительно высокая цена',
                    'severity': 'high'
                })
                logger.info(f"  💼 Business: {count} записей с высокой ценой")
        
        # Проверка 3: Нулевые значения в критичных полях
        if quantity_col:
            zero_qty_mask = df[quantity_col] == 0
            if zero_qty_mask.any():
                count = zero_qty_mask.sum()
                self.anomalies.append({
                    'method': 'Business Logic',
                    'type': 'Zero Quantity',
                    'column': quantity_col,
                    'count': int(count),
                    'message': 'Заказы с нулевым количеством',
                    'severity': 'low'
                })
        
        return df
    
    def _calculate_anomaly_score(self, df: pd.DataFrame) -> pd.Series:
        """
        Расчет общего скора аномальности для каждой строки
        Score от 0 до 100, где 100 = максимальная аномальность
        """
        anomaly_cols = [col for col in df.columns if col.startswith('_') and 'outlier' in col]
        
        if not anomaly_cols:
            return pd.Series(0, index=df.index)
        
        # Подсчет количества методов, которые пометили строку как аномалию
        anomaly_count = df[anomaly_cols].sum(axis=1)
        max_possible = len(anomaly_cols)
        
        # Нормализация к 0-100
        anomaly_score = (anomaly_count / max_possible * 100) if max_possible > 0 else 0
        
        return anomaly_score
    
    def _find_column(self, df: pd.DataFrame, keywords: List[str]) -> Optional[str]:
        """Поиск колонки по ключевым словам"""
        for col in df.columns:
            col_lower = col.lower()
            if any(kw in col_lower for kw in keywords):
                return col
        return None
    
    def get_anomaly_summary(self) -> Dict[str, Any]:
        """Получение сводки по аномалиям"""
        if not self.anomalies:
            return {
                'total_anomalies': 0,
                'by_method': {},
                'by_severity': {},
                'details': []
            }
        
        by_method = {}
        by_severity = {}
        
        for anomaly in self.anomalies:
            method = anomaly['method']
            severity = anomaly.get('severity', 'unknown')
            
            by_method[method] = by_method.get(method, 0) + anomaly['count']
            by_severity[severity] = by_severity.get(severity, 0) + anomaly['count']
        
        return {
            'total_anomalies': sum(a['count'] for a in self.anomalies),
            'by_method': by_method,
            'by_severity': by_severity,
            'details': self.anomalies
        }
