@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo    🚀 ANALITIX AI - ЗАПУСК
echo ========================================
echo.

echo 📋 Шаг 1: Установка reportlab...
venv\Scripts\python.exe -m pip install reportlab xlsxwriter --quiet

echo.
echo 📋 Шаг 2: Запуск Backend...
echo.
echo Backend запускается на http://localhost:8000
echo Документация: http://localhost:8000/docs
echo.
echo Для остановки нажми Ctrl+C
echo.

venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
