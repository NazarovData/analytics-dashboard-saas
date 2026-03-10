@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 ЗАПУСК ANALITIX AI
echo ========================================
echo.

echo 📋 Шаг 1/3: Установка reportlab...
call venv\Scripts\activate.bat
pip install reportlab xlsxwriter --quiet

echo.
echo 📋 Шаг 2/3: Запуск Backend...
start "Analitix AI Backend" cmd /k "venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo ⏳ Ждём запуска backend (5 секунд)...
timeout /t 5 /nobreak >nul

echo.
echo 📋 Шаг 3/3: Запуск Frontend...
start "Analitix AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ⏳ Ждём запуска frontend (10 секунд)...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo ✅ ВСЁ ЗАПУЩЕНО!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Docs:     http://localhost:8000/docs
echo.
echo Открываю браузер...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo Для остановки закройте окна терминалов
echo или нажмите Ctrl+C в каждом окне
echo.
pause
