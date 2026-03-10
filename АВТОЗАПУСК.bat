@echo off
chcp 65001 >nul
cls
color 0A
echo ╔══════════════════════════════════════════════════╗
echo ║   АВТОЗАПУСК - ФИНАЛЬНОЕ РЕШЕНИЕ                ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo Запускаю серверы...
echo Подождите 2-3 минуты!
echo.

cd /d "%~dp0"

REM Установка зависимостей если нужно
if not exist "venv\Scripts\python.exe" (
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q uvicorn fastapi
)

if not exist "frontend\node_modules" (
    cd frontend
    call npm install
    cd ..
)

REM Запуск бэкенда
start "Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Ждем 30 секунд
echo [1/5] Бэкенд запускается... Жду 30 сек
timeout /t 30 /nobreak >nul

REM Запуск фронтенда
start "Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

REM Ждем 45 секунд
echo [2/5] Фронтенд запускается... Жду 45 сек
timeout /t 45 /nobreak >nul

REM Еще подождем
echo [3/5] Дополнительное ожидание... Жду 30 сек
timeout /t 30 /nobreak >nul

REM Проверка и открытие
echo [4/5] Проверяю и открываю браузеры...

for /L %%i in (1,1,40) do (
    powershell -Command "$ErrorActionPreference='SilentlyContinue'; try { Invoke-WebRequest 'http://localhost:8000/docs' -TimeoutSec 1 -UseBasicParsing | Out-Null; Invoke-WebRequest 'http://localhost:3000' -TimeoutSec 1 -UseBasicParsing | Out-Null; Start-Process msedge 'http://localhost:3000'; Start-Sleep 2; Start-Process msedge 'http://localhost:8000/docs'; Write-Host '✅ Браузеры открыты!'; exit 0 } catch { Write-Host '⏳ Попытка %%i/40...'; Start-Sleep 3; exit 1 }" >nul 2>&1
    if not errorlevel 1 goto success
)

echo ⚠️  Серверы не ответили, но открываю браузеры...
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

:success
echo.
echo [5/5] ✅ Готово!
echo.
echo 📊 http://localhost:3000
echo 🔧 http://localhost:8000/docs
echo.
echo Если браузер показывает ошибку:
echo - Подождите еще 30 секунд
echo - Обновите страницу (F5)
echo.
pause







