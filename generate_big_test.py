#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор тестовых данных для проверки системы на больших объемах
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys

def generate_test_data(n_rows=1_000_000, filename='test_big_data.csv'):
    """
    Генерирует тестовый CSV файл с заданным количеством строк
    
    Args:
        n_rows: количество строк (по умолчанию 1 миллион)
        filename: имя выходного файла
    """
    print(f"\n{'='*60}")
    print(f"🚀 ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ")
    print(f"{'='*60}")
    print(f"Количество строк: {n_rows:,}")
    print(f"Файл: {filename}")
    print(f"{'='*60}\n")
    
    # Генерация данных
    print("📊 Генерация данных...")
    
    # Даты за последний год
    start_date = datetime(2023, 1, 1)
    dates = [start_date + timedelta(days=i % 365, hours=i % 24) for i in range(n_rows)]
    
    # Товары (1000 уникальных)
    product_names = [
        "Ноутбук", "Смартфон", "Планшет", "Монитор", "Клавиатура", 
        "Мышь", "Наушники", "Колонки", "Веб-камера", "Микрофон",
        "Принтер", "Сканер", "Роутер", "Модем", "Флешка",
        "HDD", "SSD", "RAM", "Видеокарта", "Процессор"
    ]
    products = [f"{np.random.choice(product_names)} {np.random.choice(['Pro', 'Max', 'Ultra', 'Plus', ''])}" 
                for _ in range(n_rows)]
    
    # Суммы (от 100 до 50,000 рублей)
    amounts = np.random.lognormal(mean=7.5, sigma=1.2, size=n_rows).round(2)
    amounts = np.clip(amounts, 100, 50000)  # Ограничиваем диапазон
    
    # Клиенты (10,000 уникальных)
    n_customers = min(10_000, n_rows // 10)  # ~10% уникальных
    customer_ids = np.random.randint(1, n_customers + 1, n_rows)
    customers = [f"Клиент {i}" for i in customer_ids]
    
    print(f"✅ Данные сгенерированы")
    print(f"   - Дат: {len(set(dates)):,}")
    print(f"   - Товаров: {len(set(products)):,}")
    print(f"   - Клиентов: {len(set(customers)):,}")
    
    # Создание DataFrame
    print("📦 Создание DataFrame...")
    df = pd.DataFrame({
        'date': dates,
        'product': products,
        'amount': amounts,
        'customer': customers
    })
    
    # Статистика
    total_revenue = df['amount'].sum()
    print(f"\n{'='*60}")
    print(f"📊 СТАТИСТИКА ДАННЫХ:")
    print(f"{'='*60}")
    print(f"Всего строк: {len(df):,}")
    print(f"Общая выручка: {total_revenue:,.2f} ₽")
    print(f"Средний чек: {df['amount'].mean():,.2f} ₽")
    print(f"Мин. сумма: {df['amount'].min():,.2f} ₽")
    print(f"Макс. сумма: {df['amount'].max():,.2f} ₽")
    print(f"{'='*60}\n")
    
    # Сохранение в CSV
    print(f"💾 Сохранение в {filename}...")
    df.to_csv(filename, index=False, encoding='utf-8')
    
    # Размер файла
    import os
    file_size_mb = os.path.getsize(filename) / (1024 * 1024)
    
    print(f"\n{'='*60}")
    print(f"✅ ФАЙЛ СОЗДАН УСПЕШНО!")
    print(f"{'='*60}")
    print(f"📁 Файл: {filename}")
    print(f"📦 Размер: {file_size_mb:.2f} MB")
    print(f"📊 Строк: {len(df):,}")
    print(f"💰 Ожидаемая выручка: {total_revenue:,.2f} ₽")
    print(f"{'='*60}\n")
    
    print("🚀 Теперь загрузите этот файл в дашборд для проверки!")
    print("📊 После обработки сверьте выручку с ожидаемой")
    print()
    
    return df, total_revenue


if __name__ == "__main__":
    # Параметры по умолчанию
    n_rows = 1_000_000
    
    # Если указан аргумент - используем его
    if len(sys.argv) > 1:
        try:
            n_rows = int(sys.argv[1])
        except ValueError:
            print("❌ Ошибка: укажите число строк")
            print("Пример: python generate_big_test.py 1000000")
            sys.exit(1)
    
    # Имя файла
    filename = f"test_{n_rows//1000}k_rows.csv" if n_rows < 1_000_000 else f"test_{n_rows//1_000_000}M_rows.csv"
    
    # Генерация
    try:
        df, expected_revenue = generate_test_data(n_rows, filename)
        
        # Сохраняем ожидаемую выручку для проверки
        with open(f"{filename}.expected.txt", 'w', encoding='utf-8') as f:
            f.write(f"Ожидаемая выручка: {expected_revenue:,.2f} ₽\n")
            f.write(f"Строк: {n_rows:,}\n")
            f.write(f"Уникальных клиентов: {df['customer'].nunique():,}\n")
        
        print("💡 Создан файл с ожидаемыми значениями для проверки:")
        print(f"   {filename}.expected.txt")
        
    except MemoryError:
        print(f"\n❌ ОШИБКА: Недостаточно памяти для {n_rows:,} строк")
        print(f"💡 Попробуйте меньшее число, например: {n_rows//2:,}")
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        sys.exit(1)





