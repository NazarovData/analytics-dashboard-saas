@echo off
chcp 65001 >nul
echo ============================================
echo 🐘 Установка PostgreSQL драйвера
echo ============================================
echo.

echo 📦 Устанавливаем psycopg2-binary...
venv\Scripts\pip install psycopg2-binary

echo.
echo ============================================
echo ✅ Установка завершена!
echo ============================================
echo.
echo Теперь можно подключаться к реальной PostgreSQL базе!
echo.
pause
