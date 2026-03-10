# 🔍 ДИАГНОСТИКА POSTGRESQL

## ❓ ПОЧЕМУ POSTGRESQL НЕ РАБОТАЕТ?

### Текущая ситуация:
- ✅ PostgreSQL **ЗАПУЩЕН** на порту 5432
- ❌ Приложение **НЕ МОЖЕТ ПОДКЛЮЧИТЬСЯ**
- ⚠️ Работает в **fallback режиме** (in-memory storage)

---

## 🔧 РЕШЕНИЕ (3 ВАРИАНТА)

### ✅ ВАРИАНТ 1: Настроить PostgreSQL (РЕКОМЕНДУЕТСЯ)

**Шаг 1: Создайте базу данных**

Запустите:
```cmd
🔧_НАСТРОИТЬ_POSTGRESQL.bat
```

Или вручную через psql:
```cmd
psql -U postgres
CREATE DATABASE analitix_ai;
\q
```

**Шаг 2: Проверьте пароль**

Файл `.env` содержит:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analitix_ai
```

Формат: `postgresql://ПОЛЬЗОВАТЕЛЬ:ПАРОЛЬ@localhost:5432/ИМЯ_БД`

Если ваш пароль PostgreSQL другой, измените его в `.env`

**Шаг 3: Примените миграции**

```cmd
venv\Scripts\activate
alembic upgrade head
```

**Шаг 4: Запустите backend**

```cmd
▶️_ЗАПУСТИТЬ_BACKEND.bat
```

---

### ✅ ВАРИАНТ 2: Использовать SQLite (БЕЗ PostgreSQL)

**Самый простой способ!**

Запустите:
```cmd
🔄_ПЕРЕКЛЮЧИТЬ_НА_SQLITE.bat
```

Это:
- ✅ Создаст файл `analitix_ai.db`
- ✅ Применит все миграции
- ✅ Не требует PostgreSQL
- ✅ Идеально для разработки

**Ограничения SQLite:**
- ❌ Не подходит для продакшена
- ❌ Медленнее на больших данных (>100k строк)
- ❌ Нет параллельных записей

---

### ✅ ВАРИАНТ 3: Работать БЕЗ базы данных (текущий режим)

**Что работает:**
- ✅ Загрузка файлов
- ✅ Анализ данных
- ✅ AI инсайты
- ✅ Экспорт PDF/Excel
- ✅ Все 10 отраслей

**Что НЕ работает:**
- ❌ История загрузок (не сохраняется)
- ❌ Пользователи (нет регистрации)
- ❌ Интеграции (не сохраняются)

**Для работы без БД:**
Просто запустите backend как есть:
```cmd
▶️_ЗАПУСТИТЬ_BACKEND.bat
```

---

## 🐛 ЧАСТЫЕ ПРОБЛЕМЫ

### Проблема 1: "База данных не существует"

**Ошибка:**
```
FATAL: database "analitix_ai" does not exist
```

**Решение:**
```cmd
psql -U postgres -c "CREATE DATABASE analitix_ai;"
```

---

### Проблема 2: "Неверный пароль"

**Ошибка:**
```
FATAL: password authentication failed for user "postgres"
```

**Решение:**
1. Узнайте свой пароль PostgreSQL
2. Измените в `.env`:
```
DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/analitix_ai
```

---

### Проблема 3: "Не могу подключиться к серверу"

**Ошибка:**
```
could not connect to server: Connection refused
```

**Проверьте что PostgreSQL запущен:**
```cmd
netstat -ano | findstr :5432
```

Если пусто - PostgreSQL не запущен.

**Запустите PostgreSQL:**
- Windows: Откройте "Службы" → найдите "postgresql" → Запустить
- Или используйте SQLite (Вариант 2)

---

### Проблема 4: "psql не найден"

**Ошибка:**
```
'psql' is not recognized as an internal or external command
```

**Решение:**
1. Найдите папку PostgreSQL (обычно `C:\Program Files\PostgreSQL\XX\bin`)
2. Добавьте в PATH
3. Или используйте pgAdmin (графический интерфейс)
4. Или используйте SQLite (Вариант 2)

---

## 📊 ПРОВЕРКА ПОДКЛЮЧЕНИЯ

### Тест 1: PostgreSQL запущен?
```cmd
netstat -ano | findstr :5432
```
Должно показать: `LISTENING 5432`

### Тест 2: База данных существует?
```cmd
psql -U postgres -l
```
Должна быть в списке: `analitix_ai`

### Тест 3: Можно подключиться?
```cmd
psql -U postgres -d analitix_ai
```
Должно открыть консоль PostgreSQL

### Тест 4: Таблицы созданы?
```cmd
psql -U postgres -d analitix_ai -c "\dt"
```
Должно показать 7 таблиц

---

## 🎯 РЕКОМЕНДАЦИИ

### Для разработки (сейчас):
**Используйте SQLite** - проще всего!
```cmd
🔄_ПЕРЕКЛЮЧИТЬ_НА_SQLITE.bat
```

### Для продакшена (потом):
**Используйте PostgreSQL** на облаке:
- Railway.app (бесплатно)
- Render.com (бесплатно)
- Supabase (бесплатно)
- AWS RDS (платно)

---

## 💡 БЫСТРОЕ РЕШЕНИЕ

**Если хотите просто протестировать систему:**

1. Используйте SQLite:
```cmd
🔄_ПЕРЕКЛЮЧИТЬ_НА_SQLITE.bat
```

2. Запустите backend:
```cmd
▶️_ЗАПУСТИТЬ_BACKEND.bat
```

3. Запустите frontend:
```cmd
✅_ЗАПУСК_FRONTEND.bat
```

4. Откройте браузер:
```
http://localhost:3000
```

**Все будет работать!** 🎉

---

## 📞 НУЖНА ПОМОЩЬ?

Если ничего не помогло:
1. Покажите мне ошибку из терминала
2. Покажите содержимое `.env`
3. Покажите результат: `netstat -ano | findstr :5432`

Я помогу разобраться! 😊
