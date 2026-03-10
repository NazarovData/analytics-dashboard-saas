@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🚀 ЗАПУСК BACKEND С ПОДРОБНЫМИ ОШИБКАМИ
echo ═══════════════════════════════════════════════════════════
echo.

venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug

pause
