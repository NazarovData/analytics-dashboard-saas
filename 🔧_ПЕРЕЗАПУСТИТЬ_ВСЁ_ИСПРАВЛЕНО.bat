@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🔧 ПЕРЕЗАПУСК ПОСЛЕ ИСПРАВЛЕНИЙ
echo ========================================
echo.
echo ✅ Исправлено:
echo    - Ошибка "Cannot read properties of undefined"
echo    - 404 Not Found для period-comparison
echo    - 404 Not Found для white-label
echo.
echo 📝 Что нужно сделать:
echo    1. Запустить этот файл (backend)
echo    2. В новом терминале: cd frontend ^&^& npm run dev
echo    3. Очистить кэш браузера (Ctrl+Shift+Delete)
echo.
echo ⏳ Запускаем backend...
echo.

cd /d "%~dp0"

REM Активируем виртуальное окружение если есть
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo ✅ Виртуальное окружение активировано
)

echo.
echo 🚀 Запуск backend на порту 8000...
echo.
echo 📝 Логи:
echo ========================================
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
