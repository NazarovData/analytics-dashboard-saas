@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск фронтенда и бэкенда через CMD
echo   с автоматическим открытием Edge
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Запускаю бэкенд в новом окне...
start "BizPulse Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [2/3] Жду 5 секунд перед запуском фронтенда...
timeout /t 5 /nobreak >nul

echo [3/3] Запускаю фронтенд в новом окне...
start "BizPulse Frontend" cmd /k "cd /d %~dp0 && cd frontend && npm run dev"

echo.
echo Проверяю готовность серверов перед открытием браузеров...
echo.

REM Проверяем готовность бэкенда
:check_backend_ready
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend готов!
    goto check_frontend_ready
)
timeout /t 2 /nobreak >nul
goto check_backend_ready

REM Проверяем готовность фронтенда
:check_frontend_ready
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Frontend готов!
    goto open_browsers
)
timeout /t 2 /nobreak >nul
goto check_frontend_ready

:open_browsers
echo.
echo Открываю браузер Edge...
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

echo.
echo ========================================
echo   ✅ Готово!
echo ========================================
echo.
echo Сервисы запущены в отдельных окнах:
echo - Backend: http://localhost:8000/docs
echo - Frontend: http://localhost:3000
echo.
echo Браузеры Edge открыты автоматически!
echo.
pause

