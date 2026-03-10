@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   АКТИВАЦИЯ VENV И УСТАНОВКА OCR
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo Проверяю виртуальное окружение...
if not exist venv\Scripts\activate.bat (
    echo ❌ Виртуальное окружение не найдено!
    echo Создаю новое...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Ошибка создания venv
        pause
        exit /b 1
    )
    echo ✅ Виртуальное окружение создано
)

echo.
echo Активирую виртуальное окружение...
call venv\Scripts\activate.bat

echo.
echo Проверяю, что используется venv Python...
where python
echo.

echo Версия Python в venv:
venv\Scripts\python.exe --version

echo.
echo ════════════════════════════════════════
echo Обновляю pip в venv...
echo ════════════════════════════════════════
venv\Scripts\python.exe -m pip install --upgrade pip

echo.
echo ════════════════════════════════════════
echo Устанавливаю opencv-python в venv...
echo ════════════════════════════════════════
venv\Scripts\python.exe -m pip install opencv-python==4.8.1.78
if errorlevel 1 (
    echo ❌ Ошибка установки opencv-python
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════
echo Устанавливаю easyocr в venv...
echo ════════════════════════════════════════
echo ⚠️  Это может занять 5-10 минут (большая библиотека)
venv\Scripts\python.exe -m pip install easyocr==1.7.0
if errorlevel 1 (
    echo ❌ Ошибка установки easyocr
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════
echo Проверяю установку...
echo ════════════════════════════════════════
venv\Scripts\python.exe -c "import cv2; print('✅ opencv-python установлен')" 2>nul || echo ❌ opencv-python не работает
venv\Scripts\python.exe -c "import easyocr; print('✅ easyocr установлен')" 2>nul || echo ❌ easyocr не работает

echo.
echo ════════════════════════════════════════
echo ✅ УСТАНОВКА ЗАВЕРШЕНА!
echo ════════════════════════════════════════
echo.
echo Теперь активируйте venv и запускайте сервер:
echo   venv\Scripts\activate.bat
echo   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
pause



