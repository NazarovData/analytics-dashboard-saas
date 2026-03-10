@echo off
chcp 65001 >nul
echo ========================================
echo   ЗАПУСК С ПРОВЕРКОЙ И ДИАГНОСТИКОЙ
echo ========================================
echo.

cd /d "%~dp0"

REM Проверка Python
echo [Проверка 1/4] Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден! Установите Python 3.11+
    pause
    exit /b 1
)
python --version
echo ✅ Python OK

REM Проверка Node.js
echo.
echo [Проверка 2/4] Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не найден! Установите Node.js 18+
    pause
    exit /b 1
)
node --version
echo ✅ Node.js OK

REM Проверка venv
echo.
echo [Проверка 3/4] Виртуальное окружение...
if not exist "venv\Scripts\activate.bat" (
    echo ⚠️  venv не найден, создаю...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Не удалось создать venv!
        pause
        exit /b 1
    )
)
echo ✅ venv OK

REM Проверка зависимостей Python
echo.
echo [Проверка 4/4] Зависимости Python...
call venv\Scripts\activate.bat
if not exist "venv\Scripts\uvicorn.exe" (
    echo ⚠️  Зависимости не установлены, устанавливаю...
    pip install -q -r requirements.txt
    if errorlevel 1 (
        echo ❌ Не удалось установить зависимости!
        pause
        exit /b 1
    )
)
echo ✅ Зависимости Python OK

REM Проверка зависимостей Node.js
echo.
echo [Проверка] Зависимости Node.js...
cd frontend
if not exist "node_modules" (
    echo ⚠️  node_modules не найден, устанавливаю...
    call npm install
    if errorlevel 1 (
        echo ❌ Не удалось установить зависимости!
        pause
        exit /b 1
    )
)
cd ..
echo ✅ Зависимости Node.js OK

echo.
echo ========================================
echo   ЗАПУСК СЕРВЕРОВ
echo ========================================
echo.

REM Запуск бэкенда
echo [1/2] Запускаю бэкенд...
start "Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && echo ✅ Backend запускается... && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Жду 15 секунд пока бэкенд запустится...
timeout /t 15 /nobreak >nul

REM Проверка бэкенда
echo Проверяю бэкенд...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Backend работает!'; exit 0 } catch { Write-Host '⚠️  Backend еще не готов, продолжаю...'; exit 1 }" 2>nul
if %errorlevel%==0 (
    echo ✅ Backend готов!
) else (
    echo ⚠️  Backend еще запускается, продолжаю...
)

REM Запуск фронтенда
echo.
echo [2/2] Запускаю фронтенд...
start "Frontend" cmd /k "cd /d %~dp0\frontend && echo ✅ Frontend запускается... && npm run dev"

echo Жду 20 секунд пока фронтенд запустится...
timeout /t 20 /nobreak >nul

REM Проверка фронтенда
echo Проверяю фронтенд...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Frontend работает!'; exit 0 } catch { Write-Host '⚠️  Frontend еще не готов'; exit 1 }" 2>nul
if %errorlevel%==0 (
    echo ✅ Frontend готов!
) else (
    echo ⚠️  Frontend еще запускается...
)

echo.
echo ========================================
echo   ОТКРЫВАЮ БРАУЗЕРЫ
echo ========================================
echo.

REM Ждем еще немного и открываем браузеры
timeout /t 5 /nobreak >nul

echo Открываю браузер Edge...
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

echo.
echo ========================================
echo   ✅ ГОТОВО!
echo ========================================
echo.
echo Фронтенд: http://localhost:3000
echo Бэкенд: http://localhost:8000/docs
echo.
echo ⚠️  ВАЖНО: Если браузеры не открылись или показывают ошибку:
echo 1. Проверьте окна "Backend" и "Frontend" - есть ли там ошибки?
echo 2. Подождите еще 10-20 секунд и обновите страницу в браузере
echo 3. Убедитесь что порты 3000 и 8000 не заняты другими программами
echo.
pause

