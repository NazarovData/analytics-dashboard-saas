"""
Полный тест системы обработки данных и качества
"""
import pandas as pd
import sys
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

sys.path.insert(0, '.')

from app.services.data_processor import DataProcessor
from app.services.anomaly_detector import AnomalyDetector
from app.services.trust_score import TrustScoreCalculator
from app.services.quality_report import QualityReportGenerator


def test_scenario_1_perfect_data():
    """Тест 1: Идеальные данные"""
    print("\n" + "="*60)
    print("🧪 ТЕСТ 1: Идеальные данные")
    print("="*60)
    
    df = pd.DataFrame({
        'Date': pd.date_range('2024-01-01', periods=100),
        'Product': [f'Product {i%10}' for i in range(100)],
        'Quantity': [10 + i%20 for i in range(100)],
        'Price': [100 + i%50 for i in range(100)],
        'Customer': [f'Customer {i%20}' for i in range(100)]
    })
    
    # Обработка
    processor = DataProcessor()
    cleaned_df, proc_report = processor.process(df)
    
    # Детекция аномалий
    detector = AnomalyDetector()
    cleaned_df, anomaly_report = detector.detect_all(cleaned_df)
    anomaly_summary = detector.get_anomaly_summary()
    
    # Trust Score
    trust_calc = TrustScoreCalculator()
    metrics = {'total_revenue': 150000, 'total_orders': 100, 'unique_customers': 20}
    trust_score = trust_calc.calculate(cleaned_df, [], [], [], metrics)
    
    # Отчет
    report_gen = QualityReportGenerator()
    full_report = report_gen.generate(df, cleaned_df, proc_report, anomaly_summary, trust_score)
    
    print(report_gen.generate_text_report(full_report))
    
    assert trust_score['score'] >= 90, f"Trust Score должен быть >= 90%, получено {trust_score['score']}%"
    print("✅ Тест 1 пройден!")


def test_scenario_2_negative_values():
    """Тест 2: Отрицательные значения"""
    print("\n" + "="*60)
    print("🧪 ТЕСТ 2: Отрицательные значения")
    print("="*60)
    
    df = pd.DataFrame({
        'Date': pd.date_range('2024-01-01', periods=50),
        'Product': [f'Product {i}' for i in range(50)],
        'Quantity': [-5 if i % 10 == 0 else 10 for i in range(50)],  # 5 отрицательных
        'Price': [-100 if i % 15 == 0 else 100 for i in range(50)],  # 3 отрицательных
        'Customer': [f'Customer {i%10}' for i in range(50)]
    })
    
    processor = DataProcessor()
    cleaned_df, proc_report = processor.process(df)
    
    detector = AnomalyDetector()
    cleaned_df, anomaly_report = detector.detect_all(cleaned_df)
    anomaly_summary = detector.get_anomaly_summary()
    
    trust_calc = TrustScoreCalculator()
    metrics = {'total_revenue': 50000, 'total_orders': 50, 'unique_customers': 10}
    trust_score = trust_calc.calculate(cleaned_df, [], proc_report['warnings'], [], metrics)
    
    report_gen = QualityReportGenerator()
    full_report = report_gen.generate(df, cleaned_df, proc_report, anomaly_summary, trust_score)
    
    print(report_gen.generate_text_report(full_report))
    
    # Проверка что отрицательные значения заменены на 0
    assert (cleaned_df['Quantity'] >= 0).all(), "Все Quantity должны быть >= 0"
    assert (cleaned_df['Price'] >= 0).all(), "Все Price должны быть >= 0"
    assert len(proc_report['warnings']) > 0, "Должны быть предупреждения"
    print("✅ Тест 2 пройден!")


def test_scenario_3_null_values():
    """Тест 3: NULL значения"""
    print("\n" + "="*60)
    print("🧪 ТЕСТ 3: NULL значения (50%)")
    print("="*60)
    
    df = pd.DataFrame({
        'Date': [pd.Timestamp('2024-01-01') if i % 2 == 0 else None for i in range(100)],
        'Product': [f'Product {i}' if i % 2 == 0 else None for i in range(100)],
        'Quantity': [10 if i % 2 == 0 else None for i in range(100)],
        'Price': [100 if i % 2 == 0 else None for i in range(100)],
        'Customer': [f'Customer {i%10}' if i % 2 == 0 else None for i in range(100)]
    })
    
    processor = DataProcessor()
    cleaned_df, proc_report = processor.process(df)
    
    detector = AnomalyDetector()
    cleaned_df, anomaly_report = detector.detect_all(cleaned_df)
    anomaly_summary = detector.get_anomaly_summary()
    
    trust_calc = TrustScoreCalculator()
    metrics = {'total_revenue': 25000, 'total_orders': 50, 'unique_customers': 10}
    trust_score = trust_calc.calculate(cleaned_df, [], proc_report['warnings'], [], metrics)
    
    report_gen = QualityReportGenerator()
    full_report = report_gen.generate(df, cleaned_df, proc_report, anomaly_summary, trust_score)
    
    print(report_gen.generate_text_report(full_report))
    
    assert trust_score['score'] < 70, f"Trust Score должен быть < 70% при 50% NULL, получено {trust_score['score']}%"
    print("✅ Тест 3 пройден!")


def test_scenario_4_anomalies():
    """Тест 4: Аномалии"""
    print("\n" + "="*60)
    print("🧪 ТЕСТ 4: Аномалии (выбросы)")
    print("="*60)
    
    df = pd.DataFrame({
        'Date': pd.date_range('2024-01-01', periods=100),
        'Product': [f'Product {i}' for i in range(100)],
        'Quantity': [10 if i < 95 else 10000 for i in range(100)],  # 5 выбросов
        'Price': [100 if i < 98 else 5000000 for i in range(100)],  # 2 выброса
        'Customer': [f'Customer {i%20}' for i in range(100)]
    })
    
    processor = DataProcessor()
    cleaned_df, proc_report = processor.process(df)
    
    detector = AnomalyDetector()
    cleaned_df, anomaly_report = detector.detect_all(cleaned_df)
    anomaly_summary = detector.get_anomaly_summary()
    
    trust_calc = TrustScoreCalculator()
    metrics = {'total_revenue': 150000, 'total_orders': 100, 'unique_customers': 20}
    trust_score = trust_calc.calculate(cleaned_df, [], [], anomaly_summary['details'], metrics)
    
    report_gen = QualityReportGenerator()
    full_report = report_gen.generate(df, cleaned_df, proc_report, anomaly_summary, trust_score)
    
    print(report_gen.generate_text_report(full_report))
    
    assert anomaly_summary['total_anomalies'] > 0, "Должны быть обнаружены аномалии"
    assert '_anomaly_score' in cleaned_df.columns, "Должна быть колонка с anomaly score"
    print("✅ Тест 4 пройден!")


def test_scenario_5_invalid_dates():
    """Тест 5: Невалидные даты"""
    print("\n" + "="*60)
    print("🧪 ТЕСТ 5: Невалидные даты")
    print("="*60)
    
    df = pd.DataFrame({
        'Date': ['2024-01-01', '01.02.2024', '03/15/2024', 'invalid', '2024-05-01'],
        'Product': ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
        'Quantity': [10, 20, 30, 40, 50],
        'Price': [100, 200, 300, 400, 500],
        'Customer': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eric']
    })
    
    processor = DataProcessor()
    cleaned_df, proc_report = processor.process(df)
    
    detector = AnomalyDetector()
    cleaned_df, anomaly_report = detector.detect_all(cleaned_df)
    anomaly_summary = detector.get_anomaly_summary()
    
    trust_calc = TrustScoreCalculator()
    metrics = {'total_revenue': 15000, 'total_orders': 5, 'unique_customers': 5}
    trust_score = trust_calc.calculate(cleaned_df, [], proc_report['warnings'], [], metrics)
    
    report_gen = QualityReportGenerator()
    full_report = report_gen.generate(df, cleaned_df, proc_report, anomaly_summary, trust_score)
    
    print(report_gen.generate_text_report(full_report))
    
    # Проверка что даты обработаны
    date_warnings = [w for w in proc_report['warnings'] if w.get('type') == 'date']
    assert len(date_warnings) > 0, "Должны быть предупреждения о датах"
    print("✅ Тест 5 пройден!")


def run_all_tests():
    """Запуск всех тестов"""
    print("\n" + "🚀"*30)
    print("ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ СИСТЕМЫ КАЧЕСТВА ДАННЫХ")
    print("🚀"*30)
    
    tests = [
        test_scenario_1_perfect_data,
        test_scenario_2_negative_values,
        test_scenario_3_null_values,
        test_scenario_4_anomalies,
        test_scenario_5_invalid_dates
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"❌ Тест провален: {e}")
    
    print("\n" + "="*60)
    print(f"📊 РЕЗУЛЬТАТЫ: {passed} пройдено, {failed} провалено")
    print("="*60)
    
    if failed == 0:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
    else:
        print(f"⚠️ {failed} тестов провалено")


if __name__ == '__main__':
    run_all_tests()
