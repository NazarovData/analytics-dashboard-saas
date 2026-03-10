@echo off
chcp 65001 >nul
cls
title ЗАПУСК СЕРВЕРОВ
echo ========================================
echo   АВТОЗАПУСК С БРАУЗЕРОМ
echo ========================================
echo.

cd /d "%~dp0"

REM Быстрая проверка
if not exist "venv\Scripts\python.exe" (
    echo Создаю venv...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q uvicorn fastapi
)

if not exist "frontend\node_modules" (
    echo Устанавливаю зависимости...
    cd frontend
    call npm install
    cd ..
)

echo Запускаю бэкенд...
start /min "Backend" cmd /c "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Жду 25 секунд...
timeout /t 25 /nobreak >nul

echo Запускаю фронтенд...
start /min "Frontend" cmd /c "cd /d %~dp0\frontend && npm run dev"

echo Жду 35 секунд...
timeout /t 35 /nobreak >nul

echo.
echo Проверяю серверы и открываю браузеры...
echo.

REM Проверка и открытие
powershell -NoProfile -Command "$ErrorActionPreference='SilentlyContinue'; $backend=$false; $frontend=$false; for($i=1;$i-le30;$i++){try{Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 1 -UseBasicParsing|Out-Null;$backend=$true;break}catch{Start-Sleep -Seconds 2}}; if($backend){Write-Host '✅ Backend готов!'}else{Write-Host '❌ Backend не готов'}; for($i=1;$i-le30;$i++){try{Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1 -UseBasicParsing|Out-Null;$frontend=$true;break}catch{Start-Sleep -Seconds 2}}; if($frontend){Write-Host '✅ Frontend готов!'}else{Write-Host '❌ Frontend не готов'}; if($backend -and $frontend){Start-Process 'msedge' 'http://localhost:3000'; Start-Sleep -Seconds 2; Start-Process 'msedge' 'http://localhost:8000/docs'; Write-Host '✅ Браузеры открыты!'}else{Write-Host '⚠️ Проверьте окна серверов'}"

echo.
echo ✅ Готово!
echo.
echo Фронтенд: http://localhost:3000
echo Бэкенд: http://localhost:8000/docs
echo.
pause







