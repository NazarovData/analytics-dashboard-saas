@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   ЗАПУСК СЕРВЕРА
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo Активирую виртуальное окружение...
call venv\Scripts\activate.bat

echo.
echo Запускаю сервер...
echo Сервер будет доступен на: http://localhost:8000
echo Документация API: http://localhost:8000/docs
echo.
echo Для остановки нажмите Ctrl+C
echo.

venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause



