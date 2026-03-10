@echo off
chcp 65001 >nul
cls
color 0A
echo.
echo ═══════════════════════════════════════════════════════════
echo   🚀 ЗАПУСК BACKEND СЕРВЕРА
echo ═══════════════════════════════════════════════════════════
echo.
echo 📍 Путь: %~dp0
echo.
echo 🔄 Очистка кэшей...
if exist "app\api\v1\__pycache__" rd /s /q "app\api\v1\__pycache__" 2>nul
if exist "app\services\__pycache__" rd /s /q "app\services\__pycache__" 2>nul
echo ✅ Кэши очищены
echo.
echo ═══════════════════════════════════════════════════════════
echo   🚀 ЗАПУСК...
echo ═══════════════════════════════════════════════════════════
echo.
echo ⏳ Ждите сообщение: "Application startup complete"
echo 🌐 Потом откройте: http://localhost:3000
echo.
echo ═══════════════════════════════════════════════════════════
echo.

venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

echo.
echo ═══════════════════════════════════════════════════════════
echo   ⚠️ BACKEND ОСТАНОВЛЕН
echo ═══════════════════════════════════════════════════════════
echo.
pause
