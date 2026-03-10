@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА OCR (МИНИМАЛЬНЫЙ НАБОР)
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/3] Активирую виртуальное окружение...
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
echo [2/3] Обновляю pip...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo ❌ Ошибка обновления pip
    pause
    exit /b 1
)

echo.
echo [3/3] Устанавливаю библиотеки...
echo.
echo Устанавливаю opencv-python==4.8.1.78...
python -m pip install opencv-python==4.8.1.78
if errorlevel 1 (
    echo ❌ Ошибка установки opencv-python
    pause
    exit /b 1
)

echo.
echo Устанавливаю easyocr==1.7.0...
echo ⚠️  Это может занять 5-10 минут (большая библиотека)
python -m pip install easyocr==1.7.0
if errorlevel 1 (
    echo ❌ Ошибка установки easyocr
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════
echo ✅ ВСЕ УСТАНОВЛЕНО УСПЕШНО!
echo ════════════════════════════════════════
echo.
echo Проверяю установку...
python -c "import cv2; print('✅ opencv-python OK')"
python -c "import easyocr; print('✅ easyocr OK')"
echo.
pause



