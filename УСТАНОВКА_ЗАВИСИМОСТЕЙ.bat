@echo off
chcp 65001 >nul
echo ====================================
echo 🚀 УСТАНОВКА ЗАВИСИМОСТЕЙ ФАЗЫ 1
echo ====================================
echo.

echo [1/4] Активация виртуального окружения...
call venv\Scripts\activate.bat

echo.
echo [2/4] Установка Python пакетов...
pip install pandas openpyxl

echo.
echo [3/4] Переход в frontend...
cd frontend

echo.
echo [4/4] Установка npm пакетов...
call npm install recharts

echo.
echo ====================================
echo ✅ ВСЕ ЗАВИСИМОСТИ УСТАНОВЛЕНЫ!
echo ====================================
echo.
echo Теперь можете запускать серверы:
echo.
echo Терминал 1 (Backend):
echo   cd "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
echo   venv\Scripts\activate.bat
echo   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Терминал 2 (Frontend):
echo   cd "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS\frontend"
echo   npm run dev
echo.
pause
