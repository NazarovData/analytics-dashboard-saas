@echo off
cd /d "%~dp0"

echo Запуск Backend...
start "Backend" cmd /k "cd /d %CD% && if exist venv (venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) else (python -m venv venv && venv\Scripts\activate && pip install -q -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000)"

timeout /t 10 /nobreak >nul

echo Запуск Frontend...
start "Frontend" cmd /k "cd /d %CD%\frontend && if exist node_modules (npm run dev) else (npm install && npm run dev)"

timeout /t 90 /nobreak >nul

echo Открываю браузер...
start http://localhost:3000
start http://localhost:8000/docs

echo Готово! Откройте http://localhost:3000
pause

