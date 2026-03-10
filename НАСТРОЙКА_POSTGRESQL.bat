@echo off
chcp 65001 >nul
echo ========================================
echo 🗄️  НАСТРОЙКА POSTGRESQL
echo ========================================
echo.

echo 📋 Шаг 1: Проверка PostgreSQL...
echo.
echo Убедитесь что PostgreSQL установлен и запущен!
echo Если нет - скачайте с https://www.postgresql.org/download/windows/
echo.
pause

echo.
echo 📋 Шаг 2: Создание базы данных...
echo.
echo Выполните в psql или pgAdmin:
echo.
echo CREATE DATABASE analitix_ai;
echo CREATE USER analitix_user WITH PASSWORD 'analitix_password';
echo GRANT ALL PRIVILEGES ON DATABASE analitix_ai TO analitix_user;
echo.
echo Или используйте существующую БД и измените DATABASE_URL в .env
echo.
pause

echo.
echo 📋 Шаг 3: Настройка переменных окружения...
echo.

REM Создаём .env файл если его нет
if not exist .env (
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analitix_ai > .env
    echo SECRET_KEY=your-secret-key-change-this-in-production >> .env
    echo ENVIRONMENT=development >> .env
    echo DEBUG=True >> .env
    echo.
    echo ✅ Создан файл .env
) else (
    echo ⚠️  Файл .env уже существует
)

echo.
echo 📋 Шаг 4: Установка зависимостей...
venv\Scripts\python.exe -m pip install --upgrade pip
venv\Scripts\python.exe -m pip install psycopg2-binary alembic sqlalchemy

echo.
echo 📋 Шаг 5: Запуск миграций...
venv\Scripts\alembic.exe upgrade head

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ POSTGRESQL НАСТРОЕН УСПЕШНО!
    echo ========================================
    echo.
    echo Теперь можно запускать сервер:
    echo   ▶️_ЗАПУСТИТЬ_BACKEND.bat
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ ОШИБКА ПРИ НАСТРОЙКЕ
    echo ========================================
    echo.
    echo Проверьте:
    echo 1. PostgreSQL запущен
    echo 2. База данных создана
    echo 3. Правильные данные в .env
    echo.
)

pause
