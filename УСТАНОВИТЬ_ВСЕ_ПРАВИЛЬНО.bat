@echo off
chcp 65001 > nul
cls
echo.
echo ════════════════════════════════════════
echo   УСТАНОВКА ВСЕХ ЗАВИСИМОСТЕЙ
echo ════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/6] Активирую виртуальное окружение...
if not exist venv\Scripts\activate.bat (
    echo ❌ Виртуальное окружение не найдено!
    echo Создаю новое...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Ошибка создания venv
        pause
        exit /b 1
    )
)
call venv\Scripts\activate.bat
echo ✅ Виртуальное окружение активировано

echo.
echo [2/6] Обновляю pip...
venv\Scripts\python.exe -m pip install --upgrade pip

echo.
echo [3/6] Устанавливаю основные зависимости (без pandas)...
venv\Scripts\python.exe -m pip install fastapi==0.104.1
venv\Scripts\python.exe -m pip install "uvicorn[standard]==0.24.0"
venv\Scripts\python.exe -m pip install gunicorn==21.2.0
venv\Scripts\python.exe -m pip install sqlalchemy==2.0.23
venv\Scripts\python.exe -m pip install asyncpg==0.29.0
venv\Scripts\python.exe -m pip install alembic==1.12.1
venv\Scripts\python.exe -m pip install psycopg2-binary==2.9.9
venv\Scripts\python.exe -m pip install "python-jose[cryptography]==3.3.0"
venv\Scripts\python.exe -m pip install "passlib[bcrypt]==1.7.4"
venv\Scripts\python.exe -m pip install python-multipart==0.0.6

echo.
echo [4/6] Устанавливаю pandas (бинарный пакет, без компиляции)...
venv\Scripts\python.exe -m pip install pandas --only-binary :all:
if errorlevel 1 (
    echo ⚠️  Не удалось установить бинарный pandas, пробую обычную установку...
    venv\Scripts\python.exe -m pip install pandas==2.1.3 --no-build-isolation
)

echo.
echo [5/6] Устанавливаю остальные зависимости...
venv\Scripts\python.exe -m pip install openpyxl==3.1.2
venv\Scripts\python.exe -m pip install xlsxwriter==3.1.9
venv\Scripts\python.exe -m pip install numpy==1.26.2
venv\Scripts\python.exe -m pip install python-dateutil==2.8.2
venv\Scripts\python.exe -m pip install httpx==0.25.1
venv\Scripts\python.exe -m pip install clickhouse-driver==0.2.6
venv\Scripts\python.exe -m pip install google-api-python-client==2.108.0
venv\Scripts\python.exe -m pip install google-auth-httplib2==0.1.1
venv\Scripts\python.exe -m pip install google-auth-oauthlib==1.1.0
venv\Scripts\python.exe -m pip install python-cors==1.0.0
venv\Scripts\python.exe -m pip install pydantic==2.5.0
venv\Scripts\python.exe -m pip install pydantic-settings==2.1.0
venv\Scripts\python.exe -m pip install redis==5.0.1
venv\Scripts\python.exe -m pip install aioredis==2.0.1
venv\Scripts\python.exe -m pip install slowapi==0.1.9
venv\Scripts\python.exe -m pip install loguru==0.7.2
venv\Scripts\python.exe -m pip install yookassa==3.0.0
venv\Scripts\python.exe -m pip install stripe==7.0.0
venv\Scripts\python.exe -m pip install pytest==7.4.3
venv\Scripts\python.exe -m pip install pytest-asyncio==0.21.1
venv\Scripts\python.exe -m pip install pyotp==2.9.0
venv\Scripts\python.exe -m pip install "qrcode[pil]==7.4.2"
venv\Scripts\python.exe -m pip install Pillow==10.1.0

echo.
echo [6/6] Устанавливаю OCR библиотеки...
venv\Scripts\python.exe -m pip install opencv-python==4.8.1.78
echo.
echo ⚠️  easyocr установка может занять много времени...
echo    Можно пропустить и установить позже
set /p install_easyocr="Установить easyocr сейчас? (y/n): "
if /i "%install_easyocr%"=="y" (
    echo Устанавливаю easyocr (это может занять 30-60 минут)...
    venv\Scripts\python.exe -m pip install easyocr==1.7.0
) else (
    echo easyocr пропущен, можно установить позже
)

echo.
echo ════════════════════════════════════════
echo ✅ УСТАНОВКА ЗАВЕРШЕНА!
echo ════════════════════════════════════════
echo.
echo Проверяю установку...
venv\Scripts\python.exe -c "import fastapi; print('✅ fastapi OK')" 2>nul || echo ❌ fastapi не установлен
venv\Scripts\python.exe -c "import uvicorn; print('✅ uvicorn OK')" 2>nul || echo ❌ uvicorn не установлен
venv\Scripts\python.exe -c "import pandas; print('✅ pandas OK')" 2>nul || echo ❌ pandas не установлен
venv\Scripts\python.exe -c "import cv2; print('✅ opencv-python OK')" 2>nul || echo ❌ opencv-python не установлен
venv\Scripts\python.exe -c "import easyocr; print('✅ easyocr OK')" 2>nul || echo ⚠️  easyocr не установлен (не критично)
echo.
pause



