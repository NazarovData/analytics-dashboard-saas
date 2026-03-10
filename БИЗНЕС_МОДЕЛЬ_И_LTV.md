# 💰 Бизнес-модель и точный расчет LTV

## 📊 Что добавлено

Создана продвинутая система расчета бизнес-метрик с точными формулами и методологией.

### Новые файлы:
- `app/services/business_model.py` - Сервис с бизнес-логикой
- `app/api/v1/business_metrics.py` - API endpoints

### Новые API endpoints:
- `POST /api/v1/business/ltv/calculate` - Точный расчет LTV
- `POST /api/v1/business/cac/calculate` - Расчет CAC
- `POST /api/v1/business/unit-economics/calculate` - Unit Economics
- `GET /api/v1/business/ltv/demo` - Демо с примером
- `GET /api/v1/business/business-health` - Общее здоровье бизнеса
- `GET /api/v1/business/benchmarks` - Бенчмарки по индустриям
- `GET /api/v1/business/formulas` - Справочник формул

---

## 🎯 Ключевые метрики

### 1. LTV (Lifetime Value)
**Прогнозируемая прибыль от клиента за все время сотрудничества**

#### Методы расчета:

**Простой LTV:**
```
LTV = Средняя выручка на клиента
```

**LTV с маржой:**
```
LTV = ARPU × Gross Margin
```

**Прогнозный LTV:**
```
LTV = (ARPU × Gross Margin) / Churn Rate
```

**Когортный LTV (самый точный):**
```
LTV = AOV × Purchase Frequency × Customer Lifespan × Gross Margin

где:
- AOV = Average Order Value (средний чек)
- Purchase Frequency = частота покупок в месяц
- Customer Lifespan = средняя продолжительность жизни клиента
- Gross Margin = валовая маржа (прибыль после себестоимости)
```

### 2. CAC (Customer Acquisition Cost)
**Стоимость привлечения одного клиента**

```
CAC = Маркетинговые расходы / Количество новых клиентов

Маркетинговые расходы включают:
- Реклама (контекст, таргет, SEO)
- Зарплата маркетологов
- Инструменты и сервисы
- Комиссии партнеров
```

### 3. LTV/CAC Ratio
**Соотношение ценности клиента к стоимости привлечения**

```
LTV/CAC Ratio = LTV / CAC

Оценка:
- < 1: Убыточно (каждый клиент приносит убыток)
- 1-2: Окупается (но мало прибыли)
- 2-3: Прибыльно (хороший бизнес)
- > 3: Очень прибыльно (отличный бизнес, можно масштабировать)
```

### 4. Payback Period
**Срок окупаемости клиента (в месяцах)**

```
Payback Period = CAC / (Monthly Revenue per Customer × Gross Margin)

Цель: < 12 месяцев для здорового бизнеса
```

### 5. Churn Rate
**Процент клиентов, которые перестали покупать**

```
Churn Rate = (Ушедшие клиенты / Всего клиентов) × 100%

Retention Rate = 100% - Churn Rate
```

### 6. ARPU (Average Revenue Per User)
**Средняя выручка на одного пользователя**

```
ARPU = Общая выручка / Количество клиентов
```

### 7. Gross Margin
**Валовая маржа (прибыль до операционных расходов)**

```
Gross Margin = ((Выручка - Себестоимость) / Выручка) × 100%
```

---

## 📡 Примеры использования API

### 1. Расчет LTV

**Запрос:**
```bash
curl -X POST "http://localhost:8000/api/v1/business/ltv/calculate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"client_id": "C001", "price": 5000, "cost": 3000, "date": "2024-01-15"},
      {"client_id": "C001", "price": 7000, "cost": 4200, "date": "2024-02-20"},
      {"client_id": "C002", "price": 3000, "cost": 1800, "date": "2024-01-10"},
      {"client_id": "C002", "price": 4000, "cost": 2400, "date": "2024-03-05"}
    ],
    "client_column": "client_id",
    "revenue_column": "price",
    "date_column": "date",
    "cost_column": "cost",
    "period_months": 12
  }'
```

**Ответ:**
```json
{
  "success": true,
  "ltv": 15234.50,
  "simple_ltv": 9500.00,
  "ltv_with_margin": 3800.00,
  "predictive_ltv": 19000.00,
  "cohort_ltv": 18903.00,
  "yearly_ltv": 114000.00,
  
  "total_clients": 50,
  "active_clients": 38,
  "churned_clients": 12,
  "total_revenue": 475000.00,
  "total_cost": 285000.00,
  "gross_profit": 190000.00,
  
  "arpu": 9500.00,
  "average_order_value": 3166.67,
  "orders_per_client": 3.2,
  "purchase_frequency_per_month": 0.8,
  
  "retention_rate": 76.00,
  "churn_rate": 24.00,
  "avg_lifespan_days": 120.5,
  "avg_lifespan_months": 4.0,
  
  "gross_margin_percent": 40.00,
  "gross_margin_ratio": 0.400,
  
  "projected_revenue_active": 578911.00,
  
  "segments": {
    "vip": {
      "count": 5,
      "revenue": 225000.00,
      "avg_ltv": 45000.00,
      "percent": 10.0
    },
    "high_value": {
      "count": 12,
      "revenue": 180000.00,
      "avg_ltv": 15000.00,
      "percent": 24.0
    },
    "medium_value": {
      "count": 20,
      "revenue": 60000.00,
      "avg_ltv": 3000.00,
      "percent": 40.0
    },
    "low_value": {
      "count": 13,
      "revenue": 10000.00,
      "avg_ltv": 769.23,
      "percent": 26.0
    }
  },
  
  "recommendations": [
    "🌟 Отличный LTV (15,235₽)! Инвестируйте в удержание таких клиентов.",
    "📊 Средний отток (24.0%). Улучшите коммуникацию с клиентами.",
    "💎 Отличная маржа (40.0%)! Можно инвестировать в маркетинг.",
    "🎯 Высокая лояльность клиентов! Продолжайте текущую стратегию."
  ],
  
  "calculation_method": "advanced_multi_method",
  "period_analyzed_months": 4.0
}
```

### 2. Расчет CAC

**Запрос:**
```bash
curl -X POST "http://localhost:8000/api/v1/business/cac/calculate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marketing_spend": 150000,
    "new_customers": 50
  }'
```

**Ответ:**
```json
{
  "success": true,
  "cac": 3000.00,
  "marketing_spend": 150000.00,
  "new_customers": 50,
  "benchmarks": {
    "ecommerce": {"low": 30, "avg": 70, "high": 150},
    "saas": {"low": 100, "avg": 300, "high": 1000},
    "retail": {"low": 10, "avg": 30, "high": 80}
  }
}
```

### 3. Unit Economics

**Запрос:**
```bash
curl -X POST "http://localhost:8000/api/v1/business/unit-economics/calculate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ltv": 15000,
    "cac": 3000,
    "gross_margin_percent": 40,
    "avg_lifespan_months": 12
  }'
```

**Ответ:**
```json
{
  "ltv": 15000.00,
  "cac": 3000.00,
  "ltv_cac_ratio": 5.00,
  "payback_months": 6.0,
  "customer_profit": 12000.00,
  "customer_roi": 400.0,
  "gross_margin_percent": 40.00,
  "health_status": "excellent",
  "health_message": "🌟 Отличная юнит-экономика! Бизнес масштабируемый.",
  "recommendations": [
    "🚀 Отличная юнит-экономика! Можно агрессивно масштабировать маркетинг"
  ]
}
```

### 4. Демо-данные

**Запрос:**
```bash
curl -X GET "http://localhost:8000/api/v1/business/ltv/demo"
```

Возвращает пример расчета LTV на сгенерированных данных.

### 5. Здоровье бизнеса

**Запрос:**
```bash
curl -X GET "http://localhost:8000/api/v1/business/business-health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ответ:**
```json
{
  "overall_health": "good",
  "health_score": 78,
  "metrics": {
    "ltv": {
      "value": 15000,
      "status": "good",
      "benchmark": 12000,
      "trend": "up"
    },
    "cac": {
      "value": 4500,
      "status": "good",
      "benchmark": 5000,
      "trend": "down"
    },
    "ltv_cac_ratio": {
      "value": 3.33,
      "status": "excellent",
      "benchmark": 3.0,
      "trend": "up"
    }
  },
  "recommendations": [
    "🎯 LTV/CAC ratio отличный (3.33). Можно увеличить маркетинговый бюджет.",
    "📉 Работайте над снижением churn rate с 25% до 20%."
  ]
}
```

### 6. Бенчмарки по индустриям

**Запрос:**
```bash
curl -X GET "http://localhost:8000/api/v1/business/benchmarks"
```

Возвращает средние значения метрик для разных индустрий (ecommerce, SaaS, retail, B2B).

### 7. Справочник формул

**Запрос:**
```bash
curl -X GET "http://localhost:8000/api/v1/business/formulas"
```

Возвращает все формулы с описаниями и примерами использования.

---

## 📈 Бенчмарки по индустриям

### E-commerce
- **LTV:** 5,000 - 50,000₽
- **CAC:** 30 - 150₽
- **LTV/CAC:** 2 - 5
- **Churn Rate:** 15 - 40%
- **Gross Margin:** 30 - 60%
- **Payback:** 6 - 18 месяцев

### SaaS
- **LTV:** 10,000 - 100,000₽
- **CAC:** 100 - 1,000₽
- **LTV/CAC:** 3 - 10
- **Churn Rate:** 5 - 20%
- **Gross Margin:** 70 - 95%
- **Payback:** 12 - 24 месяца

### Retail
- **LTV:** 2,000 - 25,000₽
- **CAC:** 10 - 80₽
- **LTV/CAC:** 2 - 8
- **Churn Rate:** 20 - 50%
- **Gross Margin:** 25 - 55%
- **Payback:** 3 - 15 месяцев

### B2B
- **LTV:** 20,000 - 300,000₽
- **CAC:** 500 - 10,000₽
- **LTV/CAC:** 3 - 15
- **Churn Rate:** 5 - 25%
- **Gross Margin:** 50 - 85%
- **Payback:** 12 - 36 месяцев

---

## 🎯 Рекомендации по улучшению метрик

### Как увеличить LTV:

1. **Повышение среднего чека:**
   - Апсейл (продажа более дорогих товаров)
   - Кросс-сейл (дополнительные товары)
   - Бандлы и комплекты

2. **Увеличение частоты покупок:**
   - Email-маркетинг
   - Push-уведомления
   - Программа лояльности
   - Подписки

3. **Удержание клиентов (снижение Churn):**
   - Отличный сервис
   - Персонализация
   - Реактивационные кампании
   - VIP-программы

4. **Увеличение срока жизни клиента:**
   - Качество продукта
   - Постоянные улучшения
   - Обратная связь
   - Сообщество

### Как снизить CAC:

1. **Оптимизация рекламы:**
   - A/B тесты
   - Таргетинг
   - Ретаргетинг
   - Lookalike аудитории

2. **Органический трафик:**
   - SEO
   - Контент-маркетинг
   - Социальные сети
   - Блог

3. **Реферальная программа:**
   - Бонусы за приглашения
   - Партнерская программа
   - Word-of-mouth

4. **Конверсия:**
   - Улучшение сайта
   - Упрощение оформления
   - Доверие (отзывы, гарантии)

### Как улучшить Unit Economics:

1. **Фокус на LTV/CAC > 3:**
   - Если < 3: снижайте CAC или повышайте LTV
   - Если > 5: можно увеличить маркетинговый бюджет

2. **Сокращение Payback Period:**
   - Цель: < 12 месяцев
   - Быстрая монетизация новых клиентов
   - Предоплата, подписки

3. **Повышение маржинальности:**
   - Оптимизация затрат
   - Автоматизация
   - Масштаб (экономия на объеме)

---

## 🔧 Интеграция в ваше приложение

### Python пример:

```python
from app.services.business_model import BusinessModel

# Ваши данные о транзакциях
transactions = [
    {'client_id': 'C001', 'price': 5000, 'cost': 3000, 'date': '2024-01-15'},
    {'client_id': 'C001', 'price': 7000, 'cost': 4200, 'date': '2024-02-20'},
    # ... больше данных
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

print(f"LTV: {ltv_result['ltv']}")
print(f"Churn Rate: {ltv_result['churn_rate']}%")
print(f"Segments: {ltv_result['segments']}")

# Расчет CAC
cac_result = BusinessModel.calculate_cac(
    marketing_spend=150000,
    new_customers=50
)

print(f"CAC: {cac_result['cac']}")

# Unit Economics
unit_econ = BusinessModel.calculate_unit_economics(
    ltv=ltv_result['ltv'],
    cac=cac_result['cac'],
    gross_margin_percent=ltv_result['gross_margin_percent'],
    avg_lifespan_months=ltv_result['avg_lifespan_months']
)

print(f"LTV/CAC Ratio: {unit_econ['ltv_cac_ratio']}")
print(f"Health: {unit_econ['health_message']}")
```

---

## 📚 Дополнительные ресурсы

### Документация:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Полезные ссылки:
- [Cohort Analysis](https://en.wikipedia.org/wiki/Cohort_analysis)
- [Unit Economics](https://www.investopedia.com/terms/u/unit-economics.asp)
- [LTV/CAC Ratio](https://www.profitwell.com/recur/all/ltv-cac-ratio)

---

## ✅ Что дальше?

1. **Интеграция с вашими данными:**
   - Подключите реальные транзакции
   - Настройте маппинг колонок
   - Добавьте данные о маркетинговых расходах

2. **Визуализация:**
   - Создайте дашборд с метриками
   - Графики трендов LTV/CAC
   - Сегментация клиентов

3. **Автоматизация:**
   - Ежедневный расчет метрик
   - Алерты при ухудшении показателей
   - Отчеты для руководства

4. **Прогнозирование:**
   - ML-модели для предсказания Churn
   - Прогноз LTV новых клиентов
   - Оптимизация маркетингового бюджета
