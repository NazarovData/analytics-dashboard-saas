"""
Тест определения уникальных клиентов
"""
import pandas as pd
import sys
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Добавляем путь к модулям
sys.path.insert(0, '.')

from app.services.ai_analyzer_v3 import ColumnDetector, MetricsCalculator

def test_customer_detection():
    """Тест определения клиентов в разных форматах"""
    
    print("="*60)
    print("🧪 ТЕСТ ОПРЕДЕЛЕНИЯ УНИКАЛЬНЫХ КЛИЕНТОВ")
    print("="*60)
    
    # Тест 1: Колонка Customer
    print("\n📊 Тест 1: Колонка 'Customer'")
    df1 = pd.DataFrame({
        'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
        'Customer': ['Alice', 'Bob', 'Alice'],
        'Revenue': [100, 200, 150]
    })
    
    cols1 = ColumnDetector.detect_columns(df1)
    print(f"Найденные колонки: {cols1}")
    
    if cols1['customer']:
        unique = df1[cols1['customer']].nunique()
        print(f"✅ Уникальных клиентов: {unique}")
    else:
        print("❌ Колонка Customer не найдена!")
    
    # Тест 2: Колонка Sales Rep
    print("\n📊 Тест 2: Колонка 'Sales Rep'")
    df2 = pd.DataFrame({
        'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
        'Sales Rep': ['Alice', 'Bob', 'Alice'],
        'Revenue': [100, 200, 150]
    })
    
    cols2 = ColumnDetector.detect_columns(df2)
    print(f"Найденные колонки: {cols2}")
    
    if cols2['customer']:
        unique = df2[cols2['customer']].nunique()
        print(f"✅ Уникальных клиентов: {unique}")
    else:
        print("❌ Колонка Sales Rep не найдена!")
    
    # Тест 3: Колонка Client
    print("\n📊 Тест 3: Колонка 'Client'")
    df3 = pd.DataFrame({
        'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
        'Client': ['Alice', 'Bob', 'Charlie'],
        'Revenue': [100, 200, 150]
    })
    
    cols3 = ColumnDetector.detect_columns(df3)
    print(f"Найденные колонки: {cols3}")
    
    if cols3['customer']:
        unique = df3[cols3['customer']].nunique()
        print(f"✅ Уникальных клиентов: {unique}")
    else:
        print("❌ Колонка Client не найдена!")
    
    # Тест 4: Полный расчет метрик
    print("\n📊 Тест 4: Полный расчет метрик")
    df4 = pd.DataFrame({
        'Date': ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
        'Customer': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eric'],
        'Product': ['Widget A', 'Widget B', 'Widget A', 'Widget C', 'Widget B'],
        'Revenue': [1000, 2000, 1500, 3000, 2500],
        'Cost': [600, 1200, 900, 1800, 1500]
    })
    
    cols4 = ColumnDetector.detect_columns(df4)
    metrics = MetricsCalculator.calculate_safe(df4, cols4)
    
    print(f"\n📈 Результаты анализа:")
    print(f"  💰 Выручка: {metrics.get('total_revenue', 0):,.0f}₽")
    print(f"  💸 Себестоимость: {metrics.get('total_cost', 0):,.0f}₽")
    print(f"  💵 Прибыль: {metrics.get('total_profit', 0):,.0f}₽")
    print(f"  📊 Маржа: {metrics.get('margin_percent', 0):.1f}%")
    print(f"  📦 Заказов: {metrics.get('total_orders', 0)}")
    print(f"  👥 Уникальных клиентов: {metrics.get('unique_customers', 'N/A')}")
    print(f"  🧾 Средний чек: {metrics.get('average_check', 0):,.0f}₽")
    
    if metrics.get('errors'):
        print(f"\n❌ Ошибки:")
        for error in metrics['errors']:
            print(f"  {error}")
    
    if metrics.get('warnings'):
        print(f"\n⚠️ Предупреждения:")
        for warning in metrics['warnings']:
            print(f"  {warning}")
    
    print("\n" + "="*60)
    print("✅ Тест завершен!")
    print("="*60)

if __name__ == '__main__':
    test_customer_detection()
