@echo off
chcp 65001 > nul
cls
echo.
echo ========================================
echo   🚀 ЗАПУСК BACKEND
echo ========================================
echo.

cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"

echo ✅ Активация виртуального окружения...
call venv\Scripts\activate.bat

echo.
echo ✅ Запуск FastAPI сервера...
echo.
echo 📡 Backend будет доступен на: http://localhost:8000
echo 📖 Документация API: http://localhost:8000/docs
echo.
echo ⚠️  Для остановки нажмите Ctrl+C
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
