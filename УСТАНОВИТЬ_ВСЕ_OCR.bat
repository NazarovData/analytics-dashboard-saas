@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА ВСЕХ OCR БИБЛИОТЕК
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
echo ════════════════════════════════════════
echo [1/4] Устанавливаю pytesseract...
echo ════════════════════════════════════════
python -m pip install pytesseract==0.3.10

echo.
echo ════════════════════════════════════════
echo [2/4] Устанавливаю opencv-python...
echo ════════════════════════════════════════
python -m pip install opencv-python==4.8.1.78

echo.
echo ════════════════════════════════════════
echo [3/4] Устанавливаю pdf2image...
echo ════════════════════════════════════════
python -m pip install pdf2image==1.16.3

echo.
echo ════════════════════════════════════════
echo [4/4] Устанавливаю easyocr...
echo ════════════════════════════════════════
echo ⚠️  Это может занять 5-10 минут (большая библиотека)
python -m pip install easyocr==1.7.0

echo.
echo ════════════════════════════════════════
echo ✅ Все библиотеки установлены!
echo ════════════════════════════════════════
echo.
pause



