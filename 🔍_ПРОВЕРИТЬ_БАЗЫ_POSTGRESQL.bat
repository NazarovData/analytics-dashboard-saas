@echo off
chcp 65001 >nul
cls
echo ============================================
echo 🔍 Проверка баз данных PostgreSQL
echo ============================================
echo.

echo 🔑 Вам потребуется ввести пароль PostgreSQL
echo.

echo 📊 Список всех баз данных:
echo.
psql -U postgres -c "\l"

echo.
echo ============================================
echo 🔎 Проверяем базу 1sum_go...
echo ============================================
echo.

psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = '1sum_go';" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ База 1sum_go найдена!
    echo.
    echo 📋 Проверяем таблицы в базе:
    echo.
    psql -U postgres -d "1sum_go" -c "\dt"
    
    echo.
    echo 📊 Количество записей в таблице sales:
    echo.
    psql -U postgres -d "1sum_go" -c "SELECT COUNT(*) as total_records FROM sales;"
    
    echo.
    echo 📈 Первые 5 записей:
    echo.
    psql -U postgres -d "1sum_go" -c "SELECT * FROM sales ORDER BY date DESC LIMIT 5;"
    
) else (
    echo.
    echo ❌ База 1sum_go НЕ найдена!
    echo.
    echo 💡 Создайте базу:
    echo    Запустите: ⚡_СОЗДАТЬ_БАЗУ_1SUM_GO.bat
    echo.
)

echo.
pause
