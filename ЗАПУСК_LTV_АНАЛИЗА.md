# 🚀 Быстрый запуск анализа LTV

## Вариант 1: Через Python скрипт (локально)

```bash
# Активируйте виртуальное окружение
.\venv\Scripts\activate

# Запустите пример
python example_ltv_calculation.py
```

Скрипт:
- Сгенерирует демо-данные (50 клиентов, 365 дней)
- Рассчитает точный LTV всеми методами
- Покажет CAC и Unit Economics
- Даст оценку здоровья бизнеса
- Сохранит результаты в `ltv_analysis_results.json`

---

## Вариант 2: Через API (с запущенным сервером)

### 1. Запустите сервер:
```bash
.\ЗАПУСК.bat
```

### 2. Откройте Swagger UI:
```
http://localhost:8000/docs
```

### 3. Найдите секцию "business-metrics"

### 4. Попробуйте endpoints:

#### Демо-данные:
```
GET /api/v1/business/ltv/demo
```

#### Расчет LTV:
```
POST /api/v1/business/ltv/calculate
```

Пример тела запроса:
```json
{
  "data": [
    {"client_id": "C001", "price": 5000, "cost": 3000, "date": "2024-01-15"},
    {"client_id": "C001", "price": 7000, "cost": 4200, "date": "2024-02-20"},
    {"client_id": "C002", "price": 3000, "cost": 1800, "date": "2024-01-10"}
  ],
  "client_column": "client_id",
  "revenue_column": "price",
  "date_column": "date",
  "cost_column": "cost",
  "period_months": 12
}
```

#### Расчет CAC:
```
POST /api/v1/business/cac/calculate
```

```json
{
  "marketing_spend": 150000,
  "new_customers": 50
}
```

#### Unit Economics:
```
POST /api/v1/business/unit-economics/calculate
```

```json
{
  "ltv": 15000,
  "cac": 3000,
  "gross_margin_percent": 40,
  "avg_lifespan_months": 12
}
```

#### Здоровье бизнеса:
```
GET /api/v1/business/business-health
```

#### Бенчмарки:
```
GET /api/v1/business/benchmarks
```

#### Справочник формул:
```
GET /api/v1/business/formulas
```

---

## Вариант 3: Интеграция в ваш код

```python
from app.services.business_model import BusinessModel

# Ваши данные
transactions = [
    {'client_id': 'C001', 'price': 5000, 'cost': 3000, 'date': '2024-01-15'},
    # ... больше данных
]

# Расчет LTV
result = BusinessModel.calculate_precise_ltv(
    df_data=transactions,
    client_column='client_id',
    revenue_column='price',
    date_column='date',
    cost_column='cost'
)

print(f"LTV: {result['ltv']}")
print(f"LTV/CAC Ratio: {result['ltv_cac_ratio']}")
```

---

## 📊 Что вы получите:

### LTV метрики:
- ✅ Простой LTV
- ✅ LTV с маржой
- ✅ Прогнозный LTV (с retention)
- ✅ Когортный LTV (самый точный)
- ✅ Годовой LTV

### Дополнительно:
- 📈 ARPU (средняя выручка на клиента)
- 🔄 Retention Rate и Churn Rate
- 💰 Валовая маржа
- 🎯 Сегментация клиентов (VIP, High, Medium, Low)
- 💸 CAC (стоимость привлечения)
- 📊 LTV/CAC Ratio
- ⏱️ Payback Period (срок окупаемости)
- 💡 Персональные рекомендации

---

## 🎯 Быстрый тест (30 секунд):

```bash
# 1. Активируйте venv
.\venv\Scripts\activate

# 2. Запустите пример
python example_ltv_calculation.py

# 3. Смотрите результаты в консоли и файле ltv_analysis_results.json
```

---

## 📚 Полная документация:

См. файл `БИЗНЕС_МОДЕЛЬ_И_LTV.md` для:
- Подробного описания всех формул
- Бенчмарков по индустриям
- Рекомендаций по улучшению метрик
- Примеров API запросов
- Интеграции в ваше приложение
