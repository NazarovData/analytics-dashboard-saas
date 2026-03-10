@echo off
chcp 65001 >nul
echo ========================================
echo   ПРОВЕРКА СЕРВЕРОВ
echo ========================================
echo.

echo Проверяю бэкенд (http://localhost:8000/docs)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Backend работает!' -ForegroundColor Green; exit 0 } catch { Write-Host '❌ Backend НЕ работает!' -ForegroundColor Red; exit 1 }"
set backend_status=%errorlevel%

echo.
echo Проверяю фронтенд (http://localhost:3000)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Frontend работает!' -ForegroundColor Green; exit 0 } catch { Write-Host '❌ Frontend НЕ работает!' -ForegroundColor Red; exit 1 }"
set frontend_status=%errorlevel%

echo.
echo ========================================
if %backend_status%==0 if %frontend_status%==0 (
    echo ✅ Оба сервера работают!
    echo.
    echo Открываю браузеры...
    start msedge http://localhost:3000
    timeout /t 1 /nobreak >nul
    start msedge http://localhost:8000/docs
) else (
    echo ⚠️  Серверы не запущены или еще не готовы
    echo.
    echo Проверьте:
    echo 1. Запущены ли окна "Backend" и "Frontend"?
    echo 2. Есть ли ошибки в этих окнах?
    echo 3. Запустите ЗАПУСК.bat для запуска серверов
)
echo ========================================
echo.
pause



























