@echo off
cd /d "%~dp0"

echo ========================================
echo   BizPulse PRO - Запуск
echo ========================================
echo.

echo Запуск Backend...
start cmd /k "cd /d %~dp0 && python -m venv venv 2>nul && venv\Scripts\activate && pip install -q -r requirements.txt 2>nul && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 15 /nobreak >nul

echo Запуск Frontend...
start cmd /k "cd /d %~dp0\frontend && npm install 2>nul && npm run dev"

timeout /t 90 /nobreak >nul

echo.
echo Открываю браузер...
start http://localhost:3000
timeout /t 2 /nobreak >nul
start http://localhost:8000/docs

echo.
echo ========================================
echo   Готово!
echo ========================================
echo.
echo Должно открыться 2 окна:
echo - Backend (порт 8000)
echo - Frontend (порт 3000)
echo.
echo Если окна не открылись - запустите вручную:
echo 1. start_backend.bat
echo 2. start_frontend.bat
echo.
pause

