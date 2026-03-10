@echo off
chcp 65001 >nul
cls
echo ========================================
echo   ЗАПУСК ВСЕГО ВМЕСТЕ
echo ========================================
echo.

cd /d "%~dp0"

REM Быстрая проверка
python --version >nul 2>&1 || (echo ❌ Python не найден! && pause && exit /b 1)
node --version >nul 2>&1 || (echo ❌ Node.js не найден! && pause && exit /b 1)

if not exist "venv\Scripts\activate.bat" (
    echo Создаю виртуальное окружение...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q -r requirements.txt
)

echo.
echo Запускаю бэкенд и фронтенд...
echo.

REM Запуск бэкенда
start "Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 15 /nobreak >nul

REM Запуск фронтенда
start "Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

timeout /t 25 /nobreak >nul

echo Проверяю готовность и открываю браузеры...
echo.

REM Проверка готовности и открытие браузеров
:check
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null; Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if %errorlevel%==0 (
    echo ✅ Серверы готовы! Открываю браузеры Edge...
    echo.
    
    REM Открываем браузер несколькими способами для надежности
    start msedge http://localhost:3000 >nul 2>&1
    timeout /t 1 /nobreak >nul
    
    REM Проверяем открылся ли браузер, если нет - пробуем альтернативные способы
    tasklist | findstr /I "msedge.exe" >nul
    if errorlevel 1 (
        start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:3000 >nul 2>&1
        if errorlevel 1 (
            start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" http://localhost:3000 >nul 2>&1
        )
        if errorlevel 1 (
            powershell -Command "Start-Process msedge http://localhost:3000" >nul 2>&1
        )
    )
    
    timeout /t 1 /nobreak >nul
    start msedge http://localhost:8000/docs >nul 2>&1
    timeout /t 1 /nobreak >nul
    
    REM Дополнительная попытка через PowerShell если нужно
    tasklist | findstr /I "msedge.exe" >nul
    if errorlevel 1 (
        powershell -Command "Start-Process msedge http://localhost:8000/docs" >nul 2>&1
    )
    echo.
    echo ✅ Готово! Браузеры открыты.
    echo.
    echo Фронтенд: http://localhost:3000
    echo Бэкенд: http://localhost:8000/docs
    echo.
    pause
    exit /b 0
)

timeout /t 3 /nobreak >nul
goto check
