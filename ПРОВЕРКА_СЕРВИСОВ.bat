@echo off
chcp 65001 >nul
echo ========================================
echo   ПРОВЕРКА РАБОТЫ СЕРВИСОВ
echo ========================================
echo.

echo Проверяю процессы...
echo.

REM Проверка процессов Python
tasklist | findstr /I "python.exe" >nul
if %errorlevel%==0 (
    echo ✅ Backend процесс найден
) else (
    echo ❌ Backend процесс не найден
)

REM Проверка процессов Node.js
tasklist | findstr /I "node.exe" >nul
if %errorlevel%==0 (
    echo ✅ Frontend процесс найден
) else (
    echo ❌ Frontend процесс не найден
)

echo.
echo Проверяю порты...
echo.

REM Проверка порта 8000
netstat -an | findstr :8000 >nul
if %errorlevel%==0 (
    echo ✅ Порт 8000 (Backend) открыт
) else (
    echo ❌ Порт 8000 (Backend) закрыт
)

REM Проверка порта 3000
netstat -an | findstr :3000 >nul
if %errorlevel%==0 (
    echo ✅ Порт 3000 (Frontend) открыт
) else (
    echo ❌ Порт 3000 (Frontend) закрыт
)

echo.
echo Проверяю доступность серверов...
echo.

REM Проверка бэкенда
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null; Write-Host '✅ Backend доступен' } catch { Write-Host '❌ Backend недоступен' }"

REM Проверка фронтенда
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null; Write-Host '✅ Frontend доступен' } catch { Write-Host '❌ Frontend недоступен' }"

echo.
pause







