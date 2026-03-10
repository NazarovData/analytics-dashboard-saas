@echo off
chcp 65001 >nul
echo ========================================
echo   ОТКРЫТИЕ В EDGE БРАУЗЕРЕ
echo ========================================
echo.

REM Проверяем готовность серверов
echo Проверяю серверы...

REM Проверка бэкенда
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null; Write-Host '✅ Backend готов!' } catch { Write-Host '❌ Backend не готов!' }"

REM Проверка фронтенда
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null; Write-Host '✅ Frontend готов!' } catch { Write-Host '❌ Frontend не готов!' }"

echo.
echo Открываю браузер Edge...
echo.

REM Открытие Edge браузера
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

echo ✅ Браузеры Edge открыты!
echo.
echo Фронтенд: http://localhost:3000
echo Бэкенд: http://localhost:8000/docs
echo.
pause







