@echo off
chcp 65001 >nul
echo ========================================
echo   ДИАГНОСТИКА ПРОБЛЕМ
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Проверка Python...
python --version 2>nul
if errorlevel 1 (
    echo ❌ Python НЕ УСТАНОВЛЕН!
    echo Установите с: https://www.python.org/downloads/
) else (
    echo ✅ Python установлен
    python --version
)

echo.
echo [2] Проверка Node.js...
node --version 2>nul
if errorlevel 1 (
    echo ❌ Node.js НЕ УСТАНОВЛЕН!
    echo Установите с: https://nodejs.org/
) else (
    echo ✅ Node.js установлен
    node --version
)

echo.
echo [3] Проверка виртуального окружения...
if exist "venv\Scripts\activate.bat" (
    echo ✅ venv существует
    call venv\Scripts\activate.bat
    python --version
) else (
    echo ❌ venv НЕ НАЙДЕН!
    echo Создайте командой: python -m venv venv
)

echo.
echo [4] Проверка зависимостей Python...
if exist "venv\Scripts\uvicorn.exe" (
    echo ✅ uvicorn установлен
) else (
    echo ❌ uvicorn НЕ УСТАНОВЛЕН!
    echo Установите командой: pip install -r requirements.txt
)

echo.
echo [5] Проверка зависимостей Node.js...
if exist "frontend\node_modules" (
    echo ✅ node_modules существует
) else (
    echo ❌ node_modules НЕ НАЙДЕН!
    echo Установите командой: cd frontend && npm install
)

echo.
echo [6] Проверка портов...
netstat -an | findstr ":3000" >nul
if %errorlevel%==0 (
    echo ⚠️  Порт 3000 ЗАНЯТ!
    echo Закройте программу использующую этот порт
) else (
    echo ✅ Порт 3000 свободен
)

netstat -an | findstr ":8000" >nul
if %errorlevel%==0 (
    echo ⚠️  Порт 8000 ЗАНЯТ!
    echo Закройте программу использующую этот порт
) else (
    echo ✅ Порт 8000 свободен
)

echo.
echo [7] Проверка файлов проекта...
if exist "app\main.py" (
    echo ✅ app\main.py существует
) else (
    echo ❌ app\main.py НЕ НАЙДЕН!
)

if exist "frontend\package.json" (
    echo ✅ frontend\package.json существует
) else (
    echo ❌ frontend\package.json НЕ НАЙДЕН!
)

echo.
echo ========================================
echo   РЕЗУЛЬТАТ ДИАГНОСТИКИ
echo ========================================
echo.
echo Если есть ошибки (❌), исправьте их перед запуском
echo.
pause

