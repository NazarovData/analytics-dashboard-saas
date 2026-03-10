@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║   БЫСТРАЯ УСТАНОВКА БЕЗ PANDAS          ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/3] Активирую venv...
call venv\Scripts\activate.bat

echo.
echo [2/3] Устанавливаю только необходимые пакеты...
pip install fastapi uvicorn python-multipart

echo.
echo [3/3] Готово!
echo.
echo ✅ Теперь можете запустить:
echo    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
pause

