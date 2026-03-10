@echo off
REM Скрипт для ожидания готовности сервера и открытия браузера
REM Использование: wait_and_open.bat <URL> <задержка_в_секундах>
set url=%1
set delay=%2

timeout /t %delay% /nobreak >nul

:check_loop
powershell -Command "try { $response = Invoke-WebRequest -Uri '%url%' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    start msedge %url%
    exit /b 0
)
timeout /t 2 /nobreak >nul
goto check_loop



























