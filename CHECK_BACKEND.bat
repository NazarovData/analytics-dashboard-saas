@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🔍 ПРОВЕРКА BACKEND                                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📋 Проверка импорта модулей...
venv\Scripts\python.exe -c "from app.services.ai_analyzer_v3 import AIAnalyzerV3; from app.services.data_processor import DataProcessor; from app.services.anomaly_detector import AnomalyDetector; from app.services.trust_score import TrustScoreCalculator; print('✅ Все модули импортируются')"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка импорта модулей!
    pause
    exit /b 1
)

echo.
echo 🌐 Проверка доступности backend...
curl http://localhost:8000/docs 2>nul | findstr /C:"Swagger" >nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend работает!
    echo 📚 Swagger UI: http://localhost:8000/docs
    echo 🌐 API: http://localhost:8000
) else (
    echo ⚠️ Backend не запущен или недоступен
    echo.
    echo 🚀 Запустите backend:
    echo    start_backend.bat
)

echo.
echo 📊 Проверка новых модулей качества данных...
venv\Scripts\python.exe -c "from app.services.data_processor import DataProcessor; dp = DataProcessor(); print('✅ DataProcessor работает')"
venv\Scripts\python.exe -c "from app.services.anomaly_detector import AnomalyDetector; ad = AnomalyDetector(); print('✅ AnomalyDetector работает')"
venv\Scripts\python.exe -c "from app.services.trust_score import TrustScoreCalculator; ts = TrustScoreCalculator(); print('✅ TrustScoreCalculator работает')"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  ✅ ПРОВЕРКА ЗАВЕРШЕНА                                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
pause
