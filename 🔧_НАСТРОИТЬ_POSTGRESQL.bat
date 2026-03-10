@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          🔧 НАСТРОЙКА POSTGRESQL                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📊 Проверяю PostgreSQL...
echo.

REM Проверяем что PostgreSQL запущен
netstat -ano | findstr :5432 >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL не запущен на порту 5432
    echo.
    echo 💡 Установите PostgreSQL:
    echo    https://www.postgresql.org/download/windows/
    echo.
    echo    Или используйте SQLite (без PostgreSQL):
    echo    Измените в .env: DATABASE_URL=sqlite:///./analitix_ai.db
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL запущен на порту 5432
echo.

echo 🔨 Создаю базу данных 'analitix_ai'...
echo.

REM Пытаемся создать базу данных через psql
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo 📝 Используем psql для создания БД...
    psql -U postgres -c "CREATE DATABASE analitix_ai;" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ База данных создана успешно!
    ) else (
        echo ⚠️ База данных уже существует или ошибка создания
    )
) else (
    echo ⚠️ psql не найден в PATH
    echo.
    echo 💡 Создайте базу данных вручную:
    echo    1. Откройте pgAdmin или psql
    echo    2. Выполните: CREATE DATABASE analitix_ai;
    echo.
)

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 🔄 Применяю миграции Alembic...
echo.

REM Активируем venv и применяем миграции
call venv\Scripts\activate

echo 📝 Проверяю текущую версию БД...
alembic current

echo.
echo 🚀 Применяю миграции...
alembic upgrade head

if %errorlevel% equ 0 (
    echo.
    echo ✅ Миграции применены успешно!
    echo.
    echo 📊 Созданные таблицы:
    echo    - users (пользователи)
    echo    - file_uploads (загруженные файлы)
    echo    - analytics (результаты аналитики)
    echo    - integrations (интеграции)
    echo    - integration_syncs (синхронизации)
    echo    - leads (лиды)
    echo    - exports (экспорты)
    echo.
) else (
    echo.
    echo ❌ Ошибка применения миграций
    echo.
    echo 💡 Возможные причины:
    echo    1. Неверный пароль PostgreSQL (по умолчанию: postgres)
    echo    2. База данных не создана
    echo    3. PostgreSQL не запущен
    echo.
    echo 🔧 Проверьте настройки в .env:
    echo    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analitix_ai
    echo.
)

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 🎯 СЛЕДУЮЩИЕ ШАГИ:
echo.
echo    1. Если все ОК - запустите backend:
echo       ▶️_ЗАПУСТИТЬ_BACKEND.bat
echo.
echo    2. Если ошибка - проверьте:
echo       - Пароль PostgreSQL (по умолчанию: postgres)
echo       - База данных создана
echo       - PostgreSQL запущен
echo.
echo ════════════════════════════════════════════════════════════
echo.

pause
