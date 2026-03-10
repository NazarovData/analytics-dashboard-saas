@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   📦 УСТАНОВКА НОВЫХ ЗАВИСИМОСТЕЙ
echo ═══════════════════════════════════════════════════════════
echo.

echo 🔄 Активация виртуального окружения...
call venv\Scripts\activate

echo.
echo 📊 Установка PostgreSQL...
pip install psycopg2-binary sqlalchemy alembic

echo.
echo 📄 Установка PDF экспорта...
pip install reportlab pillow

echo.
echo 🔗 Установка библиотек для интеграций...
pip install aiohttp httpx

echo.
echo ✅ Все зависимости установлены!
echo.
pause
