@echo off
chcp 65001 >nul
cls
echo ========================================
echo   ЗАПУСК ЧЕРЕЗ СЛУЖБУ/СЕРВИС
echo ========================================
echo.

cd /d "%~dp0"

REM Проверка и создание venv
if not exist "venv\Scripts\activate.bat" (
    echo Создаю виртуальное окружение...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q uvicorn fastapi
    if exist "requirements.txt" pip install -q -r requirements.txt
)

REM Активация venv и запуск бэкенда в фоне
echo Запускаю бэкенд как сервис...
start /b cmd /c "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" > backend.log 2>&1

REM Запуск фронтенда в фоне
echo Запускаю фронтенд как сервис...
cd frontend
start /b cmd /c "cd /d %~dp0\frontend && npm run dev" > ..\frontend.log 2>&1
cd ..

echo.
echo ✅ Серверы запущены как фоновые процессы!
echo.
echo Логи:
echo - Backend: backend.log
echo - Frontend: frontend.log
echo.
echo Проверяю готовность и открываю браузеры...
echo.

REM Ждем и проверяем готовность - УВЕЛИЧЕННОЕ ВРЕМЯ ОЖИДАНИЯ
echo Жду 45 секунд пока серверы запустятся...
timeout /t 45 /nobreak >nul

echo Проверяю готовность серверов (до 60 секунд)...
set attempts=0
:check
set /a attempts+=1
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop | Out-Null; Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if %errorlevel%==0 (
    echo ✅ Серверы готовы! (попытка %attempts%)
    echo Открываю Edge...
    start msedge http://localhost:3000 >nul 2>&1
    timeout /t 2 /nobreak >nul
    start msedge http://localhost:8000/docs >nul 2>&1
    
    REM Дополнительные попытки открытия браузера
    tasklist | findstr /I "msedge.exe" >nul
    if errorlevel 1 (
        start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:3000 >nul 2>&1
        timeout /t 1 /nobreak >nul
        start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:8000/docs >nul 2>&1
    )
    echo.
    echo ✅ Готово!
    echo.
    echo Серверы работают в фоне.
    echo Для остановки используйте: ОСТАНОВИТЬ_СЕРВИСЫ.bat
    echo.
    pause
    exit /b 0
)

timeout /t 5 /nobreak >nul
goto check

