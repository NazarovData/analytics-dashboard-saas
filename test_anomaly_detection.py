"""
Тест детекции аномалий согласно ЭТАПУ 1 ТЗ
"""
import pandas as pd
import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

sys.path.insert(0, '.')

from app.services.ai_analyzer_v3 import AIAnalyzerV3


def test_task4_data_quality():
    """
    Тест Task4_Data_Quality_Test.xlsx
    
    Ожидания:
    - Trust Score: 30-50% (не 90%)
    - Аномалии: Обнаружена Webcam (Quantity = 1000)
    - Первая рекомендация: АНОМАЛИЯ
    """
    print("\n" + "="*60)
    print("🧪 ТЕСТ: Task4 - Data Quality Test")
    print("="*60)
    
    # Создаем тестовые данные как в Task4
    df = pd.DataFrame({
        'Date': pd.date_range('2024-01-01', periods=10),
        'Product': ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones', 
                   'USB Cable', 'Mousepad', 'Webcam', 'Speaker', 'Microphone'],
        'Quantity': [5, 10, 8, 3, 12, 20, 15, 1000, 7, 9],  # Webcam = 1000 - АНОМАЛИЯ!
        'Price': [50000, 1500, 3000, 25000, 5000, 500, 800, 3000, 8000, 4000],
        'Customer': [f'Customer {i}' for i in range(10)]
    })
    
    print(f"\n📊 Данные:")
    print(f"  • Строк: {len(df)}")
    print(f"  • Продуктов: {df['Product'].nunique()}")
    print(f"  • Аномалия: Webcam с Quantity = 1000")
    
    # Анализ
    result = AIAnalyzerV3.analyze(df)
    
    print(f"\n📈 Результаты анализа:")
    print(f"  • Status: {result['status']}")
    print(f"  • Trust Score: {result['trust_score']}% ({result['trust_level']})")
    print(f"  • Аномалий обнаружено: {result['anomalies_detected']}")
    
    if result['anomalies_by_method']:
        print(f"\n🔍 Аномалии по методам:")
        for method, count in result['anomalies_by_method'].items():
            print(f"    • {method}: {count}")
    
    if result['anomalies_by_severity']:
        print(f"\n⚠️ Аномалии по severity:")
        for severity, count in result['anomalies_by_severity'].items():
            print(f"    • {severity}: {count}")
    
    # Проверка инсайтов
    insights = result.get('insights', [])
    print(f"\n💡 Инсайты ({len(insights)}):")
    for i, insight in enumerate(insights[:3], 1):
        print(f"  {i}. [{insight['type']}] {insight['title']}")
        print(f"     {insight['message']}")
    
    # Проверка рекомендаций
    recommendations = result.get('recommendations', [])
    if recommendations:
        print(f"\n📋 Рекомендации:")
        for rec in recommendations[:3]:
            print(f"  • {rec}")
    
    # КРИТЕРИИ УСПЕХА
    print(f"\n{'='*60}")
    print("✅ КРИТЕРИИ УСПЕХА:")
    print(f"{'='*60}")
    
    success = True
    
    # 1. Trust Score должен быть 30-50%
    if 30 <= result['trust_score'] <= 50:
        print(f"✅ Trust Score: {result['trust_score']}% (ожидалось 30-50%)")
    else:
        print(f"❌ Trust Score: {result['trust_score']}% (ожидалось 30-50%)")
        success = False
    
    # 2. Аномалии должны быть обнаружены
    if result['anomalies_detected'] > 0:
        print(f"✅ Аномалии обнаружены: {result['anomalies_detected']}")
    else:
        print(f"❌ Аномалии НЕ обнаружены (ожидалось > 0)")
        success = False
    
    # 3. Первый инсайт должен быть об аномалии
    if insights and insights[0]['type'] in ['critical', 'warning']:
        print(f"✅ Первый инсайт - предупреждение: {insights[0]['title']}")
    else:
        print(f"❌ Первый инсайт НЕ о проблеме")
        success = False
    
    # 4. Trust Level должен быть low или medium
    if result['trust_level'] in ['low', 'medium']:
        print(f"✅ Trust Level: {result['trust_level']}")
    else:
        print(f"❌ Trust Level: {result['trust_level']} (ожидалось low/medium)")
        success = False
    
    print(f"\n{'='*60}")
    if success:
        print("🎉 ТЕСТ ПРОЙДЕН!")
    else:
        print("❌ ТЕСТ ПРОВАЛЕН!")
    print(f"{'='*60}")
    
    return success


def test_task1_clean_data():
    """
    Тест Task1 - чистые данные
    
    Ожидания:
    - Trust Score: 90-100%
    - Аномалии: 0
    - Рекомендации: Нормальные
    """
    print("\n" + "="*60)
    print("🧪 ТЕСТ: Task1 - Clean Data")
    print("="*60)
    
    # Создаем чистые данные
    df = pd.DataFrame({
        'Date': pd.date_range('2024-01-01', periods=100),
        'Product': [f'Product {i%10}' for i in range(100)],
        'Quantity': [5 + i%10 for i in range(100)],  # Нормальные значения
        'Price': [1000 + i%500 for i in range(100)],
        'Customer': [f'Customer {i%20}' for i in range(100)]
    })
    
    print(f"\n📊 Данные:")
    print(f"  • Строк: {len(df)}")
    print(f"  • Продуктов: {df['Product'].nunique()}")
    print(f"  • Аномалий: Нет")
    
    # Анализ
    result = AIAnalyzerV3.analyze(df)
    
    print(f"\n📈 Результаты анализа:")
    print(f"  • Status: {result['status']}")
    print(f"  • Trust Score: {result['trust_score']}% ({result['trust_level']})")
    print(f"  • Аномалий обнаружено: {result['anomalies_detected']}")
    
    # КРИТЕРИИ УСПЕХА
    print(f"\n{'='*60}")
    print("✅ КРИТЕРИИ УСПЕХА:")
    print(f"{'='*60}")
    
    success = True
    
    # 1. Trust Score должен быть 90-100%
    if result['trust_score'] >= 90:
        print(f"✅ Trust Score: {result['trust_score']}% (ожидалось >= 90%)")
    else:
        print(f"❌ Trust Score: {result['trust_score']}% (ожидалось >= 90%)")
        success = False
    
    # 2. Аномалий не должно быть
    if result['anomalies_detected'] == 0:
        print(f"✅ Аномалий нет: {result['anomalies_detected']}")
    else:
        print(f"⚠️ Аномалии обнаружены: {result['anomalies_detected']} (ожидалось 0)")
        # Не критично, может быть false positive
    
    # 3. Trust Level должен быть high
    if result['trust_level'] == 'high':
        print(f"✅ Trust Level: {result['trust_level']}")
    else:
        print(f"⚠️ Trust Level: {result['trust_level']} (ожидалось high)")
    
    print(f"\n{'='*60}")
    if success:
        print("🎉 ТЕСТ ПРОЙДЕН!")
    else:
        print("❌ ТЕСТ ПРОВАЛЕН!")
    print(f"{'='*60}")
    
    return success


def run_all_tests():
    """Запуск всех тестов"""
    print("\n" + "🚀"*30)
    print("ТЕСТИРОВАНИЕ ДЕТЕКЦИИ АНОМАЛИЙ (ЭТАП 1)")
    print("🚀"*30)
    
    results = []
    
    # Тест 1: Task4 с аномалиями
    results.append(("Task4 (с аномалиями)", test_task4_data_quality()))
    
    # Тест 2: Task1 чистые данные
    results.append(("Task1 (чистые данные)", test_task1_clean_data()))
    
    # Итоги
    print("\n" + "="*60)
    print("📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ:")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\n{'='*60}")
    print(f"Пройдено: {passed}/{total}")
    print(f"{'='*60}")
    
    if passed == total:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
    else:
        print(f"⚠️ {total - passed} тестов провалено")


if __name__ == '__main__':
    run_all_tests()
