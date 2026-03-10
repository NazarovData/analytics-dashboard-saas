@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 📊 УСТАНОВКА SEABORN ДЛЯ ГРАФИКОВ
echo ========================================
echo.
echo 🎨 Seaborn - лучшая библиотека для графиков!
echo.
echo ⏳ Устанавливаем...
echo.

cd /d "%~dp0"

REM Активируем виртуальное окружение если есть
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo ✅ Виртуальное окружение активировано
)

echo.
echo 📦 Устанавливаем matplotlib и seaborn...
echo.

pip install matplotlib==3.8.2
pip install seaborn==0.13.0

echo.
echo ========================================
echo ✅ УСТАНОВКА ЗАВЕРШЕНА!
echo ========================================
echo.
echo 📊 Теперь доступны:
echo    - Красивые столбчатые диаграммы
echo    - Линейные графики с трендами
echo    - Круговые диаграммы
echo    - Тепловые карты
echo    - И многое другое!
echo.
echo 🚀 Перезапустите backend:
echo    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.

pause
