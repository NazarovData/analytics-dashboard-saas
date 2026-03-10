@echo off
chcp 65001 >nul
cls
color 0A
echo.
echo ═══════════════════════════════════════════════════════════
echo   🔥 ФИНАЛЬНЫЙ ЗАПУСК - ВСЕ DATETIME ИСПРАВЛЕНЫ
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ Исправлено в 4 файлах:
echo    - app/api/v1/files.py
echo    - app/services/notifications.py
echo    - app/api/v1/business_metrics.py
echo    - app/api/v1/advanced.py
echo.
echo ═══════════════════════════════════════════════════════════
echo.

echo 🛑 Останавливаем все процессы Python...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM pythonw.exe 2>nul
timeout /t 2 >nul
echo ✅ Процессы остановлены
echo.

echo 🗑️ Удаляем ВСЕ кэши...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d" 2>nul
del /s /q *.pyc 2>nul
echo ✅ Кэши удалены
echo.

echo 🔄 Ждём 3 секунды...
timeout /t 3 >nul
echo.

echo ═══════════════════════════════════════════════════════════
echo   🚀 ЗАПУСК BACKEND
echo ═══════════════════════════════════════════════════════════
echo.
echo ⏳ Ждите сообщение: "Application startup complete"
echo 🌐 Потом откройте: http://localhost:3000
echo 📤 Загрузите файл - ошибка datetime НЕ должна появиться!
echo.
echo ═══════════════════════════════════════════════════════════
echo.

set PYTHONDONTWRITEBYTECODE=1
venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
