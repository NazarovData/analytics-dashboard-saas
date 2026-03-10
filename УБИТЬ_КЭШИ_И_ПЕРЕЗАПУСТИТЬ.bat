@echo off
chcp 65001 >nul
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo   💥 АГРЕССИВНАЯ ОЧИСТКА КЭШЕЙ И ПЕРЕЗАПУСК
echo ═══════════════════════════════════════════════════════════
echo.

echo 🔴 Шаг 1: Убиваем ВСЕ процессы Python...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM pythonw.exe 2>nul
timeout /t 3 >nul
echo ✅ Процессы остановлены
echo.

echo 🗑️ Шаг 2: Удаляем ВСЕ __pycache__ папки...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
echo ✅ __pycache__ удалены
echo.

echo 🗑️ Шаг 3: Удаляем ВСЕ .pyc файлы...
del /s /q *.pyc 2>nul
echo ✅ .pyc файлы удалены
echo.

echo 🗑️ Шаг 4: Удаляем .pytest_cache...
if exist ".pytest_cache" rd /s /q ".pytest_cache"
echo ✅ pytest cache удалён
echo.

echo 🔄 Шаг 5: Ждём 2 секунды...
timeout /t 2 >nul
echo.

echo ═══════════════════════════════════════════════════════════
echo   🚀 ЗАПУСК BACKEND С ЧИСТОГО ЛИСТА
echo ═══════════════════════════════════════════════════════════
echo.

venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
