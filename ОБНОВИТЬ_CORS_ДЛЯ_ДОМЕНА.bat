@echo off
chcp 65001 >nul
cls
echo ========================================
echo   ОБНОВЛЕНИЕ CORS ДЛЯ ДОМЕНА
echo ========================================
echo.

cd /d "%~dp0"

set /p DOMAIN="Введите ваш домен (например: example.com): "

if "%DOMAIN%"=="" (
    echo ❌ Домен не введен!
    pause
    exit /b 1
)

echo.
echo Обновляю CORS для домена: %DOMAIN%
echo.

REM Создание резервной копии
copy app\main.py app\main.py.backup >nul 2>&1
echo ✅ Создана резервная копия: app\main.py.backup

REM Обновление CORS
powershell -Command "(Get-Content app\main.py) -replace 'allow_origins=\[\"\\*\"\]', 'allow_origins=[\"https://%DOMAIN%\", \"https://www.%DOMAIN%\", \"http://localhost:3000\"]' | Set-Content app\main.py"

echo ✅ CORS обновлен!
echo.
echo Теперь CORS разрешает:
echo - https://%DOMAIN%
echo - https://www.%DOMAIN%
echo - http://localhost:3000 (для разработки)
echo.
echo Для возврата к старой версии используйте: app\main.py.backup
echo.
pause







