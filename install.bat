@echo off
chcp 65001 >nul
echo ======================================
echo  Installing dependencies for SaaS Dashboard
echo ======================================
echo.

echo [1/3] Checking Python version...
python --version
echo.

echo [2/3] Upgrading pip...
python -m pip install --upgrade pip
echo.

echo [3/3] Installing all packages...
python -m pip install fastapi uvicorn python-multipart sqlalchemy alembic python-jose[cryptography] PyJWT passlib[bcrypt] email-validator pandas openpyxl xlsxwriter numpy python-dateutil chardet scipy matplotlib seaborn httpx pydantic pydantic-settings slowapi loguru reportlab Pillow pytest pytest-asyncio pyotp qrcode
echo.

echo ======================================
echo  DONE! Now run the server:
echo  python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo ======================================
pause
