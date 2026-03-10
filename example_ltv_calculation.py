"""
Пример расчета LTV, CAC и Unit Economics
Запуск: python example_ltv_calculation.py
"""
from datetime import datetime, timedelta
import random
import json

# Импортируем наш сервис
from app.services.business_model import BusinessModel


def generate_demo_data(num_clients=50, days_back=365):
    """Генерация демо-данных о транзакциях"""
    print("📊 Генерация демо-данных...")
    
    transactions = []
    start_date = datetime.now() - timedelta(days=days_back)
    
    for client_num in range(1, num_clients + 1):
        client_id = f"Client_{client_num:03d}"
        
        # Каждый клиент делает от 1 до 10 покупок
        num_orders = random.randint(1, 10)
        
        for order_num in range(num_orders):
            # Случайная дата в течение года
            order_date = start_date + timedelta(days=random.randint(0, days_back))
            
            # Случайная выручка от 500 до 5000 рублей
            revenue = random.uniform(500, 5000)
            
            # Себестоимость 50-70% от выручки
            cost = revenue * random.uniform(0.5, 0.7)
            
            transactions.append({
                'client_id': client_id,
                'price': round(revenue, 2),
                'cost': round(cost, 2),
                'date': order_date.strftime('%Y-%m-%d')
            })
    
    print(f"✅ Создано {len(transactions)} транзакций для {num_clients} клиентов")
    return transactions


def print_section(title):
    """Красивый вывод заголовка секции"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70 + "\n")


def main():
    print("\n🚀 ДЕМОНСТРАЦИЯ РАСЧЕТА БИЗНЕС-МЕТРИК\n")
    
    # 1. Генерируем данные
    transactions = generate_demo_data(num_clients=50, days_back=365)
    
    # Показываем примеры транзакций
    print("\n📋 Примеры транзакций:")
    for i, trans in enumerate(transactions[:5], 1):
        print(f"  {i}. {trans['client_id']}: {trans['price']}₽ (себестоимость: {trans['cost']}₽) - {trans['date']}")
    print(f"  ... и еще {len(transactions) - 5} транзакций\n")
    
    # 2. Расчет LTV
    print_section("💰 РАСЧЕТ LTV (LIFETIME VALUE)")
    
    ltv_result = BusinessModel.calculate_precise_ltv(
        df_data=transactions,
        client_column='client_id',
        revenue_column='price',
        date_column='date',
        cost_column='cost',
        period_months=12
    )
    
    if ltv_result['success']:
        print(f"📊 ОСНОВНЫЕ МЕТРИКИ LTV:")
        print(f"  • Итоговый LTV: {ltv_result['ltv']:,.2f}₽")
        print(f"  • Простой LTV: {ltv_result['simple_ltv']:,.2f}₽")
        print(f"  • LTV с маржой: {ltv_result['ltv_with_margin']:,.2f}₽")
        print(f"  • Прогнозный LTV: {ltv_result['predictive_ltv']:,.2f}₽")
        print(f"  • Когортный LTV: {ltv_result['cohort_ltv']:,.2f}₽")
        print(f"  • Годовой LTV: {ltv_result['yearly_ltv']:,.2f}₽")
        
        print(f"\n👥 КЛИЕНТЫ:")
        print(f"  • Всего клиентов: {ltv_result['total_clients']}")
        print(f"  • Активных: {ltv_result['active_clients']}")
        print(f"  • Ушедших: {ltv_result['churned_clients']}")
        
        print(f"\n💵 ВЫРУЧКА И ПРИБЫЛЬ:")
        print(f"  • Общая выручка: {ltv_result['total_revenue']:,.2f}₽")
        print(f"  • Себестоимость: {ltv_result['total_cost']:,.2f}₽")
        print(f"  • Валовая прибыль: {ltv_result['gross_profit']:,.2f}₽")
        print(f"  • Валовая маржа: {ltv_result['gross_margin_percent']:.2f}%")
        
        print(f"\n📈 СРЕДНИЕ ЗНАЧЕНИЯ:")
        print(f"  • ARPU (средняя выручка на клиента): {ltv_result['arpu']:,.2f}₽")
        print(f"  • Средний чек: {ltv_result['average_order_value']:,.2f}₽")
        print(f"  • Покупок на клиента: {ltv_result['orders_per_client']:.2f}")
        print(f"  • Частота покупок в месяц: {ltv_result['purchase_frequency_per_month']:.2f}")
        
        print(f"\n🔄 RETENTION & CHURN:")
        print(f"  • Retention Rate: {ltv_result['retention_rate']:.2f}%")
        print(f"  • Churn Rate: {ltv_result['churn_rate']:.2f}%")
        print(f"  • Средняя продолжительность жизни: {ltv_result['avg_lifespan_days']:.1f} дней ({ltv_result['avg_lifespan_months']:.1f} мес)")
        
        print(f"\n🎯 СЕГМЕНТАЦИЯ КЛИЕНТОВ:")
        for segment_name, segment_data in ltv_result['segments'].items():
            print(f"  • {segment_name.upper()}:")
            print(f"    - Клиентов: {segment_data['count']} ({segment_data['percent']:.1f}%)")
            print(f"    - Выручка: {segment_data['revenue']:,.2f}₽")
            print(f"    - Средний LTV: {segment_data['avg_ltv']:,.2f}₽")
        
        print(f"\n💡 РЕКОМЕНДАЦИИ:")
        for rec in ltv_result['recommendations']:
            print(f"  {rec}")
    
    # 3. Расчет CAC
    print_section("💸 РАСЧЕТ CAC (CUSTOMER ACQUISITION COST)")
    
    # Предположим, что мы потратили 150,000₽ на маркетинг и привлекли 50 клиентов
    marketing_spend = 150000
    new_customers = ltv_result['total_clients']
    
    cac_result = BusinessModel.calculate_cac(
        marketing_spend=marketing_spend,
        new_customers=new_customers
    )
    
    if cac_result['success']:
        print(f"📊 CAC МЕТРИКИ:")
        print(f"  • CAC (стоимость привлечения): {cac_result['cac']:,.2f}₽")
        print(f"  • Маркетинговые расходы: {cac_result['marketing_spend']:,.2f}₽")
        print(f"  • Привлечено клиентов: {cac_result['new_customers']}")
        
        print(f"\n📊 БЕНЧМАРКИ ПО ИНДУСТРИЯМ:")
        for industry, benchmarks in cac_result['benchmarks'].items():
            print(f"  • {industry.upper()}:")
            print(f"    - Низкий: {benchmarks['low']}₽")
            print(f"    - Средний: {benchmarks['avg']}₽")
            print(f"    - Высокий: {benchmarks['high']}₽")
    
    # 4. Unit Economics
    print_section("🎯 UNIT ECONOMICS (ЮНИТ-ЭКОНОМИКА)")
    
    unit_econ = BusinessModel.calculate_unit_economics(
        ltv=ltv_result['ltv'],
        cac=cac_result['cac'],
        gross_margin_percent=ltv_result['gross_margin_percent'],
        avg_lifespan_months=ltv_result['avg_lifespan_months']
    )
    
    print(f"📊 КЛЮЧЕВЫЕ МЕТРИКИ:")
    print(f"  • LTV: {unit_econ['ltv']:,.2f}₽")
    print(f"  • CAC: {unit_econ['cac']:,.2f}₽")
    print(f"  • LTV/CAC Ratio: {unit_econ['ltv_cac_ratio']:.2f}")
    print(f"  • Payback Period: {unit_econ['payback_months']:.1f} месяцев")
    print(f"  • Прибыль с клиента: {unit_econ['customer_profit']:,.2f}₽")
    print(f"  • ROI на клиента: {unit_econ['customer_roi']:.1f}%")
    print(f"  • Валовая маржа: {unit_econ['gross_margin_percent']:.2f}%")
    
    print(f"\n🏥 ЗДОРОВЬЕ БИЗНЕСА:")
    print(f"  • Статус: {unit_econ['health_status'].upper()}")
    print(f"  • {unit_econ['health_message']}")
    
    print(f"\n💡 РЕКОМЕНДАЦИИ:")
    for rec in unit_econ['recommendations']:
        print(f"  {rec}")
    
    # 5. Итоговая оценка
    print_section("📋 ИТОГОВАЯ ОЦЕНКА БИЗНЕСА")
    
    # Оценка по LTV/CAC
    if unit_econ['ltv_cac_ratio'] >= 3:
        ltv_cac_grade = "🌟 ОТЛИЧНО"
    elif unit_econ['ltv_cac_ratio'] >= 2:
        ltv_cac_grade = "✅ ХОРОШО"
    elif unit_econ['ltv_cac_ratio'] >= 1:
        ltv_cac_grade = "⚠️ ПРИЕМЛЕМО"
    else:
        ltv_cac_grade = "🚨 ПЛОХО"
    
    # Оценка по Payback
    if unit_econ['payback_months'] <= 6:
        payback_grade = "🌟 ОТЛИЧНО"
    elif unit_econ['payback_months'] <= 12:
        payback_grade = "✅ ХОРОШО"
    elif unit_econ['payback_months'] <= 18:
        payback_grade = "⚠️ ПРИЕМЛЕМО"
    else:
        payback_grade = "🚨 ПЛОХО"
    
    # Оценка по Churn
    if ltv_result['churn_rate'] <= 15:
        churn_grade = "🌟 ОТЛИЧНО"
    elif ltv_result['churn_rate'] <= 30:
        churn_grade = "✅ ХОРОШО"
    elif ltv_result['churn_rate'] <= 45:
        churn_grade = "⚠️ ПРИЕМЛЕМО"
    else:
        churn_grade = "🚨 ПЛОХО"
    
    print(f"📊 ОЦЕНКИ:")
    print(f"  • LTV/CAC Ratio ({unit_econ['ltv_cac_ratio']:.2f}): {ltv_cac_grade}")
    print(f"  • Payback Period ({unit_econ['payback_months']:.1f} мес): {payback_grade}")
    print(f"  • Churn Rate ({ltv_result['churn_rate']:.1f}%): {churn_grade}")
    
    # Общая оценка
    grades = [ltv_cac_grade, payback_grade, churn_grade]
    excellent_count = sum(1 for g in grades if "ОТЛИЧНО" in g)
    good_count = sum(1 for g in grades if "ХОРОШО" in g)
    
    if excellent_count >= 2:
        overall = "🌟 ОТЛИЧНЫЙ БИЗНЕС - Можно масштабировать!"
    elif excellent_count + good_count >= 2:
        overall = "✅ ХОРОШИЙ БИЗНЕС - Продолжайте улучшать метрики"
    else:
        overall = "⚠️ ТРЕБУЕТСЯ ОПТИМИЗАЦИЯ - Фокус на улучшении ключевых метрик"
    
    print(f"\n🎯 ОБЩАЯ ОЦЕНКА: {overall}")
    
    # 6. Следующие шаги
    print_section("🚀 СЛЕДУЮЩИЕ ШАГИ")
    
    print("1️⃣ КРАТКОСРОЧНЫЕ (1-3 месяца):")
    if ltv_result['churn_rate'] > 30:
        print("  • Запустить реактивационную кампанию для снижения churn")
    if unit_econ['ltv_cac_ratio'] < 3:
        print("  • Оптимизировать рекламные кампании для снижения CAC")
    if ltv_result['orders_per_client'] < 2:
        print("  • Внедрить email-маркетинг для повторных покупок")
    
    print("\n2️⃣ СРЕДНЕСРОЧНЫЕ (3-6 месяцев):")
    print("  • Запустить программу лояльности")
    print("  • A/B тестирование для повышения конверсии")
    print("  • Сегментация клиентов и персонализация")
    
    print("\n3️⃣ ДОЛГОСРОЧНЫЕ (6-12 месяцев):")
    if unit_econ['ltv_cac_ratio'] >= 3:
        print("  • Масштабирование маркетинга (юнит-экономика позволяет)")
    print("  • Внедрение подписочной модели")
    print("  • Развитие VIP-программы для топ-клиентов")
    
    print("\n" + "="*70)
    print("✅ Анализ завершен!")
    print("="*70 + "\n")
    
    # Сохраняем результаты в JSON
    results = {
        'ltv': ltv_result,
        'cac': cac_result,
        'unit_economics': unit_econ,
        'overall_grade': overall
    }
    
    with open('ltv_analysis_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("💾 Результаты сохранены в файл: ltv_analysis_results.json\n")


if __name__ == "__main__":
    main()
