@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🔄 ПЕРЕЗАПУСК FRONTEND (исправление Not Found)
echo ═══════════════════════════════════════════════════════════
echo.

cd frontend

echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo ⚠️  node_modules не найден, устанавливаем...
    call npm install
)

echo.
echo 🚀 Запуск dev-сервера...
echo.
echo ✅ После запуска откройте:
echo    http://localhost:3000/register
echo.
echo 💡 Для остановки нажмите Ctrl+C
echo.

call npm run dev

pause
