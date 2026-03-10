@echo off
chcp 65001 >nul
echo ========================================
echo 🔐 УСТАНОВКА ЗАВИСИМОСТЕЙ ДЛЯ 2FA
echo ========================================
echo.

REM Переходим в папку проекта
cd /d "%~dp0"

echo 📂 Текущая папка: %CD%
echo.

REM Проверяем наличие venv
if not exist "venv\Scripts\activate.bat" (
    echo ❌ ОШИБКА: Виртуальное окружение не найдено!
    echo.
    echo Создайте venv командой:
    echo python -m venv venv
    echo.
    pause
    exit /b 1
)

echo ✅ Виртуальное окружение найдено
echo.

REM Активируем venv
echo 🔄 Активирую виртуальное окружение...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo ❌ Ошибка активации venv
    pause
    exit /b 1
)

echo ✅ Виртуальное окружение активировано
echo.

REM Обновляем pip
echo 📦 Обновляю pip...
python -m pip install --upgrade pip

REM Устанавливаем зависимости для 2FA
echo.
echo 📥 Устанавливаю зависимости для 2FA...
echo    - pyotp (TOTP коды)
echo    - qrcode (QR коды)
echo    - Pillow (изображения)
echo.

pip install pyotp qrcode[pil] Pillow

if errorlevel 1 (
    echo.
    echo ❌ Ошибка установки!
    echo.
    echo Попробуйте установить по отдельности:
    echo pip install pyotp
    echo pip install qrcode
    echo pip install Pillow
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Установка завершена!
echo.

REM Проверяем установку
echo 🔍 Проверяю установку...
python -c "import pyotp; import qrcode; from PIL import Image; print('✅ ВСЁ УСТАНОВЛЕНО ПРАВИЛЬНО!')"

if errorlevel 1 (
    echo ❌ Ошибка при проверке
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ ГОТОВО! Зависимости для 2FA установлены
echo ========================================
echo.
echo 📍 Зависимости находятся в:
echo    venv\Lib\site-packages\
echo.
pause

