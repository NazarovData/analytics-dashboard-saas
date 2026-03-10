@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 БЫСТРЫЙ ТЕСТ ВСЕХ API
echo ========================================
echo.

echo Проверяю доступность API...
echo.

REM Проверка базового endpoint
echo 1. Проверка базового endpoint...
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo    ❌ Сервер не запущен!
    echo    Запустите: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    pause
    exit /b 1
)
echo    ✅ Сервер работает
echo.

REM Проверка алертов
echo 2. Проверка API алертов...
curl -s http://localhost:8000/api/v1/alerts/ >nul 2>&1
if errorlevel 1 (
    echo    ❌ Алерты не работают
) else (
    echo    ✅ Алерты работают
)
echo.

REM Проверка геоаналитики
echo 3. Проверка геоаналитики...
curl -s "http://localhost:8000/api/v1/geo/analytics?metric=revenue" >nul 2>&1
if errorlevel 1 (
    echo    ❌ Геоаналитика не работает
) else (
    echo    ✅ Геоаналитика работает
)
echo.

REM Проверка сравнения периодов
echo 4. Проверка сравнения периодов...
curl -s "http://localhost:8000/period-comparison/compare?period_type=month" >nul 2>&1
if errorlevel 1 (
    echo    ❌ Сравнение периодов не работает
) else (
    echo    ✅ Сравнение периодов работает
)
echo.

REM Проверка White Label
echo 5. Проверка White Label...
curl -s http://localhost:8000/white-label/ >nul 2>&1
if errorlevel 1 (
    echo    ❌ White Label не работает
) else (
    echo    ✅ White Label работает
)
echo.

REM Проверка 2FA
echo 6. Проверка 2FA...
curl -s "http://localhost:8000/2fa/status?user_id=test" >nul 2>&1
if errorlevel 1 (
    echo    ❌ 2FA не работает
) else (
    echo    ✅ 2FA работает
)
echo.

echo ========================================
echo ✅ ПРОВЕРКА ЗАВЕРШЕНА
echo ========================================
echo.
echo Откройте Swagger для детального тестирования:
echo http://localhost:8000/docs
echo.
pause

