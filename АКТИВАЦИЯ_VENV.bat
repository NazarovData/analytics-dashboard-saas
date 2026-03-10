@echo off
chcp 65001 >nul
echo ========================================
echo   АКТИВАЦИЯ ВИРТУАЛЬНОГО ОКРУЖЕНИЯ
echo ========================================
echo.

cd /d "%~dp0"

REM Проверка существования venv
if not exist "venv\Scripts\activate.bat" (
    echo ⚠️  Виртуальное окружение не найдено!
    echo.
    echo Создаю виртуальное окружение...
    python -m venv venv
    
    if errorlevel 1 (
        echo ❌ Ошибка создания venv!
        echo Проверьте что Python установлен: python --version
        pause
        exit /b 1
    )
    
    echo ✅ Виртуальное окружение создано!
    echo.
    echo Устанавливаю зависимости...
    call venv\Scripts\activate.bat
    pip install -q -r requirements.txt
    
    if errorlevel 1 (
        echo ⚠️  Ошибка установки зависимостей!
        pause
        exit /b 1
    )
    
    echo ✅ Зависимости установлены!
    echo.
) else (
    echo ✅ Виртуальное окружение найдено!
    echo.
    echo Активирую виртуальное окружение...
    call venv\Scripts\activate.bat
    
    echo ✅ Виртуальное окружение активировано!
    echo.
    echo Теперь вы можете запускать команды Python.
    echo Например: uvicorn app.main:app --reload
    echo.
)

echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
echo Виртуальное окружение активировано в этой сессии cmd.
echo.
pause



























