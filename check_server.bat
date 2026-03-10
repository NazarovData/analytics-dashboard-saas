@echo off
REM Проверка доступности сервера
REM Использование: check_server.bat http://localhost:3000
set url=%1
set max_attempts=30
set attempt=0

:check_loop
set /a attempt+=1
powershell -Command "try { $response = Invoke-WebRequest -Uri '%url%' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    exit /b 0
)
if %attempt% geq %max_attempts% (
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto check_loop













































