@echo off
chcp 65001 >nul
echo ========================================
echo   BizPulse PRO - Frontend Запуск
echo ========================================
echo.

cd /d "%~dp0"

echo Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ОШИБКА: Node.js не установлен!
    echo.
    echo Установите Node.js 18+ с: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js: OK ✓
echo.

cd frontend

echo Проверка зависимостей...
if not exist "node_modules" (
    echo.
    echo ⏳ Установка зависимостей (это займет 2-5 минут)...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ ОШИБКА: Не удалось установить зависимости!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo ✅ Зависимости установлены!
) else (
    echo Зависимости уже установлены ✓
)

echo.
echo ========================================
echo   Запуск Frontend сервера...
echo ========================================
echo.
echo ⚠️  ВАЖНО: Дождитесь сообщения "Local: http://localhost:3000"
echo.
echo После этого откройте браузер: http://localhost:3000
echo.
echo Для остановки нажмите Ctrl+C
echo.
echo ========================================
echo.

call npm run dev

pause

