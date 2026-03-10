@echo off
chcp 65001 >nul
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo   🚀 ЗАПУСК BACKEND С ОЧИСТКОЙ КЭШЕЙ
echo ═══════════════════════════════════════════════════════════
echo.

echo 🗑️ Шаг 1: Удаляем кэши...
if exist "app\__pycache__" rd /s /q "app\__pycache__"
if exist "app\api\__pycache__" rd /s /q "app\api\__pycache__"
if exist "app\api\v1\__pycache__" rd /s /q "app\api\v1\__pycache__"
if exist "app\core\__pycache__" rd /s /q "app\core\__pycache__"
if exist "app\services\__pycache__" rd /s /q "app\services\__pycache__"
if exist "app\models\__pycache__" rd /s /q "app\models\__pycache__"
if exist "app\schemas\__pycache__" rd /s /q "app\schemas\__pycache__"
echo ✅ Кэши удалены
echo.

echo 🚀 Шаг 2: Запускаем backend...
echo.
venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
