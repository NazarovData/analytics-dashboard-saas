@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   ПРОВЕРКА И УСТАНОВКА OCR
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo Проверяю виртуальное окружение...
if exist venv\Scripts\python.exe (
    echo ✅ Виртуальное окружение найдено
) else (
    echo ❌ Виртуальное окружение не найдено!
    echo Создаю новое...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Ошибка создания venv
        pause
        exit /b 1
    )
)

echo.
echo Активирую виртуальное окружение...
call venv\Scripts\activate.bat

echo.
echo Проверяю Python...
python --version
if errorlevel 1 (
    echo ❌ Python не найден!
    pause
    exit /b 1
)

echo.
echo Проверяю pip...
python -m pip --version
if errorlevel 1 (
    echo ❌ pip не найден!
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════
echo Обновляю pip...
echo ════════════════════════════════════════
python -m pip install --upgrade pip

echo.
echo ════════════════════════════════════════
echo Устанавливаю opencv-python...
echo ════════════════════════════════════════
python -m pip install opencv-python==4.8.1.78
if errorlevel 1 (
    echo ❌ Ошибка установки opencv-python
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════
echo Устанавливаю easyocr...
echo ════════════════════════════════════════
echo ⚠️  Это может занять 5-10 минут (большая библиотека)
python -m pip install easyocr==1.7.0
if errorlevel 1 (
    echo ❌ Ошибка установки easyocr
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════
echo Проверяю установку...
echo ════════════════════════════════════════
python -c "import cv2; print('✅ opencv-python установлен')" 2>nul || echo ❌ opencv-python не работает
python -c "import easyocr; print('✅ easyocr установлен')" 2>nul || echo ❌ easyocr не работает

echo.
echo ════════════════════════════════════════
echo ✅ УСТАНОВКА ЗАВЕРШЕНА!
echo ════════════════════════════════════════
echo.
pause



