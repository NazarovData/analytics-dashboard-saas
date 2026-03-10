@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 ЗАПУСК BACKEND + FRONTEND
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Запуск Backend (порт 8000)...
start "Backend Server" cmd /k "call venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Запуск Frontend (порт 5173)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo ✅ Серверы запускаются...
echo ========================================
echo.
echo 📡 Backend:  http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo 🎨 Frontend: http://localhost:5173
echo.
echo Откроется 2 окна терминала
echo Для остановки закройте окна или нажмите Ctrl+C
echo.
echo ========================================

timeout /t 5 /nobreak >nul

echo Открываем браузер...
start http://localhost:5173

echo.
echo ✅ Готово! Система запущена
pause
