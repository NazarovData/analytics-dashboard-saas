@echo off
chcp 65001 >nul
title BizPulse PRO - Автозапуск
color 0A

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     BizPulse PRO - Автоматический запуск            ║
echo ║     Браузер Edge откроется автоматически            ║
echo ╚══════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [ШАГ 1/4] Запуск Docker сервисов (PostgreSQL + Redis)...
docker-compose up -d postgres redis >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker не запущен - продолжаем без него
) else (
    echo ✅ Docker сервисы запущены
)
timeout /t 5 /nobreak >nul

echo.
echo [ШАГ 2/4] Запуск Backend сервера...
start "BizPulse Backend" cmd /k "start_backend.bat"
echo ✅ Backend запускается в отдельном окне
timeout /t 35 /nobreak >nul

echo.
echo [ШАГ 3/4] Запуск Frontend сервера...
start "BizPulse Frontend" cmd /k "start_frontend.bat"
echo ✅ Frontend запускается в отдельном окне
timeout /t 60 /nobreak >nul

echo.
echo [ШАГ 4/4] Финальная подготовка...
echo ⏳ Подождите еще 15 секунд для полного запуска...
timeout /t 15 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     ✅ Все сервисы запущены!                        ║
echo ║     Открываю Edge браузер...                        ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM Открытие Edge браузера
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge --new-window http://localhost:8000/docs

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     ✅ ГОТОВО! Браузер Edge открыт!                  ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 📍 Frontend: http://localhost:3000
echo 📍 Backend API: http://localhost:8000/docs
echo.
echo ⚠️  ВАЖНО:
echo    - Не закрывайте окна "BizPulse Backend" и "BizPulse Frontend"
echo    - Если страница не загрузилась - подождите 10 секунд и обновите (F5)
echo    - Первый запуск может занять больше времени
echo.
echo 💡 Для остановки закройте окна Backend и Frontend
echo.
pause

