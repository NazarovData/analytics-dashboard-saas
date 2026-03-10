@echo off
chcp 65001 >nul
echo ========================================
echo   ЗАПУСК ЧЕРЕЗ CMD
echo ========================================
echo.

cd /d "%~dp0"

REM Проверка и создание venv если нужно
if not exist "venv\Scripts\activate.bat" (
    echo ⚠️  Виртуальное окружение не найдено!
    echo Создаю venv...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q -r requirements.txt
    echo ✅ Venv создан и зависимости установлены!
    echo.
)

echo Активирую виртуальное окружение...
call venv\Scripts\activate.bat

echo.
echo ✅ Venv активирован!
echo.
echo Теперь вы можете запускать команды:
echo.
echo Для бэкенда:
echo   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Для фронтенда (в другом окне):
echo   cd frontend
echo   npm run dev
echo.
echo Или просто запустите: ЗАПУСК.bat
echo.
pause



























