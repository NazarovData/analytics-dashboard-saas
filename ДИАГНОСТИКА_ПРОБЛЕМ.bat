@echo off
chcp 65001 >nul
cls
echo ========================================
echo   ДИАГНОСТИКА ПРОБЛЕМ
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Проверяю Python...
python --version
if errorlevel 1 (
    echo ❌ Python не найден!
    echo Установите Python с python.org
) else (
    echo ✅ Python найден
)
echo.

echo [2/6] Проверяю Node.js...
node --version
if errorlevel 1 (
    echo ❌ Node.js не найден!
    echo Установите Node.js с nodejs.org
) else (
    echo ✅ Node.js найден
)
echo.

echo [3/6] Проверяю виртуальное окружение...
if exist "venv\Scripts\activate.bat" (
    echo ✅ Venv существует
    call venv\Scripts\activate.bat
    echo Проверяю установленные пакеты...
    pip list | findstr /I "uvicorn fastapi"
    if errorlevel 1 (
        echo ⚠️  Uvicorn или FastAPI не установлены!
        echo Установите: pip install uvicorn fastapi
    ) else (
        echo ✅ Зависимости установлены
    )
) else (
    echo ❌ Venv не найден!
    echo Создайте: python -m venv venv
)
echo.

echo [4/6] Проверяю порты...
netstat -an | findstr :8000 >nul
if %errorlevel%==0 (
    echo ⚠️  Порт 8000 занят!
    echo Процессы на порту 8000:
    netstat -ano | findstr :8000
) else (
    echo ✅ Порт 8000 свободен
)

netstat -an | findstr :3000 >nul
if %errorlevel%==0 (
    echo ⚠️  Порт 3000 занят!
    echo Процессы на порту 3000:
    netstat -ano | findstr :3000
) else (
    echo ✅ Порт 3000 свободен
)
echo.

echo [5/6] Проверяю доступность серверов...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Backend доступен (http://localhost:8000/docs)' } catch { Write-Host '❌ Backend недоступен' }"

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Frontend доступен (http://localhost:3000)' } catch { Write-Host '❌ Frontend недоступен' }"
echo.

echo [6/6] Проверяю процессы...
echo Процессы Python:
tasklist | findstr /I "python.exe"
echo.
echo Процессы Node.js:
tasklist | findstr /I "node.exe"
echo.

echo ========================================
echo   РЕКОМЕНДАЦИИ:
echo ========================================
echo.
echo Если серверы не работают:
echo 1. Запустите ЗАПУСК_С_ДИАГНОСТИКОЙ.bat
echo 2. Проверьте окна "Backend" и "Frontend" на ошибки
echo 3. Убедитесь что порты 3000 и 8000 свободны
echo 4. Проверьте что все зависимости установлены
echo.
pause







