@echo off
chcp 65001 >nul
echo ====================================
echo 🚀 ЗАПУСК BIZPULSE PRO - ФАЗА 1
echo ====================================
echo.

cd /d "%~dp0"

echo [Шаг 1] Запуск Backend сервера...
start "BizPulse Backend" cmd /k "venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [Шаг 2] Ожидание 5 секунд для запуска backend...
timeout /t 5 /nobreak >nul

echo [Шаг 3] Запуск Frontend сервера...
start "BizPulse Frontend" cmd /k "cd frontend && npm run dev"

echo [Шаг 4] Ожидание 10 секунд для запуска frontend...
timeout /t 10 /nobreak >nul

echo [Шаг 5] Открытие браузера...
start msedge http://localhost:3000

echo.
echo ====================================
echo ✅ BIZPULSE PRO ЗАПУЩЕН!
echo ====================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Для остановки закройте окна серверов.
echo.
pause






