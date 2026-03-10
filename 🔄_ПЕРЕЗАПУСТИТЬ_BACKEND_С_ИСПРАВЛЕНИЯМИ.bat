@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🔄 ПЕРЕЗАПУСК BACKEND С ИСПРАВЛЕНИЯМИ
echo ========================================
echo.
echo Исправлена ошибка: could not convert string to float
echo.
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Активация виртуального окружения...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo ✅ Виртуальное окружение активировано
) else (
    echo ❌ Виртуальное окружение не найдено!
    pause
    exit /b 1
)

echo.
echo [2/2] Запуск Backend с исправлениями...
echo.
echo ========================================
echo 📡 Backend запускается на http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo ✅ Исправления применены:
echo    - Безопасная обработка пустых значений
echo    - Защита от деления на 0
echo    - Удаление бесконечностей
echo    - Обрезка отрицательных цен
echo.
echo 🔄 Для остановки нажмите Ctrl+C
echo ========================================
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
