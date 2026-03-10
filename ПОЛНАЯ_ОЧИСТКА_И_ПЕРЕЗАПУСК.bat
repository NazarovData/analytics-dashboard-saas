@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🧹 ПОЛНАЯ ОЧИСТКА КЭША И ПЕРЕЗАПУСК
echo ═══════════════════════════════════════════════════════════
echo.

echo 🧹 Удаление ВСЕХ __pycache__ папок...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"

echo 🧹 Удаление .pyc файлов...
del /s /q *.pyc 2>nul

echo 🧹 Удаление .pyo файлов...
del /s /q *.pyo 2>nul

echo.
echo ✅ Кэш полностью очищен!
echo.
echo 🚀 Запуск backend...
echo.

venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
