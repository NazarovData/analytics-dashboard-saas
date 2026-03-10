@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА OCR ЗАВИСИМОСТЕЙ
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

REM Активация виртуального окружения
if exist venv\Scripts\activate.bat (
    echo ✅ Активирую виртуальное окружение...
    call venv\Scripts\activate.bat
) else (
    echo ❌ Виртуальное окружение не найдено!
    echo Создайте его командой: python -m venv venv
    pause
    exit /b 1
)

echo.
echo Обновляю pip...
python -m pip install --upgrade pip

echo.
echo ════════════════════════════════════════
echo Выберите вариант установки:
echo ════════════════════════════════════════
echo.
echo [1] Минимальный набор (opencv + easyocr) - РЕКОМЕНДУЕТСЯ
echo [2] pytesseract
echo [3] opencv-python
echo [4] pdf2image
echo [5] easyocr
echo [6] Установить ВСЕ библиотеки
echo [0] Выход
echo.
set /p choice="Введите номер (0-6): "

if "%choice%"=="1" goto minimal
if "%choice%"=="2" goto pytesseract
if "%choice%"=="3" goto opencv
if "%choice%"=="4" goto pdf2image
if "%choice%"=="5" goto easyocr
if "%choice%"=="6" goto all
if "%choice%"=="0" goto end
goto invalid

:minimal
echo.
echo ════════════════════════════════════════
echo Устанавливаю минимальный набор...
echo ════════════════════════════════════════
python -m pip install opencv-python==4.8.1.78
python -m pip install easyocr==1.7.0
goto success

:pytesseract
echo.
echo ════════════════════════════════════════
echo Устанавливаю pytesseract...
echo ════════════════════════════════════════
python -m pip install pytesseract==0.3.10
goto success

:opencv
echo.
echo ════════════════════════════════════════
echo Устанавливаю opencv-python...
echo ════════════════════════════════════════
python -m pip install opencv-python==4.8.1.78
goto success

:pdf2image
echo.
echo ════════════════════════════════════════
echo Устанавливаю pdf2image...
echo ════════════════════════════════════════
python -m pip install pdf2image==1.16.3
goto success

:easyocr
echo.
echo ════════════════════════════════════════
echo Устанавливаю easyocr...
echo ════════════════════════════════════════
echo ⚠️  Это может занять 5-10 минут (большая библиотека)
python -m pip install easyocr==1.7.0
goto success

:all
echo.
echo ════════════════════════════════════════
echo Устанавливаю ВСЕ библиотеки...
echo ════════════════════════════════════════
python -m pip install opencv-python==4.8.1.78
python -m pip install easyocr==1.7.0
python -m pip install pytesseract==0.3.10
python -m pip install pdf2image==1.16.3
goto success

:success
if errorlevel 1 (
    echo.
    echo ❌ Ошибка установки!
) else (
    echo.
    echo ✅ Установка завершена успешно!
)
goto end

:invalid
echo.
echo ❌ Неверный выбор!
goto end

:end
echo.
pause



