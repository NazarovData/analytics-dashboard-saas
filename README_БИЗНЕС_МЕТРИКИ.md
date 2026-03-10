# 💰 Бизнес-метрики и LTV - Новая функциональность

## 🎯 Что добавлено

В проект добавлена **продвинутая система расчета бизнес-метрик** с точными формулами и методологией.

### ✨ Ключевые возможности:

#### 1. **Точный расчет LTV (Lifetime Value)**
- 4 метода расчета (простой, с маржой, прогнозный, когортный)
- Учет retention rate и churn rate
- Сегментация клиентов (VIP, High, Medium, Low)
- Прогноз годового LTV

#### 2. **CAC (Customer Acquisition Cost)**
- Расчет стоимости привлечения клиента
- Бенчмарки по индустриям
- Сравнение с конкурентами

#### 3. **Unit Economics (Юнит-экономика)**
- LTV/CAC Ratio (должен быть > 3)
- Payback Period (срок окупаемости)
- Customer Profitability
- Customer ROI
- Оценка здоровья бизнеса

#### 4. **Дополнительные метрики**
- ARPU (Average Revenue Per User)
- Gross Margin (валовая маржа)
- Retention Rate / Churn Rate
- Purchase Frequency
- Customer Lifespan

---

## 🚀 Быстрый старт

### Вариант 1: Python скрипт (рекомендуется для первого знакомства)

```bash
# Активируйте виртуальное окружение
.\venv\Scripts\activate

# Запустите демо-анализ
python example_ltv_calculation.py
```

**Что произойдет:**
- Сгенерируются демо-данные (50 клиентов, 365 дней транзакций)
- Рассчитается точный LTV всеми методами
- Покажется CAC и Unit Economics
- Дастся оценка здоровья бизнеса
- Результаты сохранятся в `ltv_analysis_results.json`

### Вариант 2: API endpoints

```bash
# 1. Запустите сервер
.\ЗАПУСК.bat

# 2. Откройте Swagger UI
http://localhost:8000/docs

# 3. Найдите секцию "business-metrics"
```

**Доступные endpoints:**
- `GET /api/v1/business/ltv/demo` - Демо с примером
- `POST /api/v1/business/ltv/calculate` - Расчет LTV
- `POST /api/v1/business/cac/calculate` - Расчет CAC
- `POST /api/v1/business/unit-economics/calculate` - Unit Economics
- `GET /api/v1/business/business-health` - Здоровье бизнеса
- `GET /api/v1/business/benchmarks` - Бенчмарки по индустриям
- `GET /api/v1/business/formulas` - Справочник формул

---

## 📊 Пример результата

```
💰 РАСЧЕТ LTV (LIFETIME VALUE)

📊 ОСНОВНЫЕ МЕТРИКИ LTV:
  • Итоговый LTV: 15,234.50₽
  • Простой LTV: 9,500.00₽
  • LTV с маржой: 3,800.00₽
  • Прогнозный LTV: 19,000.00₽
  • Когортный LTV: 18,903.00₽
  • Годовой LTV: 114,000.00₽

👥 КЛИЕНТЫ:
  • Всего клиентов: 50
  • Активных: 38
  • Ушедших: 12

💵 ВЫРУЧКА И ПРИБЫЛЬ:
  • Общая выручка: 475,000.00₽
  • Себестоимость: 285,000.00₽
  • Валовая прибыль: 190,000.00₽
  • Валовая маржа: 40.00%

🔄 RETENTION & CHURN:
  • Retention Rate: 76.00%
  • Churn Rate: 24.00%

🎯 UNIT ECONOMICS:
  • LTV/CAC Ratio: 5.00
  • Payback Period: 6.0 месяцев
  • Прибыль с клиента: 12,000.00₽
  • Customer ROI: 400.0%

🏥 ЗДОРОВЬЕ БИЗНЕСА:
  • Статус: EXCELLENT
  • 🌟 Отличная юнит-экономика! Бизнес масштабируемый.
```

---

## 📈 Формулы

### LTV (Lifetime Value)

**Когортный LTV (самый точный):**
```
LTV = AOV × Purchase Frequency × Customer Lifespan × Gross Margin

где:
- AOV = Average Order Value (средний чек)
- Purchase Frequency = частота покупок в месяц
- Customer Lifespan = средняя продолжительность жизни клиента
- Gross Margin = валовая маржа
```

### CAC (Customer Acquisition Cost)
```
CAC = Маркетинговые расходы / Количество новых клиентов
```

### LTV/CAC Ratio
```
LTV/CAC Ratio = LTV / CAC

Оценка:
- < 1: Убыточно
- 1-2: Окупается
- 2-3: Прибыльно
- > 3: Очень прибыльно (можно масштабировать)
```

### Payback Period
```
Payback = CAC / (Monthly Revenue per Customer × Gross Margin)

Цель: < 12 месяцев
```

---

## 🎯 Бенчмарки по индустриям

### E-commerce
- LTV: 5,000 - 50,000₽
- CAC: 30 - 150₽
- LTV/CAC: 2 - 5
- Churn: 15 - 40%

### SaaS
- LTV: 10,000 - 100,000₽
- CAC: 100 - 1,000₽
- LTV/CAC: 3 - 10
- Churn: 5 - 20%

### Retail
- LTV: 2,000 - 25,000₽
- CAC: 10 - 80₽
- LTV/CAC: 2 - 8
- Churn: 20 - 50%

### B2B
- LTV: 20,000 - 300,000₽
- CAC: 500 - 10,000₽
- LTV/CAC: 3 - 15
- Churn: 5 - 25%

---

## 💡 Как использовать в своем коде

```python
from app.services.business_model import BusinessModel

# Ваши данные о транзакциях
transactions = [
    {'client_id': 'C001', 'price': 5000, 'cost': 3000, 'date': '2024-01-15'},
    {'client_id': 'C001', 'price': 7000, 'cost': 4200, 'date': '2024-02-20'},
    {'client_id': 'C002', 'price': 3000, 'cost': 1800, 'date': '2024-01-10'},
]

# Расчет LTV
ltv_result = BusinessModel.calculate_precise_ltv(
    df_data=transactions,
    client_column='client_id',
    revenue_column='price',
    date_column='date',
    cost_column='cost',
    period_months=12
)

print(f"LTV: {ltv_result['ltv']:,.2f}₽")
print(f"Churn Rate: {ltv_result['churn_rate']:.1f}%")
print(f"Segments: {ltv_result['segments']}")

# Расчет CAC
cac_result = BusinessModel.calculate_cac(
    marketing_spend=150000,
    new_customers=50
)

print(f"CAC: {cac_result['cac']:,.2f}₽")

# Unit Economics
unit_econ = BusinessModel.calculate_unit_economics(
    ltv=ltv_result['ltv'],
    cac=cac_result['cac'],
    gross_margin_percent=ltv_result['gross_margin_percent'],
    avg_lifespan_months=ltv_result['avg_lifespan_months']
)

print(f"LTV/CAC Ratio: {unit_econ['ltv_cac_ratio']:.2f}")
print(f"Health: {unit_econ['health_message']}")
```

---

## 📚 Документация

### Основные файлы:
- **`БИЗНЕС_МОДЕЛЬ_И_LTV.md`** - Полная документация с формулами и примерами
- **`ЗАПУСК_LTV_АНАЛИЗА.md`** - Быстрый старт и инструкции
- **`example_ltv_calculation.py`** - Рабочий пример с демо-данными

### Код:
- **`app/services/business_model.py`** - Бизнес-логика и расчеты
- **`app/api/v1/business_metrics.py`** - API endpoints

---

## 🎓 Что дальше?

### 1. Попробуйте демо:
```bash
python example_ltv_calculation.py
```

### 2. Изучите документацию:
```bash
# Откройте в браузере
БИЗНЕС_МОДЕЛЬ_И_LTV.md
```

### 3. Интегрируйте в свой проект:
- Подключите реальные данные о транзакциях
- Настройте маппинг колонок
- Добавьте данные о маркетинговых расходах

### 4. Создайте дашборд:
- Визуализация LTV по сегментам
- Графики трендов LTV/CAC
- Алерты при ухудшении метрик

---

## ✅ Преимущества

✨ **Точность:** 4 метода расчета LTV для максимальной точности

📊 **Полнота:** Все ключевые метрики (LTV, CAC, Unit Economics, Churn, ARPU)

🎯 **Сегментация:** Автоматическое разделение клиентов на VIP, High, Medium, Low

💡 **Рекомендации:** Персональные советы по улучшению метрик

📈 **Бенчмарки:** Сравнение с индустриальными стандартами

🚀 **Готово к использованию:** API endpoints и Python библиотека

---

## 🤝 Поддержка

Вопросы? Проблемы? 

1. Изучите документацию: `БИЗНЕС_МОДЕЛЬ_И_LTV.md`
2. Запустите пример: `python example_ltv_calculation.py`
3. Проверьте Swagger UI: `http://localhost:8000/docs`

---

**Создано для AnalitixAI** 🚀
