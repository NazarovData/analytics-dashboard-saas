@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 ЗАПУСК ANALITIX AI - ВСЕ СЕРВИСЫ
echo ========================================
echo.

REM Переходим в папку проекта
cd /d "%~dp0"

REM Проверка установки
echo 🔍 Проверяю установку...
python -c "import pyotp, qrcode; from PIL import Image; from app.api.v1 import auth_2fa, geo_analytics; print('✅ ВСЁ УСТАНОВЛЕНО!')" 2>nul

if errorlevel 1 (
    echo ❌ ОШИБКА: Зависимости не установлены!
    echo.
    echo Установите зависимости:
    echo pip install pyotp qrcode Pillow
    echo.
    pause
    exit /b 1
)

echo ✅ Зависимости установлены
echo.

REM Активируем venv
echo 🔄 Активирую виртуальное окружение...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo ❌ Ошибка активации venv
    pause
    exit /b 1
)

echo.
echo ========================================
echo 📊 ЗАПУСК BACKEND СЕРВЕРА
echo ========================================
echo.
echo Backend будет доступен на: http://localhost:8000
echo Swagger документация: http://localhost:8000/docs
echo.
echo Нажмите Ctrl+C чтобы остановить сервер
echo.

REM Запускаем backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause

