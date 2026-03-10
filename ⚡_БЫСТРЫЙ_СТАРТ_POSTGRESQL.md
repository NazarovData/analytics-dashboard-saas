# ⚡ Быстрый старт PostgreSQL

## 3 простых шага:

### 1️⃣ Установите драйвер (1 минута)

Запустите:
```
🔧_УСТАНОВКА_POSTGRESQL_ДРАЙВЕРА.bat
```

### 2️⃣ Создайте тестовую базу (2 минуты)

Откройте pgAdmin или psql и выполните:
```cmd
psql -U postgres -f create_test_database.sql
```

Или вручную в pgAdmin:
- Создайте базу `analitix_db`
- Выполните SQL из файла `create_test_database.sql`

### 3️⃣ Подключитесь (30 секунд)

1. Откройте `http://localhost:3000/integrations`
2. Нажмите на **PostgreSQL**
3. Введите:
   ```
   Connection String: postgresql://postgres:ваш_пароль@localhost:5432/analitix_db
   Table: sales
   ```
4. Нажмите **"Подключить"**
5. Нажмите **🔄 Синхронизация**

## ✅ Готово!

Данные из PostgreSQL загрузятся и будут доступны для анализа!

---

**Полная инструкция:** `🚀_РЕАЛЬНОЕ_ПОДКЛЮЧЕНИЕ_POSTGRESQL.md`
