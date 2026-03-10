@echo off
chcp 65001 >nul
cls
echo ========================================
echo   ПРОСТОЙ ЗАПУСК С АВТООТКРЫТИЕМ
echo ========================================
echo.

cd /d "%~dp0"

REM Быстрая проверка
python --version >nul 2>&1 || (echo ❌ Python не найден! && pause && exit /b 1)
node --version >nul 2>&1 || (echo ❌ Node.js не найден! && pause && exit /b 1)

REM Создание venv если нужно
if not exist "venv\Scripts\activate.bat" (
    echo Создаю виртуальное окружение...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q uvicorn fastapi
    if exist "requirements.txt" pip install -q -r requirements.txt
)

REM Установка зависимостей Node.js если нужно
cd frontend
if not exist "node_modules" (
    echo Устанавливаю зависимости фронтенда...
    call npm install
)
cd ..

echo.
echo Запускаю бэкенд...
start "Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Жду 20 секунд...
timeout /t 20 /nobreak >nul

echo Запускаю фронтенд...
start "Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo Жду пока серверы запустятся и проверяю готовность...
echo Это может занять 30-60 секунд...
echo.

REM Проверяем готовность бэкенда
echo Проверяю бэкенд...
set backend_ready=0
set attempts=0
:check_backend
set /a attempts+=1
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend готов! (попытка %attempts%)
    set backend_ready=1
    goto check_frontend
)
if %attempts% geq 30 (
    echo ⚠️  Backend не отвечает после 30 попыток
    echo Проверьте окно "Backend" - есть ли ошибки?
    goto check_frontend
)
echo ⏳ Backend еще не готов... (попытка %attempts%/30)
timeout /t 2 /nobreak >nul
goto check_backend

REM Проверяем готовность фронтенда
:check_frontend
echo Проверяю фронтенд...
set frontend_ready=0
set attempts=0
:check_frontend_loop
set /a attempts+=1
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Frontend готов! (попытка %attempts%)
    set frontend_ready=1
    goto open_browsers
)
if %attempts% geq 30 (
    echo ⚠️  Frontend не отвечает после 30 попыток
    echo Проверьте окно "Frontend" - есть ли ошибки?
    goto open_browsers
)
echo ⏳ Frontend еще не готов... (попытка %attempts%/30)
timeout /t 2 /nobreak >nul
goto check_frontend_loop

REM Открываем браузеры только когда серверы готовы
:open_browsers
echo.
if %backend_ready%==1 if %frontend_ready%==1 (
    echo ✅ Оба сервера готовы! Открываю браузеры Edge...
) else (
    echo ⚠️  Серверы могут быть еще не готовы, но открываю браузеры...
    echo Если увидите ошибку - подождите еще 30 секунд и обновите страницу (F5)
)
echo.

REM Открываем браузеры
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

REM Если не открылся - пробуем альтернативные способы
timeout /t 2 /nobreak >nul
tasklist | findstr /I "msedge.exe" >nul
if errorlevel 1 (
    echo Пробую альтернативный способ открытия...
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:3000
    timeout /t 1 /nobreak >nul
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:8000/docs
)

echo.
echo ✅ Готово!
echo.
echo Фронтенд: http://localhost:3000
echo Бэкенд: http://localhost:8000/docs
echo.
echo Если браузеры не открылись - запустите: ПРОСТОЙ_ОТКРЫТЬ.bat
echo.
pause
