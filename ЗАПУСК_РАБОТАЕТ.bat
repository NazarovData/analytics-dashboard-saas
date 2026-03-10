@echo off
chcp 65001 >nul
cls
color 0A
echo ╔══════════════════════════════════════════╗
echo ║        ЗАПУСК - ПРОСТОЕ РЕШЕНИЕ         ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Проверка
if not exist "venv\Scripts\python.exe" (
    echo Создаю venv...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q uvicorn fastapi
)

if not exist "frontend\node_modules" (
    echo Устанавливаю зависимости...
    cd frontend
    call npm install
    cd ..
)

echo [1/2] Запускаю BACKEND...
start "BACKEND - http://localhost:8000" cmd /k "color 0E && cd /d %~dp0 && call venv\Scripts\activate.bat && echo ╔══════════════════════════════════════════╗ && echo ║     BACKEND ЗАПУЩЕН!                    ║ && echo ║     http://localhost:8000/docs          ║ && echo ╚══════════════════════════════════════════╝ && echo. && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 25 /nobreak >nul

echo [2/2] Запускаю FRONTEND...
start "FRONTEND - http://localhost:3000" cmd /k "color 0B && cd /d %~dp0\frontend && echo ╔══════════════════════════════════════════╗ && echo ║     FRONTEND ЗАПУЩЕН!                   ║ && echo ║     http://localhost:3000               ║ && echo ╚══════════════════════════════════════════╝ && echo. && npm run dev"

echo.
echo Жду 40 секунд пока серверы запустятся...
timeout /t 40 /nobreak >nul

REM Создаем HTML файл с ссылками
echo ^<!DOCTYPE html^>^<html^>^<head^>^<meta charset="UTF-8"^>^<title^>Открыть Серверы^</title^>^<style^>body{font-family:Arial;background:linear-gradient(135deg,#667eea 0%%,#764ba2 100%%);min-height:100vh;display:flex;justify-content:center;align-items:center;margin:0;padding:20px}.container{background:white;border-radius:20px;padding:40px;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;max-width:500px;width:100%%}h1{color:#333;margin-bottom:30px}.button{display:block;padding:25px;margin:20px 0;background:linear-gradient(135deg,#667eea 0%%,#764ba2 100%%);color:white;text-decoration:none;border-radius:15px;font-size:20px;font-weight:bold;transition:all 0.3s;box-shadow:0 5px 20px rgba(102,126,234,0.4)}button:hover,.button:hover{transform:translateY(-3px);box-shadow:0 8px 25px rgba(102,126,234,0.6)}.status{margin-top:30px;padding:20px;background:#f0f0f0;border-radius:10px;font-size:14px}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🚀 Серверы Запущены!^</h1^>^<a href="http://localhost:3000" class="button" target="_blank"^>📊 Открыть Фронтенд^</a^>^<a href="http://localhost:8000/docs" class="button" target="_blank"^>🔧 Открыть API Документацию^</a^>^<div class="status"^>^<p^>Нажмите на кнопку выше чтобы открыть^</p^>^<p style="font-size:12px;color:#999"^>Или скопируйте ссылки:^<br^>http://localhost:3000^<br^>http://localhost:8000/docs^</p^>^</div^>^</div^>^</body^>^</html^> > ОТКРЫТЬ_САЙТ.html

REM Открываем HTML файл
start ОТКРЫТЬ_САЙТ.html

echo.
color 0A
echo ╔══════════════════════════════════════════╗
echo ║           ✅ ГОТОВО!                    ║
echo ╚══════════════════════════════════════════╝
echo.
echo Откроется страница с кнопками!
echo Нажмите на кнопку чтобы открыть сайт.
echo.
echo Или скопируйте эти ссылки в браузер:
echo.
echo 📊 ФРОНТЕНД:
echo http://localhost:3000
echo.
echo 🔧 БЭКЕНД:
echo http://localhost:8000/docs
echo.
echo Серверы работают в окнах:
echo - "BACKEND - http://localhost:8000"
echo - "FRONTEND - http://localhost:3000"
echo.
pause







