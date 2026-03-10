@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   ПРОВЕРКА УСТАНОВЛЕННЫХ БИБЛИОТЕК
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"
call venv\Scripts\activate.bat

echo ✅ УСТАНОВЛЕНО:
echo.
venv\Scripts\python.exe -c "import fastapi; print('  ✅ FastAPI', fastapi.__version__)" 2>nul
venv\Scripts\python.exe -c "import uvicorn; print('  ✅ Uvicorn', uvicorn.__version__)" 2>nul
venv\Scripts\python.exe -c "import pandas; print('  ✅ Pandas', pandas.__version__)" 2>nul
venv\Scripts\python.exe -c "import numpy; print('  ✅ NumPy', numpy.__version__)" 2>nul
venv\Scripts\python.exe -c "import cv2; print('  ✅ OpenCV', cv2.__version__)" 2>nul
venv\Scripts\python.exe -c "import sqlalchemy; print('  ✅ SQLAlchemy', sqlalchemy.__version__)" 2>nul
venv\Scripts\python.exe -c "import pydantic; print('  ✅ Pydantic', pydantic.__version__)" 2>nul

echo.
echo ❌ НЕ УСТАНОВЛЕНО (для OCR):
echo.
venv\Scripts\python.exe -c "import easyocr; print('  ✅ EasyOCR установлен')" 2>nul || echo "  ❌ EasyOCR - не установлен (не критично)"
venv\Scripts\python.exe -c "import pytesseract; print('  ✅ Pytesseract установлен')" 2>nul || echo "  ❌ Pytesseract - не установлен (не критично)"

echo.
echo ════════════════════════════════════════
echo   СТАТУС: ГОТОВО К ЗАПУСКУ!
echo ════════════════════════════════════════
echo.
echo Все основные библиотеки установлены!
echo Сервер можно запускать.
echo.
echo Для запуска используйте:
echo   venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Или запустите: ЗАПУСК_СЕРВЕРА.bat
echo.
pause



