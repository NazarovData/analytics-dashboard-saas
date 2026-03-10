@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   ПРОВЕРКА УСТАНОВЛЕННЫХ БИБЛИОТЕК
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo Активирую виртуальное окружение...
call venv\Scripts\activate.bat

echo.
echo ════════════════════════════════════════
echo ОСНОВНЫЕ БИБЛИОТЕКИ
echo ════════════════════════════════════════
echo.

echo [1] Python версия:
venv\Scripts\python.exe --version

echo.
echo [2] pip версия:
venv\Scripts\python.exe -m pip --version

echo.
echo ════════════════════════════════════════
echo ПРОВЕРКА БИБЛИОТЕК
echo ════════════════════════════════════════
echo.

echo [3] FastAPI:
venv\Scripts\python.exe -c "import fastapi; print('  ✅ Установлен, версия:', fastapi.__version__)" 2>nul || echo "  ❌ Не установлен"

echo.
echo [4] Uvicorn:
venv\Scripts\python.exe -c "import uvicorn; print('  ✅ Установлен, версия:', uvicorn.__version__)" 2>nul || echo "  ❌ Не установлен"

echo.
echo [5] Pandas:
venv\Scripts\python.exe -c "import pandas; print('  ✅ Установлен, версия:', pandas.__version__)" 2>nul || echo "  ❌ Не установлен"

echo.
echo [6] NumPy:
venv\Scripts\python.exe -c "import numpy; print('  ✅ Установлен, версия:', numpy.__version__)" 2>nul || echo "  ❌ Не установлен"

echo.
echo [7] OpenCV:
venv\Scripts\python.exe -c "import cv2; print('  ✅ Установлен, версия:', cv2.__version__)" 2>nul || echo "  ❌ Не установлен"

echo.
echo [8] EasyOCR:
venv\Scripts\python.exe -c "import easyocr; print('  ✅ Установлен')" 2>nul || echo "  ❌ Не установлен (не критично)"

echo.
echo [9] SQLAlchemy:
venv\Scripts\python.exe -c "import sqlalchemy; print('  ✅ Установлен, версия:', sqlalchemy.__version__)" 2>nul || echo "  ❌ Не установлен"

echo.
echo [10] Pydantic:
venv\Scripts\python.exe -c "import pydantic; print('  ✅ Установлен, версия:', pydantic.__version__)" 2>nul || echo "  ❌ Не установлен"

echo.
echo ════════════════════════════════════════
echo ВСЕ УСТАНОВЛЕННЫЕ ПАКЕТЫ
echo ════════════════════════════════════════
echo.

venv\Scripts\python.exe -m pip list

echo.
pause



