@echo off
echo ========================================
echo Установка pydantic-settings
echo ========================================
echo.

cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"

echo Активация виртуального окружения...
call venv\Scripts\activate.bat

echo.
echo Установка pydantic-settings через python -m pip...
venv\Scripts\python.exe -m pip install pydantic-settings==2.1.0

echo.
echo Проверка установки...
venv\Scripts\python.exe -m pip show pydantic-settings

echo.
echo ========================================
echo Готово! Теперь можно запускать сервер
echo ========================================
pause

echo ========================================
echo Установка pydantic-settings
echo ========================================
echo.

cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"

echo Активация виртуального окружения...
call venv\Scripts\activate.bat

echo.
echo Установка pydantic-settings через python -m pip...
venv\Scripts\python.exe -m pip install pydantic-settings==2.1.0

echo.
echo Проверка установки...
venv\Scripts\python.exe -m pip show pydantic-settings

echo.
echo ========================================
echo Готово! Теперь можно запускать сервер
echo ========================================
pause









