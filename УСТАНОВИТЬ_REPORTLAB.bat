@echo off
chcp 65001 >nul
echo ========================================
echo 📄 УСТАНОВКА REPORTLAB ДЛЯ PDF ЭКСПОРТА
echo ========================================
echo.

echo 📋 Активация виртуального окружения...
call venv\Scripts\activate.bat

echo.
echo 📦 Установка reportlab...
pip install reportlab

echo.
echo 📦 Установка xlsxwriter (для Excel)...
pip install xlsxwriter

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo ✅ REPORTLAB УСТАНОВЛЕН УСПЕШНО!
    echo ========================================
    echo.
    echo Теперь доступен экспорт в:
    echo   📄 PDF - красивые отчёты
    echo   📊 Excel - таблицы
    echo   📋 CSV - сырые данные
    echo.
    echo Запустите сервер:
    echo   ▶️_ЗАПУСТИТЬ_BACKEND.bat
    echo.
) else (
    echo ========================================
    echo ❌ ОШИБКА УСТАНОВКИ
    echo ========================================
    echo.
    echo Попробуйте вручную:
    echo   venv\Scripts\activate
    echo   pip install reportlab xlsxwriter
    echo.
)

pause
