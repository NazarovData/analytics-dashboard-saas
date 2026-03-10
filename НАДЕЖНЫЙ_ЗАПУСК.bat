@echo off
chcp 65001 >nul
cls
echo ========================================
echo   НАДЕЖНЫЙ ЗАПУСК С ПРОВЕРКАМИ
echo ========================================
echo.

cd /d "%~dp0"

REM ============================================
REM ШАГ 1: ПРОВЕРКА ОКРУЖЕНИЯ
REM ============================================
echo [ШАГ 1/8] Проверяю окружение...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ОШИБКА: Python не найден!
    echo Установите Python с python.org
    pause
    exit /b 1
)
python --version
echo ✅ Python найден

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ОШИБКА: Node.js не найден!
    echo Установите Node.js с nodejs.org
    pause
    exit /b 1
)
node --version
echo ✅ Node.js найден
echo.

REM ============================================
REM ШАГ 2: ОСТАНОВКА СТАРЫХ ПРОЦЕССОВ
REM ============================================
echo [ШАГ 2/8] Останавливаю старые процессы...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Останавливаю процесс на порту 8000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Останавливаю процесс на порту 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 3 /nobreak >nul
echo ✅ Старые процессы остановлены
echo.

REM ============================================
REM ШАГ 3: ПРОВЕРКА И СОЗДАНИЕ VENV
REM ============================================
echo [ШАГ 3/8] Проверяю виртуальное окружение...
if not exist "venv\Scripts\activate.bat" (
    echo Создаю виртуальное окружение...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ ОШИБКА создания venv!
        pause
        exit /b 1
    )
    echo ✅ Venv создан
) else (
    echo ✅ Venv существует
)
call venv\Scripts\activate.bat
echo.

REM ============================================
REM ШАГ 4: УСТАНОВКА ЗАВИСИМОСТЕЙ PYTHON
REM ============================================
echo [ШАГ 4/8] Устанавливаю зависимости Python...
pip install -q --upgrade pip
echo Устанавливаю uvicorn и fastapi...
pip install -q uvicorn fastapi
if exist "requirements.txt" (
    echo Устанавливаю все зависимости из requirements.txt...
    pip install -q -r requirements.txt
)
echo ✅ Зависимости Python установлены
echo.

REM ============================================
REM ШАГ 5: УСТАНОВКА ЗАВИСИМОСТЕЙ NODE.JS
REM ============================================
echo [ШАГ 5/8] Устанавливаю зависимости Node.js...
cd frontend
if not exist "node_modules" (
    echo Устанавливаю npm пакеты (это займет 2-5 минут)...
    call npm install
    if errorlevel 1 (
        echo ❌ ОШИБКА установки npm пакетов!
        cd ..
        pause
        exit /b 1
    )
) else (
    echo Проверяю зависимости...
    call npm install
)
cd ..
echo ✅ Зависимости Node.js установлены
echo.

REM ============================================
REM ШАГ 6: ЗАПУСК БЭКЕНДА
REM ============================================
echo [ШАГ 6/8] Запускаю бэкенд...
echo.
echo ⚠️  ВАЖНО: Проверьте окно "Backend" после запуска!
echo Должно появиться сообщение: "Uvicorn running on "
echo Если есть ошибки - покажите их мне!
echo.
start "Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && echo ======================================== && echo   BACKEND ЗАПУСКАЕТСЯ && echo ======================================== && echo. && echo ЖДИТЕ СООБЩЕНИЯ: 'Uvicorn running on http://0.0.0.0:8000' && echo. && echo Если видите ошибки - скопируйте их и покажите! && echo. && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Жду 30 секунд пока бэкенд запустится...
timeout /t 30 /nobreak >nul

REM Проверка бэкенда - ждем до готовности
echo Проверяю готовность бэкенда...
set backend_ready=0
set attempts=0
:check_backend_loop
set /a attempts+=1
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend готов! (попытка %attempts%)
    set backend_ready=1
    goto backend_ready
)
if %attempts% geq 20 (
    echo.
    echo ⚠️  ВНИМАНИЕ: Backend не отвечает после 20 попыток!
    echo Проверьте окно "Backend" - есть ли ошибки?
    echo.
    echo Продолжаю запуск фронтенда...
    goto start_frontend
)
echo ⏳ Backend еще не готов... (попытка %attempts%/20)
timeout /t 3 /nobreak >nul
goto check_backend_loop

:backend_ready
echo ✅ Backend работает!
echo.

REM ============================================
REM ШАГ 7: ЗАПУСК ФРОНТЕНДА
REM ============================================
:start_frontend
echo [ШАГ 7/8] Запускаю фронтенд...
echo.
echo ⚠️  ВАЖНО: Проверьте окно "Frontend" после запуска!
echo Должно появиться сообщение: "Local: http://localhost:3000"
echo Если есть ошибки - покажите их мне!
echo.
start "Frontend" cmd /k "cd /d %~dp0\frontend && echo ======================================== && echo   FRONTEND ЗАПУСКАЕТСЯ && echo ======================================== && echo. && echo ЖДИТЕ СООБЩЕНИЯ: 'Local: http://localhost:3000' && echo. && echo Если видите ошибки - скопируйте их и покажите! && echo. && npm run dev"

echo Жду 40 секунд пока фронтенд запустится...
timeout /t 40 /nobreak >nul

REM Проверка фронтенда - ждем до готовности
echo Проверяю готовность фронтенда...
set frontend_ready=0
set attempts=0
:check_frontend_loop
set /a attempts+=1
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Frontend готов! (попытка %attempts%)
    set frontend_ready=1
    goto frontend_ready
)
if %attempts% geq 20 (
    echo.
    echo ⚠️  ВНИМАНИЕ: Frontend не отвечает после 20 попыток!
    echo Проверьте окно "Frontend" - есть ли ошибки?
    echo.
    goto open_browsers_anyway
)
echo ⏳ Frontend еще не готов... (попытка %attempts%/20)
timeout /t 3 /nobreak >nul
goto check_frontend_loop

:frontend_ready
echo ✅ Frontend работает!
echo.

REM ============================================
REM ШАГ 8: ОТКРЫТИЕ БРАУЗЕРОВ
REM ============================================
:open_browsers_anyway
echo [ШАГ 8/8] Открываю браузеры Edge...
echo.

if %backend_ready%==1 if %frontend_ready%==1 (
    echo ✅ Оба сервера готовы! Открываю браузеры...
) else (
    echo ⚠️  Серверы могут быть еще не готовы, но открываю браузеры...
    echo Если увидите ошибку - подождите 30-60 секунд и обновите страницу (F5)
)

echo.
echo Запускаю скрипт открытия браузеров...
call ОТКРЫТЬ_БРАУЗЕРЫ.bat

echo.
echo ========================================
echo   ✅ ЗАПУСК ЗАВЕРШЕН!
echo ========================================
echo.
echo Фронтенд: http://localhost:3000
echo Бэкенд: http://localhost:8000/docs
echo.
echo ⚠️  ВАЖНО:
echo 1. Проверьте окна "Backend" и "Frontend"
echo 2. Должны быть сообщения:
echo    - Backend: "Uvicorn running on http://0.0.0.0:8000"
echo    - Frontend: "Local: http://localhost:3000"
echo 3. Если браузеры показывают ошибку:
echo    - Подождите еще 30-60 секунд
echo    - Обновите страницу (F5)
echo    - Проверьте окна серверов на ошибки
echo.
echo Если проблема остается - покажите мне:
echo - Что написано в окне "Backend"
echo - Что написано в окне "Frontend"
echo.
pause

