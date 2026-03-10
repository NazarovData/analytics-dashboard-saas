@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          🚀 ЗАПУСК FRONTEND (React + Vite)                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd frontend

echo 📦 Проверка node_modules...
if not exist "node_modules" (
    echo ⚠️ node_modules не найден, устанавливаю зависимости...
    call npm install
)

echo.
echo ✅ Запускаю frontend на http://localhost:3000
echo.
echo 💡 ВАЖНО:
echo    - Backend должен быть запущен на порту 8000
echo    - Откройте браузер: http://localhost:3000
echo    - Для остановки нажмите Ctrl+C
echo.

call npm run dev

pause
