@echo off
chcp 65001 >nul
cls
color 0B
echo ╔══════════════════════════════════════════╗
echo ║     ШАГ 2: ОТКРЫТИЕ БРАУЗЕРА            ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo Проверяю серверы...
echo.

REM Проверка бэкенда
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Backend работает!' -ForegroundColor Green } catch { Write-Host '❌ Backend НЕ работает!' -ForegroundColor Red; exit 1 }"
if errorlevel 1 (
    color 0C
    echo.
    echo ═══════════════════════════════════════════
    echo   ❌ BACKEND НЕ ГОТОВ!
    echo ═══════════════════════════════════════════
    echo.
    echo Проверьте окно "🔧 BACKEND":
    echo 1. Открыто ли оно?
    echo 2. Видите ли сообщение "Uvicorn running on..."?
    echo 3. Есть ли ошибки?
    echo.
    echo Подождите еще 30 секунд и запустите этот файл снова.
    echo.
    pause
    exit /b 1
)

REM Проверка фронтенда
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Frontend работает!' -ForegroundColor Green } catch { Write-Host '❌ Frontend НЕ работает!' -ForegroundColor Red; exit 1 }"
if errorlevel 1 (
    color 0C
    echo.
    echo ═══════════════════════════════════════════
    echo   ❌ FRONTEND НЕ ГОТОВ!
    echo ═══════════════════════════════════════════
    echo.
    echo Проверьте окно "📊 FRONTEND":
    echo 1. Открыто ли оно?
    echo 2. Видите ли сообщение "Local: http://localhost:3000"?
    echo 3. Есть ли ошибки?
    echo.
    echo Подождите еще 30 секунд и запустите этот файл снова.
    echo.
    pause
    exit /b 1
)

echo.
color 0A
echo ╔══════════════════════════════════════════╗
echo ║     ✅ ОБА СЕРВЕРА РАБОТАЮТ!            ║
echo ╚══════════════════════════════════════════╝
echo.
echo Открываю браузеры Edge...
echo.

REM Открытие браузеров
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

echo ✅ Браузеры открыты!
echo.
echo 📊 Фронтенд: http://localhost:3000
echo 🔧 Бэкенд: http://localhost:8000/docs
echo.
pause







