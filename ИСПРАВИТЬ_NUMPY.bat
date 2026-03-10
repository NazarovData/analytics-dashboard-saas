@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С NUMPY
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo Проблема: NumPy 2.3.5 несовместим с opencv-python 4.8.1.78
echo Решение: Понижаем NumPy до версии 1.x
echo.

call venv\Scripts\activate.bat

echo Удаляю NumPy 2.3.5...
venv\Scripts\python.exe -m pip uninstall numpy -y

echo.
echo Устанавливаю NumPy 1.26.2 (совместим с opencv-python)...
venv\Scripts\python.exe -m pip install numpy==1.26.2

echo.
echo ✅ NumPy исправлен!
echo.
pause


