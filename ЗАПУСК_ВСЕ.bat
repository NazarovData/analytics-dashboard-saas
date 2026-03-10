@echo off
chcp 65001 >nul
cls
echo ========================================
echo   ЗАПУСК ФРОНТЕНДА И БЭКЕНДА ВМЕСТЕ
echo ========================================
echo.

cd /d "%~dp0"

REM Проверка окружения
echo [1/4] Проверяю окружение...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден!
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не найден!
    pause
    exit /b 1
)

if not exist "venv\Scripts\activate.bat" (
    echo ⚠️  Создаю виртуальное окружение...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q -r requirements.txt
)

echo ✅ Окружение готово
echo.

echo [2/4] Запускаю бэкенд...
start "BizPulse Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && echo ✅ Backend запускается на http://localhost:8000 && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Жду 15 секунд...
timeout /t 15 /nobreak >nul

echo [3/4] Запускаю фронтенд...
start "BizPulse Frontend" cmd /k "cd /d %~dp0\frontend && echo ✅ Frontend запускается на http://localhost:3000 && npm run dev"

echo Жду 25 секунд пока серверы запустятся...
timeout /t 25 /nobreak >nul

echo.
echo [4/4] Проверяю готовность серверов и открываю браузеры...
echo.

REM Проверка и открытие браузеров
:check_servers
set backend_ready=0
set frontend_ready=0

REM Проверка бэкенда
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 set backend_ready=1

REM Проверка фронтенда
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 set frontend_ready=1

if %backend_ready%==1 if %frontend_ready%==1 (
    echo ✅ Оба сервера готовы!
    echo.
    echo Открываю браузеры Edge...
    start msedge http://localhost:3000
    timeout /t 1 /nobreak >nul
    start msedge http://localhost:8000/docs
    echo.
    echo ========================================
    echo   ✅ ГОТОВО!
    echo ========================================
    echo.
    echo Фронтенд: http://localhost:3000
    echo Бэкенд: http://localhost:8000/docs
    echo.
    echo Серверы работают в окнах "BizPulse Backend" и "BizPulse Frontend"
    echo Закройте это окно если хотите.
    echo.
    pause
    exit /b 0
)

echo ⏳ Жду готовности серверов... (проверяю каждые 3 секунды)
timeout /t 3 /nobreak >nul
goto check_servers



























