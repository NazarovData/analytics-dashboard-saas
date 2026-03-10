@echo off
chcp 65001 >nul
echo ========================================
echo   BizPulse PRO - Автоматический запуск
echo ========================================
echo.
echo Этот скрипт запустит все сервисы и откроет Edge браузер
echo автоматически когда все будет готово.
echo.
echo ⏳ Пожалуйста подождите 1-2 минуты...
echo.

cd /d "%~dp0"

REM Запуск backend
echo [1/3] Запуск Backend...
start "BizPulse Backend" cmd /k "start_backend.bat"
timeout /t 30 /nobreak >nul

REM Запуск frontend
echo [2/3] Запуск Frontend...
start "BizPulse Frontend" cmd /k "start_frontend.bat"
timeout /t 60 /nobreak >nul

REM Ожидание запуска серверов
echo [3/3] Ожидание запуска серверов...
echo.
echo ⏳ Подождите еще 30 секунд для полного запуска...
timeout /t 30 /nobreak >nul

echo.
echo ========================================
echo   ✅ Открываю Edge браузер...
echo ========================================
echo.

REM Открытие в Edge браузере
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs

echo.
echo ========================================
echo   ✅ Готово! Браузер открыт!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000/docs
echo.
echo ⚠️  Если страница не загрузилась - подождите еще 10-20 секунд
echo    и обновите страницу (F5)
echo.
pause

