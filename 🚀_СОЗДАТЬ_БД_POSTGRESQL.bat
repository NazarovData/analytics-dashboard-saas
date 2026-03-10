@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          🚀 СОЗДАНИЕ БАЗЫ ДАННЫХ POSTGRESQL               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set PSQL="C:\Program Files\PostgreSQL\17\bin\psql.exe"

echo 📊 Проверяю PostgreSQL...
echo.

if not exist %PSQL% (
    echo ❌ psql.exe не найден по пути: %PSQL%
    echo.
    echo 💡 Используйте SQLite вместо PostgreSQL:
    echo    🔄_ПЕРЕКЛЮЧИТЬ_НА_SQLITE.bat
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL найден: %PSQL%
echo.

echo 🔨 Создаю базу данных 'analitix_ai'...
echo.
echo 💡 Введите пароль PostgreSQL (по умолчанию: postgres)
echo.

%PSQL% -U postgres -c "CREATE DATABASE analitix_ai;"

if %errorlevel% equ 0 (
    echo.
    echo ✅ База данных создана успешно!
    echo.
) else (
    echo.
    echo ⚠️ База данных уже существует или ошибка создания
    echo    Это нормально, если база уже была создана ранее
    echo.
)

echo ════════════════════════════════════════════════════════════
echo.
echo 🔄 Применяю миграции Alembic...
echo.

call venv\Scripts\activate

echo 📝 Текущая версия БД:
alembic current

echo.
echo 🚀 Применяю миграции...
alembic upgrade head

if %errorlevel% equ 0 (
    echo.
    echo ✅ УСПЕХ! PostgreSQL готов к работе!
    echo.
    echo 📊 Созданные таблицы:
    echo    ✅ users (пользователи)
    echo    ✅ file_uploads (загруженные файлы)
    echo    ✅ analytics (результаты аналитики)
    echo    ✅ integrations (интеграции)
    echo    ✅ integration_syncs (синхронизации)
    echo    ✅ leads (лиды)
    echo    ✅ exports (экспорты)
    echo.
    echo 🚀 Теперь запустите backend:
    echo    ▶️_ЗАПУСТИТЬ_BACKEND.bat
    echo.
) else (
    echo.
    echo ❌ Ошибка применения миграций
    echo.
    echo 💡 Возможные причины:
    echo    1. Неверный пароль PostgreSQL
    echo    2. База данных не создана
    echo    3. Проблема с подключением
    echo.
    echo 🔧 Проверьте настройки в .env:
    echo    DATABASE_URL=postgresql://postgres:ПАРОЛЬ@localhost:5432/analitix_ai
    echo.
    echo 💡 Или используйте SQLite:
    echo    🔄_ПЕРЕКЛЮЧИТЬ_НА_SQLITE.bat
    echo.
)

echo ════════════════════════════════════════════════════════════
echo.

pause
