@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║       ⚡ БЫСТРОЕ РЕШЕНИЕ ПРОБЛЕМЫ С БАЗОЙ ДАННЫХ          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Диагностика...
echo.

REM Проверяем PostgreSQL
netstat -ano | findstr :5432 >nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL запущен на порту 5432
    set POSTGRES_RUNNING=1
) else (
    echo ❌ PostgreSQL НЕ запущен
    set POSTGRES_RUNNING=0
)

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 🎯 ВЫБЕРИТЕ ВАРИАНТ:
echo.
echo    1. Использовать SQLite (РЕКОМЕНДУЕТСЯ - проще всего!)
echo       ✅ Не требует PostgreSQL
echo       ✅ Работает сразу
echo       ✅ Идеально для разработки
echo.
echo    2. Настроить PostgreSQL (для продакшена)
echo       ⚠️ Требует создание базы данных
echo       ⚠️ Нужен пароль PostgreSQL
echo.
echo    3. Работать БЕЗ базы данных (текущий режим)
echo       ✅ Все функции работают
echo       ❌ История не сохраняется
echo.
echo ════════════════════════════════════════════════════════════
echo.

set /p choice="Введите номер (1, 2 или 3): "

if "%choice%"=="1" goto sqlite
if "%choice%"=="2" goto postgresql
if "%choice%"=="3" goto no_db
goto invalid

:sqlite
echo.
echo ════════════════════════════════════════════════════════════
echo 🔄 ПЕРЕКЛЮЧЕНИЕ НА SQLITE
echo ════════════════════════════════════════════════════════════
echo.
call 🔄_ПЕРЕКЛЮЧИТЬ_НА_SQLITE.bat
goto end

:postgresql
echo.
echo ════════════════════════════════════════════════════════════
echo 🔧 НАСТРОЙКА POSTGRESQL
echo ════════════════════════════════════════════════════════════
echo.
if %POSTGRES_RUNNING%==0 (
    echo ❌ PostgreSQL не запущен!
    echo.
    echo 💡 Сначала запустите PostgreSQL:
    echo    - Откройте "Службы" Windows
    echo    - Найдите "postgresql"
    echo    - Нажмите "Запустить"
    echo.
    echo    Или используйте вариант 1 (SQLite)
    echo.
    pause
    goto end
)
call 🚀_СОЗДАТЬ_БД_POSTGRESQL.bat
goto end

:no_db
echo.
echo ════════════════════════════════════════════════════════════
echo 📝 РАБОТА БЕЗ БАЗЫ ДАННЫХ
echo ════════════════════════════════════════════════════════════
echo.
echo ✅ Все функции работают:
echo    - Загрузка файлов
echo    - Анализ данных
echo    - AI инсайты
echo    - Экспорт PDF/Excel
echo    - Все 10 отраслей
echo.
echo ❌ Не работает:
echo    - История загрузок (не сохраняется)
echo    - Регистрация пользователей
echo.
echo 🚀 Запускаю backend...
echo.
call ▶️_ЗАПУСТИТЬ_BACKEND.bat
goto end

:invalid
echo.
echo ❌ Неверный выбор! Введите 1, 2 или 3
echo.
pause
goto end

:end
