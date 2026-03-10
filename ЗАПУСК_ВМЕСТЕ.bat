@echo off
chcp 65001 >nul
cls
color 0A
title BizPulse PRO - Полный запуск

cd /d "%~dp0"

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║           BizPulse PRO - Запуск всех сервисов            ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM ========== ШАГ 1: Frontend зависимости ==========
echo [ШАГ 1/4] Установка Frontend зависимостей...
cd frontend
if not exist "node_modules" (
    echo    ⏳ Установка npm пакетов (2-5 минут)...
    call npm install
    if errorlevel 1 (
        echo    ❌ ОШИБКА установки!
        pause
        exit /b 1
    )
    echo    ✅ Зависимости установлены!
) else (
    echo    ✅ Зависимости уже установлены
)
cd ..

echo.
REM ========== ШАГ 2: Backend зависимости ==========
echo [ШАГ 2/4] Установка Backend зависимостей...
if not exist "venv" (
    echo    Создание виртуального окружения...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo    ✅ Backend зависимости установлены!

echo.
REM ========== ШАГ 3: Docker (опционально) ==========
echo [ШАГ 3/4] Запуск базы данных...
docker --version >nul 2>&1
if errorlevel 1 (
    echo    ⚠️  Docker не установлен - пропускаем
) else (
    docker-compose up -d postgres redis >nul 2>&1
    if errorlevel 1 (
        echo    ⚠️  Docker контейнеры не запустились - продолжаем без них
    ) else (
        echo    ✅ База данных запущена
        timeout /t 5 /nobreak >nul
    )
)

echo.
REM ========== ШАГ 4: Запуск серверов ==========
echo [ШАГ 4/4] Запуск серверов...
echo.

echo    Запуск Backend...
start "BizPulse Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 5 /nobreak >nul

echo    Запуск Frontend...
start "BizPulse Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║              ✅ СЕРВЕРЫ ЗАПУЩЕНЫ!                         ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo ⏳ Ожидание запуска (90 секунд)...
echo    (первый запуск может занять больше времени)
echo.
timeout /t 90 /nobreak >nul

echo.
echo Открываю браузер...
start http://localhost:3000
timeout /t 2 /nobreak >nul
start http://localhost:8000/docs

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║                    ✅ ГОТОВО!                             ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📍 Frontend: http://localhost:3000
echo 📍 Backend:  http://localhost:8000/docs
echo.
echo ⚠️  ВАЖНО:
echo    • Не закрывайте окна "BizPulse Backend" и "BizPulse Frontend"
echo    • Если страница не загрузилась - подождите 30 сек и обновите (F5)
echo.
pause

