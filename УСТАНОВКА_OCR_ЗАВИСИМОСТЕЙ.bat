@echo off
chcp 65001 > nul
cls
echo.
echo ╔══════════════════════════════════════════╗
echo ║   УСТАНОВКА OCR ЗАВИСИМОСТЕЙ            ║
echo ╚══════════════════════════════════════════╝
echo.
echo Установка библиотек для распознавания текста из фотографий
echo.
echo ⚠️  ВАЖНО: Убедитесь, что виртуальное окружение активировано!
echo    Должно быть видно (venv) в начале строки
echo.
pause

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
echo ╔══════════════════════════════════════════╗
echo ║   УСТАНОВКА ПО ОТДЕЛЬНОСТИ               ║
echo ╚══════════════════════════════════════════╝
echo.
echo Выберите библиотеку для установки:
echo.
echo [1] pytesseract - Обёртка для Tesseract OCR
echo [2] opencv-python - Обработка изображений
echo [3] pdf2image - Конвертация PDF в изображения
echo [4] easyocr - OCR с поддержкой таджикского языка
echo [5] Установить ВСЕ библиотеки
echo [0] Выход
echo.
set /p choice="Введите номер (0-5): "

if "%choice%"=="1" goto install_pytesseract
if "%choice%"=="2" goto install_opencv
if "%choice%"=="3" goto install_pdf2image
if "%choice%"=="4" goto install_easyocr
if "%choice%"=="5" goto install_all
if "%choice%"=="0" goto end
goto invalid_choice

:install_pytesseract
echo.
echo ════════════════════════════════════════
echo 📦 Установка pytesseract...
echo ════════════════════════════════════════
python -m pip install --upgrade pip
python -m pip install pytesseract==0.3.10
if errorlevel 1 (
    echo ❌ Ошибка установки pytesseract
    pause
    goto menu
) else (
    echo ✅ pytesseract установлен успешно!
    echo.
    echo ⚠️  ВАЖНО: Для работы нужен Tesseract OCR
    echo    Скачайте с: https://github.com/UB-Mannheim/tesseract/wiki
    echo    Или используйте EasyOCR (вариант 4)
)
pause
goto menu

:install_opencv
echo.
echo ════════════════════════════════════════
echo 📦 Установка opencv-python...
echo ════════════════════════════════════════
python -m pip install --upgrade pip
python -m pip install opencv-python==4.8.1.78
if errorlevel 1 (
    echo ❌ Ошибка установки opencv-python
    pause
    goto menu
) else (
    echo ✅ opencv-python установлен успешно!
)
pause
goto menu

:install_pdf2image
echo.
echo ════════════════════════════════════════
echo 📦 Установка pdf2image...
echo ════════════════════════════════════════
python -m pip install --upgrade pip
python -m pip install pdf2image==1.16.3
if errorlevel 1 (
    echo ❌ Ошибка установки pdf2image
    pause
    goto menu
) else (
    echo ✅ pdf2image установлен успешно!
    echo.
    echo ⚠️  ВАЖНО: Для работы нужен poppler
    echo    Windows: https://github.com/oschwartz10612/poppler-windows/releases
    echo    Или используйте только изображения (JPG/PNG)
)
pause
goto menu

:install_easyocr
echo.
echo ════════════════════════════════════════
echo 📦 Установка easyocr...
echo ════════════════════════════════════════
echo ⚠️  Это большая библиотека (~500MB), установка может занять время
echo.
python -m pip install --upgrade pip
python -m pip install easyocr==1.7.0
if errorlevel 1 (
    echo ❌ Ошибка установки easyocr
    pause
    goto menu
) else (
    echo ✅ easyocr установлен успешно!
    echo.
    echo ✅ Поддержка языков: русский, английский, таджикский
)
pause
goto menu

:install_all
echo.
echo ════════════════════════════════════════
echo 📦 Установка ВСЕХ библиотек...
echo ════════════════════════════════════════
echo.
python -m pip install --upgrade pip
echo.
echo [1/4] Устанавливаю pytesseract...
python -m pip install pytesseract==0.3.10
echo.
echo [2/4] Устанавливаю opencv-python...
python -m pip install opencv-python==4.8.1.78
echo.
echo [3/4] Устанавливаю pdf2image...
python -m pip install pdf2image==1.16.3
echo.
echo [4/4] Устанавливаю easyocr (это может занять время)...
python -m pip install easyocr==1.7.0
echo.
echo ✅ Все библиотеки установлены!
pause
goto menu

:invalid_choice
echo.
echo ❌ Неверный выбор. Попробуйте снова.
pause
goto menu

:menu
cls
echo.
echo ╔══════════════════════════════════════════╗
echo ║   УСТАНОВКА OCR ЗАВИСИМОСТЕЙ            ║
echo ╚══════════════════════════════════════════╝
echo.
echo Выберите библиотеку для установки:
echo.
echo [1] pytesseract - Обёртка для Tesseract OCR
echo [2] opencv-python - Обработка изображений
echo [3] pdf2image - Конвертация PDF в изображения
echo [4] easyocr - OCR с поддержкой таджикского языка
echo [5] Установить ВСЕ библиотеки
echo [0] Выход
echo.
set /p choice="Введите номер (0-5): "

if "%choice%"=="1" goto install_pytesseract
if "%choice%"=="2" goto install_opencv
if "%choice%"=="3" goto install_pdf2image
if "%choice%"=="4" goto install_easyocr
if "%choice%"=="5" goto install_all
if "%choice%"=="0" goto end
goto invalid_choice

:end
echo.
echo До свидания!
pause
exit /b 0



