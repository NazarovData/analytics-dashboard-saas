@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🧹 ОЧИСТКА КЭША И ПЕРЕЗАПУСК BACKEND
echo ═══════════════════════════════════════════════════════════
echo.

echo 🧹 Удаление кэша Python...
if exist "app\__pycache__" rmdir /s /q "app\__pycache__"
if exist "app\api\__pycache__" rmdir /s /q "app\api\__pycache__"
if exist "app\api\v1\__pycache__" rmdir /s /q "app\api\v1\__pycache__"
if exist "app\core\__pycache__" rmdir /s /q "app\core\__pycache__"
if exist "app\models\__pycache__" rmdir /s /q "app\models\__pycache__"
if exist "app\services\__pycache__" rmdir /s /q "app\services\__pycache__"
if exist "app\schemas\__pycache__" rmdir /s /q "app\schemas\__pycache__"

echo ✅ Кэш очищен!
echo.
echo 🚀 Запуск backend...
echo.

venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
