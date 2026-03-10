@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА pdf2image
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

REM Активация виртуального окружения
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo ❌ Виртуальное окружение не найдено!
    pause
    exit /b 1
)

echo Обновляю pip...
python -m pip install --upgrade pip

echo.
echo Устанавливаю pdf2image==1.16.3...
python -m pip install pdf2image==1.16.3

if errorlevel 1 (
    echo.
    echo ❌ Ошибка установки!
) else (
    echo.
    echo ✅ pdf2image установлен успешно!
    echo.
    echo ⚠️  ВАЖНО: Для работы нужен poppler
    echo    Windows: https://github.com/oschwartz10612/poppler-windows/releases
    echo    Или используйте только изображения (JPG/PNG)
)

echo.
pause



