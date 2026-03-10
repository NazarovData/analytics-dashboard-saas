@echo off
chcp 65001 >nul
cls
color 0A
echo ╔══════════════════════════════════════════╗
echo ║   ФИНАЛЬНЫЙ ЗАПУСК С АВТООТКРЫТИЕМ      ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM ============================================
REM ШАГИ: Проверка → Запуск → Ожидание → Открытие
REM ============================================

echo [ШАГ 1/4] Проверяю окружение...
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ❌ Python не найден! Установите Python с python.org
    pause
    exit /b 1
)
echo ✅ Python OK

node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ❌ Node.js не найден! Установите Node.js с nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js OK

REM Создание venv и установка зависимостей
if not exist "venv\Scripts\activate.bat" (
    echo Создаю виртуальное окружение...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q --upgrade pip
    pip install -q uvicorn fastapi
    if exist "requirements.txt" pip install -q -r requirements.txt
)

cd frontend
if not exist "node_modules" (
    echo Устанавливаю зависимости фронтенда (2-5 минут)...
    call npm install
)
cd ..

echo.
echo [ШАГ 2/4] Запускаю серверы...
echo.

REM Запуск бэкенда
echo 🔧 Запускаю бэкенд (порт 8000)...
start "Backend - НЕ ЗАКРЫВАЙТЕ!" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && color 0E && echo ╔══════════════════════════════════════════╗ && echo ║           BACKEND СЕРВЕР                 ║ && echo ╚══════════════════════════════════════════╝ && echo. && echo Ждите: 'Uvicorn running on...' && echo. && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 || pause"

timeout /t 25 /nobreak >nul

REM Запуск фронтенда
echo 📊 Запускаю фронтенд (порт 3000)...
start "Frontend - НЕ ЗАКРЫВАЙТЕ!" cmd /k "cd /d %~dp0\frontend && color 0B && echo ╔══════════════════════════════════════════╗ && echo ║          FRONTEND СЕРВЕР                 ║ && echo ╚══════════════════════════════════════════╝ && echo. && echo Ждите: 'Local: http://localhost:3000' && echo. && npm run dev || pause"

echo.
echo [ШАГ 3/4] Жду готовности серверов...
echo Это может занять 30-120 секунд...
echo.

timeout /t 30 /nobreak >nul

REM Проверка готовности бэкенда
echo 🔍 Проверяю бэкенд (до 60 попыток)...
set backend_ready=0
for /L %%i in (1,1,60) do (
    powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Backend готов! ^(попытка %%i^)
        set backend_ready=1
        goto check_frontend_start
    )
    if %%i lss 60 (
        echo ⏳ Backend еще не готов... ^(попытка %%i/60^)
        timeout /t 2 /nobreak >nul
    )
)

:check_frontend_start
if %backend_ready%==0 (
    color 0E
    echo.
    echo ⚠️  ВНИМАНИЕ: Backend не отвечает!
    echo Проверьте окно "Backend - НЕ ЗАКРЫВАЙТЕ!" - есть ли ошибки?
    echo.
    pause
)

REM Проверка готовности фронтенда
echo 🔍 Проверяю фронтенд (до 60 попыток)...
set frontend_ready=0
for /L %%i in (1,1,60) do (
    powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Frontend готов! ^(попытка %%i^)
        set frontend_ready=1
        goto open_browsers_now
    )
    if %%i lss 60 (
        echo ⏳ Frontend еще не готов... ^(попытка %%i/60^)
        timeout /t 2 /nobreak >nul
    )
)

:open_browsers_now
if %frontend_ready%==0 (
    color 0E
    echo.
    echo ⚠️  ВНИМАНИЕ: Frontend не отвечает!
    echo Проверьте окно "Frontend - НЕ ЗАКРЫВАЙТЕ!" - есть ли ошибки?
    echo.
    pause
)

echo.
echo [ШАГ 4/4] Открываю браузеры Edge...
echo.

if %backend_ready%==1 if %frontend_ready%==1 (
    color 0A
    echo ╔══════════════════════════════════════════╗
    echo ║   ✅ ОБА СЕРВЕРА ГОТОВЫ!                ║
    echo ╚══════════════════════════════════════════╝
    echo.
    echo Открываю браузеры...
    
    REM Открываем браузеры
    start msedge http://localhost:3000
    timeout /t 2 /nobreak >nul
    start msedge http://localhost:8000/docs
    
    REM Проверка открылись ли браузеры
    timeout /t 2 /nobreak >nul
    tasklist | findstr /I "msedge.exe" >nul
    if errorlevel 1 (
        echo Пробую альтернативный способ...
        start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:3000
        timeout /t 1 /nobreak >nul
        start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:8000/docs
    )
    
    echo.
    echo ╔══════════════════════════════════════════╗
    echo ║          ✅ ГОТОВО!                     ║
    echo ╚══════════════════════════════════════════╝
    echo.
    echo 📊 Фронтенд: http://localhost:3000
    echo 🔧 Бэкенд:   http://localhost:8000/docs
    echo.
    echo Серверы работают в окнах:
    echo - "Backend - НЕ ЗАКРЫВАЙТЕ!"
    echo - "Frontend - НЕ ЗАКРЫВАЙТЕ!"
    echo.
    color 0A
) else (
    color 0E
    echo ╔══════════════════════════════════════════╗
    echo ║   ⚠️  СЕРВЕРЫ НЕ ГОТОВЫ!                ║
    echo ╚══════════════════════════════════════════╝
    echo.
    echo Проверьте окна серверов на ошибки!
    echo.
    echo Если нужна помощь - покажите мне текст из окон:
    echo - "Backend - НЕ ЗАКРЫВАЙТЕ!"
    echo - "Frontend - НЕ ЗАКРЫВАЙТЕ!"
    echo.
)

pause







