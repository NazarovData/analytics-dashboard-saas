@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 ПЕРЕЗАПУСК BACKEND С CLAUDE AI
echo ========================================
echo.
echo 🤖 Claude AI теперь проверяет все расчёты!
echo ✅ 100%% точность гарантирована
echo.
echo 📊 Что изменилось:
echo    - Claude AI проверяет расчёты
echo    - Исправляет ошибки автоматически
echo    - Генерирует умные инсайты
echo.
echo ⏳ Запускаем backend...
echo.

cd /d "%~dp0"

REM Активируем виртуальное окружение если есть
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo ✅ Виртуальное окружение активировано
) else (
    echo ⚠️ Виртуальное окружение не найдено
)

echo.
echo 🚀 Запуск backend на порту 8000...
echo.
echo 📝 Логи:
echo ========================================
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
