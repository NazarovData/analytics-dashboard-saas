@echo off
chcp 65001 >nul
echo ========================================
echo   ОТКРЫТИЕ БРАУЗЕРОВ EDGE
echo ========================================
echo.

REM Способ 1: Стандартная команда
echo Пробую открыть через start msedge...
start msedge http://localhost:3000 >nul 2>&1
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs >nul 2>&1

REM Проверка открытия
timeout /t 1 /nobreak >nul

REM Способ 2: Через полный путь (если способ 1 не сработал)
echo Пробую через полный путь...
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:3000 >nul 2>&1
timeout /t 1 /nobreak >nul
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:8000/docs >nul 2>&1

REM Способ 3: Через PowerShell (если способы 1 и 2 не сработали)
echo Пробую через PowerShell...
powershell -Command "Start-Process msedge http://localhost:3000" >nul 2>&1
timeout /t 1 /nobreak >nul
powershell -Command "Start-Process msedge http://localhost:8000/docs" >nul 2>&1

REM Способ 4: Через rundll32
echo Пробую через rundll32...
rundll32 url.dll,FileProtocolHandler http://localhost:3000 >nul 2>&1
timeout /t 1 /nobreak >nul
rundll32 url.dll,FileProtocolHandler http://localhost:8000/docs >nul 2>&1

echo.
echo ✅ Команды открытия браузера выполнены!
echo.
echo Если браузеры не открылись автоматически:
echo 1. Откройте Edge вручную
echo 2. Перейдите на: http://localhost:3000
echo 3. И на: http://localhost:8000/docs
echo.
pause







