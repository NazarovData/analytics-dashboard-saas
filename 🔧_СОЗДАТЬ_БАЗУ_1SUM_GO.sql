-- 🐘 Создание базы данных 1sum_go для Analitix AI
-- Запустите: psql -U postgres -f 🔧_СОЗДАТЬ_БАЗУ_1SUM_GO.sql

-- Создаем базу данных
CREATE DATABASE "1sum_go" WITH ENCODING 'UTF8';

-- Подключаемся к базе
\c "1sum_go"

-- Создаем таблицу продаж
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    customer_id VARCHAR(100),
    region VARCHAR(100),
    category VARCHAR(100),
    cost DECIMAL(10, 2),
    profit DECIMAL(10, 2),
    total DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем тестовые данные (50 записей)
INSERT INTO sales (date, product, quantity, price, customer_id, region, category, cost, profit, total)
SELECT
    CURRENT_DATE - (random() * 90)::integer AS date,
    CASE (random() * 9)::integer
        WHEN 0 THEN 'Ноутбук Dell XPS'
        WHEN 1 THEN 'Мышь Logitech'
        WHEN 2 THEN 'Клавиатура Razer'
        WHEN 3 THEN 'Монитор Samsung'
        WHEN 4 THEN 'Наушники Sony'
        WHEN 5 THEN 'Веб-камера Logitech'
        WHEN 6 THEN 'Микрофон Blue Yeti'
        WHEN 7 THEN 'Колонки JBL'
        WHEN 8 THEN 'USB-хаб Anker'
        ELSE 'Кабель HDMI'
    END AS product,
    (random() * 10 + 1)::integer AS quantity,
    (random() * 50000 + 1000)::numeric(10,2) AS price,
    'CUST_' || lpad((random() * 50 + 1)::text, 3, '0') AS customer_id,
    CASE (random() * 4)::integer
        WHEN 0 THEN 'Москва'
        WHEN 1 THEN 'Санкт-Петербург'
        WHEN 2 THEN 'Казань'
        WHEN 3 THEN 'Новосибирск'
        ELSE 'Екатеринбург'
    END AS region,
    CASE (random() * 2)::integer
        WHEN 0 THEN 'Электроника'
        WHEN 1 THEN 'Аксессуары'
        ELSE 'Периферия'
    END AS category,
    (random() * 30000 + 500)::numeric(10,2) AS cost,
    (random() * 20000 + 500)::numeric(10,2) AS profit,
    (random() * 50000 + 1000)::numeric(10,2) * (random() * 10 + 1) AS total
FROM generate_series(1, 50);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_product ON sales(product);
CREATE INDEX idx_sales_region ON sales(region);

-- Показываем статистику
SELECT 
    COUNT(*) as total_records,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    SUM(total) as total_revenue,
    AVG(price) as avg_price
FROM sales;

-- Показываем первые 10 записей
SELECT * FROM sales ORDER BY date DESC LIMIT 10;

-- Готово!
\echo '============================================'
\echo '✅ База данных 1sum_go создана!'
\echo '✅ Таблица sales создана с 50 записями'
\echo '✅ Теперь можно подключаться через Analitix AI'
\echo '============================================'
\echo ''
\echo 'Connection String:'
\echo 'postgresql://postgres:ваш_пароль@localhost:5432/1sum_go'
\echo ''
\echo 'Параметры подключения:'
\echo 'Host: localhost'
\echo 'Port: 5432'
\echo 'Database: 1sum_go'
\echo 'Username: postgres'
\echo 'Table: sales'
