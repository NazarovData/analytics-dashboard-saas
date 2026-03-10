@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск через CMD с автоОткрытием Edge
echo ========================================
echo.

cd /d "%~dp0"

echo Выберите вариант запуска:
echo.
echo 1. Только фронтенд
echo 2. Только бэкенд  
echo 3. Оба (фронтенд + бэкенд)
echo.
set /p choice="Введите номер (1-3): "

if "%choice%"=="1" goto frontend
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto both
goto end

:frontend
echo.
echo Запускаю фронтенд...
cd frontend
start /b cmd /c "timeout /t 5 /nobreak >nul && start msedge http://localhost:3000"
call npm run dev
goto end

:backend
echo.
echo Запускаю бэкенд...
call venv\Scripts\activate.bat
start /b cmd /c "timeout /t 8 /nobreak >nul && start msedge http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
goto end

:both
echo.
echo Запускаю бэкенд в новом окне...
start "BizPulse Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 5 /nobreak >nul

echo Запускаю фронтенд в новом окне...
start "BizPulse Frontend" cmd /k "cd /d %~dp0 && cd frontend && npm run dev"
timeout /t 10 /nobreak >nul

echo Открываю браузеры Edge...
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

echo.
echo ✅ Готово! Сервисы запущены в отдельных окнах.
echo.
goto end

:end
pause
















































