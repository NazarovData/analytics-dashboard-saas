@echo off
chcp 65001 >nul
cls
echo ========================================
echo   НАСТРОЙКА ДОМЕНА
echo ========================================
echo.

cd /d "%~dp0"

echo Этот скрипт поможет настроить домен для проекта.
echo.
set /p DOMAIN="Введите ваш домен (например: example.com): "

if "%DOMAIN%"=="" (
    echo ❌ Домен не введен!
    pause
    exit /b 1
)

echo.
echo Настраиваю для домена: %DOMAIN%
echo.

REM Создание .env файла для фронтенда
echo [1/3] Создаю .env файл для фронтенда...
cd frontend
if not exist ".env.production" (
    echo VITE_API_URL=https://%DOMAIN%/api/v1 > .env.production
    echo ✅ Создан .env.production
) else (
    echo ⚠️  .env.production уже существует
)

if not exist ".env" (
    echo VITE_API_URL=http://localhost:8000/api/v1 > .env
    echo ✅ Создан .env для разработки
)
cd ..

REM Обновление CORS в main.py
echo [2/3] Обновляю CORS настройки...
echo.
echo ⚠️  ВАЖНО: Нужно вручную обновить app/main.py
echo.
echo Замените строку:
echo   allow_origins=["*"]
echo.
echo На:
echo   allow_origins=[
echo       "https://%DOMAIN%",
echo       "https://www.%DOMAIN%",
echo       "http://localhost:3000",
echo   ]
echo.

REM Создание инструкции
echo [3/3] Создаю инструкцию...
echo.
echo ✅ Настройка завершена!
echo.
echo Следующие шаги:
echo 1. Обновите CORS в app/main.py (см. выше)
echo 2. Настройте DNS записи для домена %DOMAIN%
echo 3. Настройте Nginx или другой веб-сервер
echo 4. Установите SSL сертификат (Let's Encrypt)
echo.
echo Подробная инструкция в файле: НАСТРОЙКА_ДОМЕНА.md
echo.
pause







