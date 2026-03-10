@echo off
chcp 65001 >nul
cls
echo ============================================
echo 🐘 Полная настройка PostgreSQL интеграции
echo ============================================
echo.

echo 📦 Шаг 1/3: Установка драйвера...
echo.
venv\Scripts\pip install psycopg2-binary
echo.

echo ✅ Драйвер установлен!
echo.
echo ============================================
echo 📋 Шаг 2/3: Создание тестовой базы
echo ============================================
echo.
echo Выполните в PostgreSQL (pgAdmin или psql):
echo.
echo   psql -U postgres -f create_test_database.sql
echo.
echo Или создайте базу вручную:
echo   1. Создайте базу: analitix_db
echo   2. Создайте таблицу: sales
echo   3. Добавьте тестовые данные
echo.
echo ============================================
echo 🔌 Шаг 3/3: Подключение
echo ============================================
echo.
echo 1. Откройте: http://localhost:3000/integrations
echo 2. Нажмите на PostgreSQL
echo 3. Введите данные подключения:
echo.
echo    Connection String:
echo    postgresql://postgres:ваш_пароль@localhost:5432/analitix_db
echo.
echo    Table: sales
echo.
echo 4. Нажмите "Подключить"
echo 5. Нажмите кнопку синхронизации 🔄
echo.
echo ============================================
echo ✅ Настройка завершена!
echo ============================================
echo.
echo Backend нужно перезапустить для применения изменений.
echo Нажмите Ctrl+C в окне backend и запустите снова.
echo.
pause
