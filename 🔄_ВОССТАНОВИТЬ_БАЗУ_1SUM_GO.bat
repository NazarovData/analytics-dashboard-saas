@echo off
chcp 65001 >nul
cls
echo ============================================
echo 🔄 Восстановление базы данных 1sum_go
echo ============================================
echo.

echo Шаг 1: Проверяем существует ли база...
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = '1sum_go';" > nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ⚠️ База 1sum_go уже существует
    echo.
    echo Хотите пересоздать базу? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        echo.
        echo Удаляем старую базу...
        psql -U postgres -c "DROP DATABASE IF EXISTS \"1sum_go\";"
        echo ✅ База удалена
    ) else (
        echo Отменено
        pause
        exit /b
    )
)

echo.
echo Шаг 2: Создаем базу заново...
psql -U postgres -f "🔧_СОЗДАТЬ_БАЗУ_1SUM_GO.sql"

echo.
echo ============================================
echo ✅ База данных 1sum_go восстановлена!
echo ============================================
echo.
echo Теперь можно подключаться:
echo postgresql://postgres:ваш_пароль@localhost:5432/1sum_go
echo.
pause
