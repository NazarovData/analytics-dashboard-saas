@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║   ЗАПУСК БЕЗ PANDAS                     ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/5] Проверяю Python...
python --version
if errorlevel 1 (
    echo ❌ Python не найден!
    pause
    exit /b 1
)

echo.
echo [2/5] Активирую venv...
if not exist venv (
    echo Создаю venv...
    python -m venv venv
)
call venv\Scripts\activate.bat

echo.
echo [3/5] Устанавливаю только базовые пакеты (без pandas)...
pip install -q fastapi uvicorn python-multipart >nul 2>&1

echo.
echo [4/5] Запускаю Backend...
start "Backend Server" cmd /k "cd /d "%~dp0" && venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Жду 30 секунд для запуска backend...
timeout /t 30 /nobreak >nul

echo.
echo [5/5] Запускаю Frontend...
cd frontend
start "Frontend Server" cmd /k "npm run dev"

echo Жду 40 секунд для запуска frontend...
timeout /t 40 /nobreak >nul

echo.
echo Проверяю серверы и открываю браузеры...
cd ..

:check_backend
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto check_backend
)

:check_frontend
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto check_frontend
)

echo.
echo ✅ Серверы готовы! Открываю браузеры...
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

echo.
echo ╔══════════════════════════════════════════╗
echo ║   ✅ ГОТОВО!                            ║
echo ╚══════════════════════════════════════════╝
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000/docs
echo.
pause

