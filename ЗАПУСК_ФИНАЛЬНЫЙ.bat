@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║     АВТОЗАПУСК С БРАУЗЕРОМ EDGE         ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Проверка Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден!
    pause
    exit /b 1
)

REM Проверка Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не найден!
    pause
    exit /b 1
)

REM Создание venv
if not exist "venv\Scripts\python.exe" (
    echo Создаю venv...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q uvicorn fastapi
)

REM Установка npm зависимостей
if not exist "frontend\node_modules" (
    echo Устанавливаю npm зависимости...
    cd frontend
    call npm install
    cd ..
)

echo ╔══════════════════════════════════════════╗
echo ║     ЗАПУСК СЕРВЕРОВ                     ║
echo ╚══════════════════════════════════════════╝
echo.

REM Запуск бэкенда
echo [1/2] Запускаю бэкенд...
start "🔧 BACKEND - http://localhost:8000" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Ждем 30 секунд
echo Жду 30 секунд...
timeout /t 30 /nobreak >nul

REM Запуск фронтенда  
echo [2/2] Запускаю фронтенд...
start "📊 FRONTEND - http://localhost:3000" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo ╔══════════════════════════════════════════╗
echo ║     ПРОВЕРКА СЕРВЕРОВ                   ║
echo ╚══════════════════════════════════════════╝
echo.

REM Ждем фронтенд
timeout /t 40 /nobreak >nul

REM Проверяем бэкенд (максимум 30 попыток)
echo Проверяю бэкенд...
set backend_ok=0
for /L %%i in (1,1,30) do (
    curl -s http://localhost:8000/docs >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Backend работает!
        set backend_ok=1
        goto check_frontend
    )
    echo ⏳ Попытка %%i/30...
    timeout /t 2 /nobreak >nul
)

:check_frontend
REM Проверяем фронтенд (максимум 30 попыток)
echo Проверяю фронтенд...
set frontend_ok=0
for /L %%i in (1,1,30) do (
    curl -s http://localhost:3000 >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Frontend работает!
        set frontend_ok=1
        goto open_browser
    )
    echo ⏳ Попытка %%i/30...
    timeout /t 2 /nobreak >nul
)

:open_browser
echo.
echo ╔══════════════════════════════════════════╗
echo ║     ОТКРЫТИЕ БРАУЗЕРА                   ║
echo ╚══════════════════════════════════════════╝
echo.

if %backend_ok%==1 if %frontend_ok%==1 (
    echo ✅ Серверы готовы! Открываю Edge...
    timeout /t 2 /nobreak >nul
    start msedge http://localhost:3000
    timeout /t 2 /nobreak >nul
    start msedge http://localhost:8000/docs
    echo.
    echo ✅ ГОТОВО!
    echo 📊 http://localhost:3000
    echo 🔧 http://localhost:8000/docs
) else (
    echo ⚠️  Серверы не запустились!
    echo Проверьте окна серверов - там могут быть ошибки.
)

echo.
pause







