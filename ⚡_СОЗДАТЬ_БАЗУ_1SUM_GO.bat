@echo off
chcp 65001 >nul
cls
echo ============================================
echo ⚡ Создание базы данных 1sum_go
echo ============================================
echo.

echo 📋 Что будет создано:
echo    - База данных: 1sum_go
echo    - Таблица: sales
echo    - 50 тестовых записей
echo    - Индексы для быстрого поиска
echo.

echo 🔑 Вам потребуется ввести пароль PostgreSQL
echo.
pause

echo.
echo 🚀 Создаем базу данных...
echo.

psql -U postgres -f "🔧_СОЗДАТЬ_БАЗУ_1SUM_GO.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo ✅ УСПЕХ! База данных 1sum_go создана!
    echo ============================================
    echo.
    echo 📊 Теперь подключитесь через интеграции:
    echo.
    echo    1. Откройте страницу /integrations
    echo    2. Нажмите на PostgreSQL
    echo    3. Введите данные:
    echo.
    echo       Connection String:
    echo       postgresql://postgres:ваш_пароль@localhost:5432/1sum_go
    echo.
    echo       Или заполните поля:
    echo       Host: localhost
    echo       Port: 5432
    echo       Database: 1sum_go
    echo       Username: postgres
    echo       Password: ваш_пароль
    echo       Table: sales
    echo.
    echo    4. Нажмите "Подключить"
    echo    5. Нажмите 🔄 "Синхронизация"
    echo.
) else (
    echo.
    echo ❌ Ошибка при создании базы данных
    echo.
    echo Возможные причины:
    echo    - PostgreSQL не запущен
    echo    - Неверный пароль
    echo    - База уже существует
    echo.
    echo Попробуйте:
    echo    1. Запустить PostgreSQL
    echo    2. Проверить пароль
    echo    3. Запустить 🔍_ПРОВЕРИТЬ_БАЗЫ_POSTGRESQL.bat
    echo.
)

pause
