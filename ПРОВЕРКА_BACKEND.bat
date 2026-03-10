@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🔍 ПРОВЕРКА СТАТУСА BACKEND
echo ═══════════════════════════════════════════════════════════
echo.

echo Проверяем запущен ли Python...
tasklist | find "python.exe"
if %errorlevel% equ 0 (
    echo ✅ Python процесс найден
) else (
    echo ❌ Python НЕ запущен!
    echo.
    echo 🚀 Запускаем backend сейчас...
    start cmd /k "cd /d "%~dp0" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo.
    echo ✅ Backend запускается в новом окне...
    echo Подождите 15 секунд и попробуйте загрузить файл снова.
    timeout /t 15
)

echo.
echo Проверяем порт 8000...
netstat -ano | find ":8000"
if %errorlevel% equ 0 (
    echo ✅ Порт 8000 занят - backend работает
) else (
    echo ❌ Порт 8000 свободен - backend НЕ работает!
)

echo.
echo Пробуем подключиться к backend...
curl -s http://localhost:8000/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend отвечает на запросы
    echo 🌐 Откройте: http://localhost:8000/docs
) else (
    echo ❌ Backend НЕ отвечает
    echo.
    echo 💡 Решение:
    echo 1. Откройте новое окно CMD
    echo 2. Выполните: cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
    echo 3. Выполните: venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
)

echo.
pause
