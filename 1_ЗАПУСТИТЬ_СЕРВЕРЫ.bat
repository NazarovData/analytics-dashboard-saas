@echo off
chcp 65001 >nul
cls
color 0A
echo ╔══════════════════════════════════════════╗
echo ║     ШАГ 1: ЗАПУСК СЕРВЕРОВ              ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Быстрая установка если нужно
if not exist "venv\Scripts\python.exe" (
    echo Создаю venv...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q uvicorn fastapi
)

if not exist "frontend\node_modules" (
    echo Устанавливаю npm...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ╔══════════════════════════════════════════╗
echo ║     ЗАПУСКАЮ СЕРВЕРЫ                    ║
echo ╚══════════════════════════════════════════╝
echo.

REM Запуск бэкенда
echo [1/2] Запускаю BACKEND...
start "🔧 BACKEND" cmd /k "color 0E && cd /d %~dp0 && call venv\Scripts\activate.bat && echo. && echo ════════════════════════════════════════ && echo     BACKEND СЕРВЕР && echo ════════════════════════════════════════ && echo. && echo Ждите сообщение: && echo   Uvicorn running on http://0.0.0.0:8000 && echo. && echo Когда увидите это сообщение - && echo запустите: 2_ОТКРЫТЬ_БРАУЗЕР.bat && echo. && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Жду 25 секунд...
timeout /t 25 /nobreak >nul

REM Запуск фронтенда
echo [2/2] Запускаю FRONTEND...
start "📊 FRONTEND" cmd /k "color 0B && cd /d %~dp0\frontend && echo. && echo ════════════════════════════════════════ && echo     FRONTEND СЕРВЕР && echo ════════════════════════════════════════ && echo. && echo Ждите сообщение: && echo   Local: http://localhost:3000 && echo. && echo Когда увидите это сообщение - && echo запустите: 2_ОТКРЫТЬ_БРАУЗЕР.bat && echo. && npm run dev"

echo.
color 0A
echo ╔══════════════════════════════════════════╗
echo ║     ✅ СЕРВЕРЫ ЗАПУСКАЮТСЯ...           ║
echo ╚══════════════════════════════════════════╝
echo.
echo Откроются 2 окна:
echo   🔧 BACKEND (желтое окно)
echo   📊 FRONTEND (синее окно)
echo.
echo ВАЖНО! ПРОВЕРЬТЕ ЭТИ ОКНА:
echo.
echo В окне BACKEND должно быть:
echo   ✅ "Uvicorn running on http://0.0.0.0:8000"
echo.
echo В окне FRONTEND должно быть:
echo   ✅ "Local: http://localhost:3000"
echo.
echo Когда увидите эти сообщения (подождите 30-60 секунд):
echo   👉 Запустите файл: 2_ОТКРЫТЬ_БРАУЗЕР.bat
echo.
pause







