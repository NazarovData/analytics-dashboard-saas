@echo off
chcp 65001 >nul
echo ========================================
echo   ОСТАНОВКА СЕРВИСОВ
echo ========================================
echo.

echo Останавливаю процессы...

REM Остановка процессов Python (uvicorn)
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq *uvicorn*" >nul 2>&1

REM Остановка процессов Node.js (npm/vite)
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Frontend*" >nul 2>&1

REM Остановка по портам
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo ✅ Серверы остановлены!
echo.
pause







