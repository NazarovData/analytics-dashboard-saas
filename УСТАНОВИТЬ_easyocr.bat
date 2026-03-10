@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА easyocr
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
echo ⚠️  ВНИМАНИЕ: easyocr - большая библиотека (~500MB)
echo    Установка может занять 5-10 минут...
echo.
echo Устанавливаю easyocr==1.7.0...
python -m pip install easyocr==1.7.0

if errorlevel 1 (
    echo.
    echo ❌ Ошибка установки!
) else (
    echo.
    echo ✅ easyocr установлен успешно!
    echo.
    echo ✅ Поддержка языков: русский, английский, таджикский
    echo ✅ Не требует внешних зависимостей (Tesseract/poppler)
)

echo.
pause



