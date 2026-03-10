@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА ВСЕХ OCR БИБЛИОТЕК
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/5] Активирую виртуальное окружение...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo ✅ Виртуальное окружение активировано
) else (
    echo ❌ Виртуальное окружение не найдено!
    echo Создайте его командой: python -m venv venv
    pause
    exit /b 1
)

echo.
echo [2/5] Обновляю pip...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo ❌ Ошибка обновления pip
    pause
    exit /b 1
)

echo.
echo [3/5] Устанавливаю opencv-python==4.8.1.78...
python -m pip install opencv-python==4.8.1.78
if errorlevel 1 (
    echo ❌ Ошибка установки opencv-python
    pause
    exit /b 1
)

echo.
echo [4/5] Устанавливаю easyocr==1.7.0...
echo ⚠️  Это может занять 5-10 минут (большая библиотека)
python -m pip install easyocr==1.7.0
if errorlevel 1 (
    echo ❌ Ошибка установки easyocr
    pause
    exit /b 1
)

echo.
echo [5/5] Устанавливаю pytesseract==0.3.10...
python -m pip install pytesseract==0.3.10
if errorlevel 1 (
    echo ⚠️  Предупреждение: pytesseract не установлен
    echo    Это не критично, можно использовать easyocr
)

echo.
echo Устанавливаю pdf2image==1.16.3...
python -m pip install pdf2image==1.16.3
if errorlevel 1 (
    echo ⚠️  Предупреждение: pdf2image не установлен
    echo    Это не критично, можно использовать только изображения
)

echo.
echo ════════════════════════════════════════
echo ✅ УСТАНОВКА ЗАВЕРШЕНА!
echo ════════════════════════════════════════
echo.
echo Проверяю установку...
python -c "import cv2; print('✅ opencv-python OK')" 2>nul || echo ❌ opencv-python не установлен
python -c "import easyocr; print('✅ easyocr OK')" 2>nul || echo ❌ easyocr не установлен
python -c "import pytesseract; print('✅ pytesseract OK')" 2>nul || echo ⚠️  pytesseract не установлен
python -c "import pdf2image; print('✅ pdf2image OK')" 2>nul || echo ⚠️  pdf2image не установлен
echo.
pause



