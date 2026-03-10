@echo off
chcp 65001 >nul
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo   🔍 ЗАПУСК С ПОЛНЫМ ВЫВОДОМ ОШИБОК
echo ═══════════════════════════════════════════════════════════
echo.

set PYTHONDONTWRITEBYTECODE=1
set PYTHONUNBUFFERED=1

venv\Scripts\python.exe -u -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug

pause
