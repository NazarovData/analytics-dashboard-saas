@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo    🚀 ANALITIX AI - ЗАПУСК
echo ========================================
echo.
echo Запускаю проект...
echo.

REM Активация venv
call venv\Scripts\activate.bat

REM Установка reportlab если нет
pip show reportlab >nul 2>&1
if errorlevel 1 (
    echo 📦 Установка reportlab...
    pip install reportlab xlsxwriter --quiet
)

REM Запуск backend в новом окне
echo ✅ Запуск Backend...
start "Backend" cmd /k "cd /d "%CD%" && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Ждём 5 секунд
timeout /t 5 /nobreak >nul

REM Запуск frontend в новом окне
echo ✅ Запуск Frontend...
start "Frontend" cmd /k "cd /d "%CD%\frontend" && npm run dev"

REM Ждём 10 секунд
timeout /t 10 /nobreak >nul

REM Открываем браузер
echo ✅ Открываю браузер...
start http://localhost:3000

echo.
echo ========================================
echo    ✅ ГОТОВО!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Docs:     http://localhost:8000/docs
echo.
echo Для остановки закройте окна Backend и Frontend
echo.
pause
