@echo off
chcp 65001 >nul
echo ========================================
echo   СОЗДАНИЕ АВТОЗАПУСКА В ПЛАНИРОВЩИКЕ
echo ========================================
echo.

cd /d "%~dp0"

echo Создаю задачу в планировщике Windows...
echo.

REM Создание задачи для автозапуска
schtasks /Create /TN "BizPulse Auto Start" /TR "%~dp0СЕРВИС_ЗАПУСК.bat" /SC ONLOGON /RL HIGHEST /F >nul 2>&1

if %errorlevel%==0 (
    echo ✅ Задача создана в планировщике!
    echo.
    echo Задача будет запускаться при входе в Windows.
    echo.
    echo Для удаления задачи выполните:
    echo   schtasks /Delete /TN "BizPulse Auto Start" /F
    echo.
) else (
    echo ⚠️  Не удалось создать задачу автоматически.
    echo.
    echo Создайте задачу вручную:
    echo 1. Откройте Планировщик задач (taskschd.msc)
    echo 2. Создайте простую задачу
    echo 3. Триггер: При входе в Windows
    echo 4. Действие: Запустить программу
    echo 5. Программа: %~dp0СЕРВИС_ЗАПУСК.bat
    echo.
)

pause







