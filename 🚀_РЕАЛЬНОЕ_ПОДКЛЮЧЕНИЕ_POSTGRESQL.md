# 🚀 Реальное подключение к PostgreSQL

## ✅ Что сделано

PostgreSQL коннектор обновлен для работы с реальной базой данных!

## 📦 Шаг 1: Установка драйвера

Запустите файл:
```
🔧_УСТАНОВКА_POSTGRESQL_ДРАЙВЕРА.bat
```

Или вручную:
```cmd
venv\Scripts\pip install psycopg2-binary
```

## 🔌 Шаг 2: Подключение к базе

### Вариант 1: Connection String

```
postgresql://username:password@localhost:5432/database_name
```

Пример:
```
postgresql://postgres:mypassword@localhost:5432/analitix_db
```

### Вариант 2: Отдельные параметры

- **Host:** localhost
- **Port:** 5432
- **Database:** analitix_db
- **Username:** postgres
- **Password:** ваш_пароль
- **Table:** sales

## 📊 Шаг 3: Создание тестовой таблицы

Если у вас еще нет таблицы с данными, создайте тестовую:

```sql
-- Подключитесь к PostgreSQL
psql -U postgres

-- Создайте базу данных
CREATE DATABASE analitix_db;

-- Подключитесь к базе
\c analitix_db

-- Создайте таблицу
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    customer_id VARCHAR(100),
    total DECIMAL(10, 2)
);

-- Добавьте тестовые данные
INSERT INTO sales (date, product, quantity, price, customer_id, total)
VALUES
    ('2024-01-15', 'Ноутбук', 2, 50000, 'CUST_001', 100000),
    ('2024-01-16', 'Мышь', 5, 1500, 'CUST_002', 7500),
    ('2024-01-17', 'Клавиатура', 3, 3000, 'CUST_003', 9000),
    ('2024-01-18', 'Монитор', 1, 25000, 'CUST_001', 25000),
    ('2024-01-19', 'Наушники', 4, 2500, 'CUST_004', 10000);

-- Проверьте данные
SELECT * FROM sales;
```

## 🎯 Шаг 4: Подключение через интерфейс

1. Откройте `http://localhost:3000/integrations`
2. Нажмите на карточку **PostgreSQL**
3. Заполните форму:
   - **Connection String:** `postgresql://postgres:password@localhost:5432/analitix_db`
   - **Table:** `sales`
4. Нажмите **"Подключить"**
5. Нажмите кнопку **синхронизации 🔄**
6. Данные загрузятся из вашей базы!

## 🔍 Как работает

### Тест подключения:
1. Проверяет наличие psycopg2
2. Подключается к базе данных
3. Получает версию PostgreSQL
4. Получает список таблиц
5. Возвращает результат

### Получение данных:
1. Подключается к базе
2. Выполняет `SELECT * FROM table_name LIMIT 100`
3. Преобразует результат в JSON
4. Возвращает данные для аналитики

### Fallback режим:
Если psycopg2 не установлен или подключение не удалось:
- Возвращает демо-данные
- Показывает ошибку в поле `_error`
- Система продолжает работать

## 📝 Примеры использования

### Пример 1: Локальная база

```
Host: localhost
Port: 5432
Database: mydb
Username: postgres
Password: postgres
Table: sales
```

### Пример 2: Удаленная база

```
Host: db.example.com
Port: 5432
Database: production_db
Username: analytics_user
Password: secure_password
Table: transactions
```

### Пример 3: Connection String

```
postgresql://user:pass@db.example.com:5432/mydb
```

## ⚠️ Важно

1. **Безопасность:** Не храните пароли в открытом виде
2. **Права доступа:** Пользователь должен иметь SELECT права на таблицу
3. **Формат данных:** Таблица должна содержать колонки для аналитики (date, product, price, quantity)
4. **Лимит:** По умолчанию загружается 100 записей

## 🎨 Поддерживаемые типы данных

PostgreSQL → Python:
- `INTEGER` → `int`
- `DECIMAL/NUMERIC` → `float`
- `VARCHAR/TEXT` → `str`
- `DATE/TIMESTAMP` → `str` (ISO format)
- `BOOLEAN` → `bool`

## 🔧 Troubleshooting

### Ошибка: "psycopg2 не установлен"
```cmd
venv\Scripts\pip install psycopg2-binary
```

### Ошибка: "could not connect to server"
- Проверьте что PostgreSQL запущен
- Проверьте host и port
- Проверьте firewall

### Ошибка: "password authentication failed"
- Проверьте username и password
- Проверьте pg_hba.conf

### Ошибка: "relation does not exist"
- Проверьте название таблицы
- Проверьте что таблица в схеме public

## ✨ Готово!

Теперь вы можете подключаться к реальной PostgreSQL базе данных и анализировать данные в реальном времени!

---

**Дата:** 27 января 2026  
**Версия:** 2.0.0 (Real Database Support)
