@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🔄 ПОЛНАЯ ПЕРЕЗАГРУЗКА BACKEND
echo ═══════════════════════════════════════════════════════════
echo.

echo 📋 Шаг 1: Остановка всех процессов Python...
taskkill /F /IM python.exe 2>nul
timeout /t 2 >nul

echo 🗑️ Шаг 2: Очистка кэша Python...
if exist "app\__pycache__" rd /s /q "app\__pycache__"
if exist "app\api\__pycache__" rd /s /q "app\api\__pycache__"
if exist "app\api\v1\__pycache__" rd /s /q "app\api\v1\__pycache__"
if exist "app\core\__pycache__" rd /s /q "app\core\__pycache__"
if exist "app\services\__pycache__" rd /s /q "app\services\__pycache__"
if exist "app\models\__pycache__" rd /s /q "app\models\__pycache__"
if exist "app\schemas\__pycache__" rd /s /q "app\schemas\__pycache__"
echo ✅ Кэш очищен

echo.
echo 🚀 Шаг 3: Запуск backend...
echo.
venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
