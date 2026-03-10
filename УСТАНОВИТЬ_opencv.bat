@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА opencv-python
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

REM Активация виртуального окружения
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo ❌ Виртуальное окружение не найдено!
    pause
    exit /b 1
)

echo Обновляю pip...
python -m pip install --upgrade pip

echo.
echo Устанавливаю opencv-python==4.8.1.78...
python -m pip install opencv-python==4.8.1.78

if errorlevel 1 (
    echo.
    echo ❌ Ошибка установки!
) else (
    echo.
    echo ✅ opencv-python установлен успешно!
)

echo.
pause



