@echo off
chcp 65001 >nul
title BizPulse PRO - Автозапуск
color 0A
cls

cd /d "%~dp0"

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║           BizPulse PRO - Автоматический запуск           ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo.

REM ========== ШАГ 1: Docker ==========
echo [ШАГ 1/5] Запуск базы данных...
if exist "docker-compose.yml" (
    docker-compose up -d postgres redis 2>nul
    echo    ✓ База данных запущена
    timeout /t 3 /nobreak >nul
) else (
    echo    ⚠ docker-compose.yml не найден
)
echo.

REM ========== ШАГ 2: Backend ==========
echo [ШАГ 2/5] Запуск Backend сервера...
if exist "app\main.py" (
    if not exist "venv" (
        echo    Создание виртуального окружения...
        python -m venv venv >nul 2>&1
    )
    echo    Активация окружения и установка зависимостей...
    start "BizPulse Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && pip install -q -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo    ✓ Backend запускается в отдельном окне
    timeout /t 5 /nobreak >nul
) else (
    echo    ✗ ОШИБКА: app\main.py не найден!
    pause
    exit /b 1
)
echo.

REM ========== ШАГ 3: Frontend ==========
echo [ШАГ 3/5] Запуск Frontend сервера...
if exist "frontend\package.json" (
    echo    Установка зависимостей (может занять 2-5 минут)...
    start "BizPulse Frontend" cmd /k "cd /d %~dp0\frontend && if not exist node_modules (npm install) && npm run dev"
    echo    ✓ Frontend запускается в отдельном окне
    timeout /t 5 /nobreak >nul
) else (
    echo    ✗ ОШИБКА: frontend\package.json не найден!
    pause
    exit /b 1
)
echo.

REM ========== ШАГ 4: Ожидание ==========
echo [ШАГ 4/5] Ожидание запуска серверов...
echo.
echo    ⏳ Пожалуйста подождите...
echo    Первый запуск может занять 2-3 минуты
echo.
timeout /t 90 /nobreak >nul
echo    ✓ Ожидание завершено
echo.

REM ========== ШАГ 5: Браузер ==========
echo [ШАГ 5/5] Открытие браузера...
echo.
start http://localhost:3000
timeout /t 2 /nobreak >nul
start http://localhost:8000/docs
echo    ✓ Браузер открыт
echo.

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║                    ✅ ВСЕ ЗАПУЩЕНО!                      ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📍 Frontend: http://localhost:3000
echo 📍 Backend:  http://localhost:8000/docs
echo.
echo ⚠️  ВАЖНО:
echo    • Не закрывайте окна "BizPulse Backend" и "BizPulse Frontend"
echo    • Если страница не загрузилась - подождите 30 секунд и обновите (F5)
echo    • Для остановки закройте окна Backend и Frontend
echo.
echo 💡 Первый запуск может занять больше времени из-за установки зависимостей
echo.
pause

