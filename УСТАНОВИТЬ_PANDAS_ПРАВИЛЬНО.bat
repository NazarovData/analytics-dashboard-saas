@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА PANDAS (БИНАРНЫЙ ПАКЕТ)
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

call venv\Scripts\activate.bat

echo Устанавливаю pandas из бинарного пакета (без компиляции)...
venv\Scripts\python.exe -m pip install --upgrade pip

echo.
echo Пробую установить последнюю версию pandas (имеет бинарные пакеты)...
venv\Scripts\python.exe -m pip install pandas --only-binary :all:

if errorlevel 1 (
    echo.
    echo Пробую установить pandas без ограничений...
    venv\Scripts\python.exe -m pip install pandas
)

echo.
echo Проверяю установку...
venv\Scripts\python.exe -c "import pandas; print('✅ pandas установлен, версия:', pandas.__version__)"

echo.
pause



