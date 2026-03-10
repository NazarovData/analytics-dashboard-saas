@echo off
chcp 65001 >nul
cls
echo ========================================
echo   ЗАПУСК С ДИАГНОСТИКОЙ
echo ========================================
echo.

cd /d "%~dp0"

REM Шаг 1: Проверка окружения
echo [1/7] Проверяю окружение...
python --version >nul 2>&1 || (echo ❌ Python не найден! && pause && exit /b 1)
node --version >nul 2>&1 || (echo ❌ Node.js не найден! && pause && exit /b 1)
echo ✅ Python и Node.js найдены

REM Шаг 2: Проверка venv
echo [2/7] Проверяю виртуальное окружение...
if not exist "venv\Scripts\activate.bat" (
    echo Создаю venv...
    python -m venv venv || (echo ❌ Ошибка создания venv! && pause && exit /b 1)
)
call venv\Scripts\activate.bat
echo ✅ Venv готов

REM Шаг 3: Установка зависимостей Python
echo [3/7] Устанавливаю зависимости Python...
pip install -q --upgrade pip
pip install -q uvicorn fastapi
if exist "requirements.txt" (
    echo Устанавливаю все зависимости...
    pip install -q -r requirements.txt
)
echo ✅ Зависимости Python установлены

REM Шаг 4: Установка зависимостей Node.js
echo [4/7] Устанавливаю зависимости Node.js...
cd frontend
if not exist "node_modules" (
    echo Устанавливаю npm пакеты (это займет время)...
    call npm install || (echo ❌ Ошибка установки! && pause && exit /b 1)
) else (
    call npm install
)
cd ..
echo ✅ Зависимости Node.js установлены

REM Шаг 5: Проверка портов
echo [5/7] Проверяю порты...
netstat -an | findstr :8000 >nul
if %errorlevel%==0 (
    echo ⚠️  Порт 8000 занят! Останавливаю процесс...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)

netstat -an | findstr :3000 >nul
if %errorlevel%==0 (
    echo ⚠️  Порт 3000 занят! Останавливаю процесс...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo ✅ Порты свободны

REM Шаг 6: Запуск бэкенда
echo [6/7] Запускаю бэкенд...
start "Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && echo ======================================== && echo   BACKEND ЗАПУСКАЕТСЯ && echo ======================================== && echo. && echo Ждите сообщения: 'Uvicorn running on http://0.0.0.0:8000' && echo. && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Жду 25 секунд пока бэкенд запустится...
timeout /t 25 /nobreak >nul

REM Проверка бэкенда
echo Проверяю бэкенд...
:check_backend
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop | Out-Null; Write-Host '✅ Backend готов!' } catch { Write-Host '⏳ Backend еще не готов...' }" 2>nul
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend работает!
    goto start_frontend
)
timeout /t 5 /nobreak >nul
goto check_backend

:start_frontend
REM Шаг 7: Запуск фронтенда
echo [7/7] Запускаю фронтенд...
start "Frontend" cmd /k "cd /d %~dp0\frontend && echo ======================================== && echo   FRONTEND ЗАПУСКАЕТСЯ && echo ======================================== && echo. && echo Ждите сообщения: 'Local: http://localhost:3000' && echo. && npm run dev"

echo Жду 35 секунд пока фронтенд запустится...
timeout /t 35 /nobreak >nul

REM Проверка фронтенда
echo Проверяю фронтенд...
:check_frontend
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop | Out-Null; Write-Host '✅ Frontend готов!' } catch { Write-Host '⏳ Frontend еще не готов...' }" 2>nul
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Frontend работает!
    goto open_browsers
)
timeout /t 5 /nobreak >nul
goto check_frontend

:open_browsers
echo.
echo ========================================
echo   ✅ ОБА СЕРВЕРА РАБОТАЮТ!
echo ========================================
echo.
echo Открываю браузеры Edge...
echo.

REM Пробуем несколько способов открытия браузера
start msedge http://localhost:3000 >nul 2>&1
timeout /t 1 /nobreak >nul

REM Если не открылся, пробуем через полный путь
tasklist | findstr /I "msedge.exe" >nul
if errorlevel 1 (
    echo Пробую альтернативный способ...
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:3000 >nul 2>&1
    if errorlevel 1 (
        start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" http://localhost:3000 >nul 2>&1
    )
)

timeout /t 1 /nobreak >nul
start msedge http://localhost:8000/docs >nul 2>&1
timeout /t 1 /nobreak >nul

REM Если все еще не открылся, пробуем через PowerShell
tasklist | findstr /I "msedge.exe" >nul
if errorlevel 1 (
    echo Пробую через PowerShell...
    powershell -Command "Start-Process msedge http://localhost:3000" >nul 2>&1
    timeout /t 1 /nobreak >nul
    powershell -Command "Start-Process msedge http://localhost:8000/docs" >nul 2>&1
)

echo.
echo ✅ ГОТОВО!
echo.
echo Фронтенд: http://localhost:3000
echo Бэкенд: http://localhost:8000/docs
echo.
echo ⚠️  ВАЖНО:
echo 1. Проверьте окна "Backend" и "Frontend"
echo 2. Должны быть сообщения "Uvicorn running" и "Local: http://localhost:3000"
echo 3. Если ошибки - покажите их мне
echo.
pause

