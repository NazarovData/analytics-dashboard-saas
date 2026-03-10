@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   БЫСТРАЯ УСТАНОВКА (БЕЗ EASYOCR)
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo Активирую виртуальное окружение...
call venv\Scripts\activate.bat

echo.
echo Устанавливаю зависимости из requirements.txt (без easyocr)...
venv\Scripts\python.exe -m pip install --upgrade pip

REM Устанавливаем все кроме easyocr
venv\Scripts\python.exe -m pip install fastapi==0.104.1 "uvicorn[standard]==0.24.0" gunicorn==21.2.0
venv\Scripts\python.exe -m pip install "sqlalchemy[asyncio]==2.0.23" asyncpg==0.29.0 alembic==1.12.1 psycopg2-binary==2.9.9
venv\Scripts\python.exe -m pip install "python-jose[cryptography]==3.3.0" "passlib[bcrypt]==1.7.4" python-multipart==0.0.6
venv\Scripts\python.exe -m pip install pandas==2.1.3 openpyxl==3.1.2 xlsxwriter==3.1.9 numpy==1.26.2 python-dateutil==2.8.2
venv\Scripts\python.exe -m pip install httpx==0.25.1 clickhouse-driver==0.2.6
venv\Scripts\python.exe -m pip install google-api-python-client==2.108.0 google-auth-httplib2==0.1.1 google-auth-oauthlib==1.1.0
venv\Scripts\python.exe -m pip install python-cors==1.0.0 pydantic==2.5.0 pydantic-settings==2.1.0
venv\Scripts\python.exe -m pip install redis==5.0.1 aioredis==2.0.1 slowapi==0.1.9 loguru==0.7.2
venv\Scripts\python.exe -m pip install yookassa==3.0.0 stripe==7.0.0
venv\Scripts\python.exe -m pip install pytest==7.4.3 pytest-asyncio==0.21.1
venv\Scripts\python.exe -m pip install pyotp==2.9.0 "qrcode[pil]==7.4.2" Pillow==10.1.0

echo.
echo Устанавливаю OCR библиотеки (без easyocr)...
venv\Scripts\python.exe -m pip install opencv-python==4.8.1.78
venv\Scripts\python.exe -m pip install pytesseract==0.3.10

echo.
echo ════════════════════════════════════════
echo ✅ УСТАНОВКА ЗАВЕРШЕНА!
echo ════════════════════════════════════════
echo.
echo Система готова к работе (без easyocr)
echo Для поддержки таджикского языка установите easyocr позже:
echo   venv\Scripts\python.exe -m pip install easyocr==1.7.0
echo.
pause



