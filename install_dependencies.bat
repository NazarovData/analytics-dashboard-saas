@echo off
chcp 65001 > nul
cls
echo.
echo ========================================
echo   📦 УСТАНОВКА ЗАВИСИМОСТЕЙ
echo ========================================
echo.

echo 🔧 ШАГ 1: Backend зависимости...
echo.
cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"

if not exist venv (
    echo ⚠️  Виртуальное окружение не найдено!
    echo 🔨 Создаю venv...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ✅ Backend зависимости установлены!
echo.
echo ========================================
echo.

echo 🎨 ШАГ 2: Frontend зависимости...
echo.
cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS\frontend"

echo 📦 Устанавливаю npm пакеты...
call npm install

echo.
echo 📥 Устанавливаю дополнительные пакеты для PDF...
call npm install jspdf html2canvas

echo.
echo ✅ Frontend зависимости установлены!
echo.
echo ========================================
echo.
echo 🎉 ВСЕ ЗАВИСИМОСТИ УСТАНОВЛЕНЫ!
echo.
echo 📝 Можете запустить систему:
echo    - Используйте start_all.bat
echo.
pause





