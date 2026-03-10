@echo off
echo ========================================
echo   BizPulse PRO - Initial Setup
echo ========================================
echo.

echo This will set up your development environment.
echo.

echo [1/4] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed!
    echo Please install Docker Desktop first.
    pause
    exit /b 1
)
echo Docker: OK ✓

echo.
echo [2/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.11+ first.
    pause
    exit /b 1
)
echo Python: OK ✓

echo.
echo [3/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18+ first.
    pause
    exit /b 1
)
echo Node.js: OK ✓

echo.
echo [4/4] Creating .env files...

if not exist ".env" (
    echo Creating backend .env...
    (
        echo DATABASE_URL=postgresql+asyncpg://bizpulse:bizpulse_password@localhost:5432/bizpulse_db
        echo DATABASE_URL_SYNC=postgresql://bizpulse:bizpulse_password@localhost:5432/bizpulse_db
        echo SECRET_KEY=dev-secret-key-change-in-production
        echo DEBUG=True
        echo ENVIRONMENT=development
    ) > .env
    echo Created .env ✓
)

if not exist "frontend\.env" (
    echo Creating frontend .env...
    echo VITE_API_URL=http://localhost:8000/api/v1 > frontend\.env
    echo Created frontend/.env ✓
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: start_all.bat
echo 2. Wait for services to start
echo 3. Open: http://localhost:3000
echo.
pause


