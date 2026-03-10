"""
Text Parser Service for extracting structured data from OCR text
Парсинг распознанного текста из тетрадей для извлечения структурированных данных
"""
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime as dt_datetime, timedelta
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class NotebookTextParser:
    """Парсер для извлечения данных из текста тетрадей"""
    
    def __init__(self):
        # Паттерны для дат (различные форматы)
        self.date_patterns = [
            r'\d{1,2}[./-]\d{1,2}[./-]\d{2,4}',  # 01.01.2024, 01/01/24
            r'\d{4}[./-]\d{1,2}[./-]\d{1,2}',    # 2024-01-01
            r'\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4}',  # 1 января 2024
            r'\d{1,2}\s+(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)[а-я]*\s+\d{4}',  # 1 янв 2024
        ]
        
        # Паттерны для чисел (цены, количества)
        self.price_patterns = [
            r'\d+[.,]\d+',  # 1000.50, 1000,50
            r'\d+\s*[₽$€]',  # 1000₽, 1000$
            r'\d+\s*(руб|сом|долл|евро)',  # 1000 руб
        ]
        
        # Паттерны для количества
        self.quantity_patterns = [
            r'\d+\s*(шт|кг|г|л|м|шт\.|ед)',  # 10 шт, 5 кг
            r'количество[:\s]+\d+',
            r'кол-во[:\s]+\d+',
        ]
    
    def parse_date(self, text: str) -> Optional[dt_datetime]:
        """
        Извлечение даты из текста
        """
        for pattern in self.date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(0)
                try:
                    # Попробуем различные форматы
                    for fmt in ['%d.%m.%Y', '%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%Y.%m.%d', '%Y/%m/%d']:
                        try:
                            return datetime.strptime(date_str, fmt)
                        except ValueError:
                            continue
                    
                    # Если не получилось, попробуем парсить вручную
                    parts = re.split(r'[./-]', date_str)
                    if len(parts) == 3:
                        if len(parts[2]) == 2:  # Год из 2 цифр
                            parts[2] = '20' + parts[2]
                        return datetime(int(parts[2]), int(parts[1]), int(parts[0]))
                except Exception as e:
                    logger.debug(f"Failed to parse date '{date_str}': {e}")
                    continue
        return None
    
    def parse_price(self, text: str) -> Optional[float]:
        """
        Извлечение цены из текста
        """
        for pattern in self.price_patterns:
            matches = re.findall(pattern, text)
            if matches:
                # Берем последнее найденное число (обычно это итоговая сумма)
                for match in reversed(matches):
                    try:
                        # Очищаем от символов валюты и пробелов
                        price_str = re.sub(r'[₽$€рубсомдоллевро\s]', '', match, flags=re.IGNORECASE)
                        price_str = price_str.replace(',', '.')
                        price = float(price_str)
                        if price > 0:
                            return price
                    except ValueError:
                        continue
        return None
    
    def parse_quantity(self, text: str) -> Optional[float]:
        """
        Извлечение количества из текста
        """
        for pattern in self.quantity_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    # Извлекаем число
                    numbers = re.findall(r'\d+', match.group(0))
                    if numbers:
                        return float(numbers[0])
                except ValueError:
                    continue
        
        # Если не нашли явное количество, ищем просто числа
        numbers = re.findall(r'\b\d+\b', text)
        if numbers:
            # Берем первое разумное число (не слишком большое)
            for num_str in numbers:
                num = float(num_str)
                if 0 < num < 10000:  # Разумный диапазон для количества
                    return num
        return None
    
    def parse_product_name(self, text: str) -> Optional[str]:
        """
        Извлечение названия товара из текста
        """
        # Удаляем даты, числа, служебные слова
        cleaned = text
        
        # Удаляем даты
        for pattern in self.date_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Удаляем цены и количества
        cleaned = re.sub(r'\d+[.,]\d+', '', cleaned)
        cleaned = re.sub(r'\d+\s*[₽$€]', '', cleaned)
        cleaned = re.sub(r'\d+\s*(шт|кг|г|л|м)', '', cleaned, flags=re.IGNORECASE)
        
        # Удаляем служебные слова
        stop_words = ['дата', 'товар', 'цена', 'количество', 'сумма', 'итого', 
                     'date', 'product', 'price', 'quantity', 'total', 'sum']
        for word in stop_words:
            cleaned = re.sub(r'\b' + word + r'\b', '', cleaned, flags=re.IGNORECASE)
        
        # Очищаем от лишних пробелов и символов
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        cleaned = re.sub(r'^[^\w]+|[^\w]+$', '', cleaned)
        
        if len(cleaned) > 2:  # Минимальная длина названия
            return cleaned
        return None
    
    def split_into_lines(self, text: str) -> List[str]:
        """
        Разделение текста на строки (записи)
        """
        lines = text.split('\n')
        # Фильтруем пустые строки и строки без значимого содержимого
        meaningful_lines = []
        for line in lines:
            line = line.strip()
            if len(line) > 3:  # Минимальная длина строки
                # Проверяем, что в строке есть хотя бы одна цифра или буква
                if re.search(r'[а-яА-Яa-zA-Z0-9]', line):
                    meaningful_lines.append(line)
        return meaningful_lines
    
    def parse_notebook_text(self, text: str) -> pd.DataFrame:
        """
        Основная функция для парсинга текста тетради и преобразования в DataFrame
        
        Args:
            text: Распознанный текст из OCR
        
        Returns:
            pd.DataFrame: Структурированные данные
        """
        if not text or len(text.strip()) < 10:
            logger.warning("Text is too short or empty")
            return pd.DataFrame()
        
        lines = self.split_into_lines(text)
        logger.info(f"Parsing {len(lines)} lines from notebook text")
        
        records = []
        current_date = None
        
        for i, line in enumerate(lines):
            record = {}
            
            # Пытаемся найти дату в строке
            date = self.parse_date(line)
            if date:
                current_date = date
                record['date'] = date
            elif current_date:
                record['date'] = current_date
            else:
                # Если даты нет, используем текущую дату
                record['date'] = dt_datetime.now()
            
            # Извлекаем название товара
            product = self.parse_product_name(line)
            if product:
                record['product'] = product
            else:
                # Если не нашли название, используем часть строки
                product_candidate = line[:50].strip()
                if len(product_candidate) > 2:
                    record['product'] = product_candidate
                else:
                    record['product'] = f'Товар {i+1}'
            
            # Извлекаем количество
            quantity = self.parse_quantity(line)
            if quantity:
                record['quantity'] = quantity
            else:
                record['quantity'] = 1.0
            
            # Извлекаем цену
            price = self.parse_price(line)
            if price:
                record['price'] = price
            else:
                # Пытаемся найти числа в строке
                numbers = re.findall(r'\d+[.,]\d+|\d+', line)
                if numbers:
                    try:
                        # Берем последнее большое число как цену
                        for num_str in reversed(numbers):
                            num = float(num_str.replace(',', '.'))
                            if num > 10:  # Разумная минимальная цена
                                record['price'] = num
                                break
                    except ValueError:
                        pass
                
                if 'price' not in record:
                    record['price'] = 0.0
            
            # Рассчитываем сумму
            record['amount'] = record['quantity'] * record['price']
            
            # Добавляем дополнительные поля
            record['client_id'] = f'CLIENT_{i+1}'
            record['order_id'] = f'ORDER_{i+1}'
            
            records.append(record)
        
        if not records:
            logger.warning("No records extracted from text")
            return pd.DataFrame()
        
        # Создаем DataFrame
        df = pd.DataFrame(records)
        
        # Убеждаемся, что дата в правильном формате
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            df['date'] = df['date'].fillna(pd.Timestamp.now())
        
        # Заполняем NaN значения
        df['quantity'] = df['quantity'].fillna(1.0)
        df['price'] = df['price'].fillna(0.0)
        df['amount'] = df['amount'].fillna(0.0)
        df['product'] = df['product'].fillna('Неизвестный товар')
        
        logger.info(f"Parsed {len(df)} records from notebook text")
        logger.debug(f"Columns: {list(df.columns)}")
        logger.debug(f"Sample data:\n{df.head()}")
        
        return df
    
    def parse_text_to_dataframe(self, text: str) -> pd.DataFrame:
        """
        Публичный метод для парсинга текста (алиас для parse_notebook_text)
        """
        return self.parse_notebook_text(text)


# Глобальный экземпляр парсера
_parser_instance = None

def get_parser() -> NotebookTextParser:
    """Получить экземпляр парсера (singleton)"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = NotebookTextParser()
    return _parser_instance


def parse_notebook_text(text: str) -> pd.DataFrame:
    """
    Удобная функция для парсинга текста тетради
    
    Args:
        text: Распознанный текст из OCR
    
    Returns:
        pd.DataFrame: Структурированные данные
    """
    parser = get_parser()
    return parser.parse_notebook_text(text)



