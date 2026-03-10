@echo off
chcp 65001 > nul
cls
echo.
echo ========================================
echo   🎨 ЗАПУСК FRONTEND
echo ========================================
echo.

cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS\frontend"

echo ✅ Запуск React + Vite...
echo.
echo 🌐 Frontend будет доступен на: http://localhost:5173
echo.
echo ⚠️  Для остановки нажмите Ctrl+C
echo.

npm run dev

pause
