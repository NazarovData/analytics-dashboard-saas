@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА БИНАРНОГО NUMPY
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

call venv\Scripts\activate.bat

echo Устанавливаю бинарную версию NumPy (без компиляции)...
echo.

venv\Scripts\python.exe -m pip install numpy "<2.0" --only-binary :all:

if errorlevel 1 (
    echo.
    echo Пробую установить последнюю версию NumPy 1.x...
    venv\Scripts\python.exe -m pip install "numpy>=1.26.0,<2.0.0"
)

echo.
echo Проверяю установку...
venv\Scripts\python.exe -c "import numpy; print('✅ NumPy установлен, версия:', numpy.__version__)"

echo.
pause


