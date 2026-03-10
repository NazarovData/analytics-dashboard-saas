@echo off
chcp 65001 > nul
cls
echo.
echo ========================================
echo   🔍 ПРОВЕРКА СТАТУСА СИСТЕМЫ
echo ========================================
echo.

echo 📡 Проверяю Backend (порт 8000)...
netstat -ano | findstr :8000 > nul
if %errorlevel% == 0 (
    echo ✅ Backend запущен на http://localhost:8000
) else (
    echo ❌ Backend НЕ запущен
)

echo.
echo 🌐 Проверяю Frontend (порт 5173)...
netstat -ano | findstr :5173 > nul
if %errorlevel% == 0 (
    echo ✅ Frontend запущен на http://localhost:5173
) else (
    echo ❌ Frontend НЕ запущен
)

echo.
echo ========================================
echo.

echo 💡 Открыть в браузере:
echo.
echo    Backend API:  http://localhost:8000/docs
echo    Frontend:     http://localhost:5173
echo.
pause





