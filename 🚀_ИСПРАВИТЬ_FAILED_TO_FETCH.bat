@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🔧 ИСПРАВЛЕНИЕ "Failed to fetch"
echo ========================================
echo.
echo Проблема: Backend не запущен на порту 8000
echo Решение: Запускаем backend сейчас
echo.
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Активация виртуального окружения...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo ✅ Виртуальное окружение активировано
) else (
    echo ❌ Виртуальное окружение не найдено!
    echo Запустите сначала: БЫСТРАЯ_УСТАНОВКА.bat
    pause
    exit /b 1
)

echo.
echo [2/3] Проверка зависимостей...
python -c "import fastapi, uvicorn" 2>nul
if errorlevel 1 (
    echo ⚠️ Устанавливаем зависимости...
    pip install -q fastapi uvicorn sqlalchemy pydantic python-multipart
)

echo.
echo [3/3] Запуск Backend на http://localhost:8000
echo.
echo ========================================
echo 📡 Backend запускается...
echo 📖 Документация: http://localhost:8000/docs
echo 🔄 Для остановки нажмите Ctrl+C
echo ========================================
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
