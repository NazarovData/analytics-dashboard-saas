@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА pytesseract
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
echo Устанавливаю pytesseract==0.3.10...
python -m pip install pytesseract==0.3.10

if errorlevel 1 (
    echo.
    echo ❌ Ошибка установки!
) else (
    echo.
    echo ✅ pytesseract установлен успешно!
    echo.
    echo ⚠️  ВАЖНО: Для работы нужен Tesseract OCR
    echo    Скачайте с: https://github.com/UB-Mannheim/tesseract/wiki
)

echo.
pause



