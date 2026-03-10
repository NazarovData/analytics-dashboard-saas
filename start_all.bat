@echo off
chcp 65001 > nul
cls
echo.
echo ========================================
echo   🚀 ЗАПУСК ПОЛНОЙ СИСТЕМЫ
echo ========================================
echo.
echo 🔧 Запускаю Backend и Frontend...
echo.

REM Запуск Backend в новом окне
start "🔧 Backend - FastAPI" cmd /k "cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS" && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Небольшая пауза перед запуском frontend
timeout /t 3 /nobreak > nul

REM Запуск Frontend в новом окне
start "🎨 Frontend - React + Vite" cmd /k "cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS\frontend" && npm run dev"

echo.
echo ========================================
echo   ✅ СИСТЕМА ЗАПУЩЕНА!
echo ========================================
echo.
echo 📡 Backend:  http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo 🌐 Frontend: http://localhost:5173
echo.
echo ℹ️  Открыты 2 окна терминала:
echo    - Backend (FastAPI)
echo    - Frontend (React + Vite)
echo.
echo 💡 Совет: Подождите 10-15 секунд пока всё запустится
echo          Затем откройте http://localhost:5173
echo.
echo 🛑 Для остановки: закройте оба окна терминала
echo.
echo ========================================
echo.

timeout /t 5
start http://localhost:5173

echo 🎉 Браузер откроется автоматически через 5 секунд...
echo.
pause
