@echo off
chcp 65001 >nul
echo ========================================
echo   ОТКРЫТИЕ БРАУЗЕРОВ EDGE
echo ========================================
echo.

echo Пробую открыть браузеры Edge...
echo.

REM Способ 1: Стандартная команда
echo [1] Пробую: start msedge
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
start msedge http://localhost:8000/docs
timeout /t 1 /nobreak >nul

REM Проверка открылся ли браузер
tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Браузер открыт способом 1!
    goto success
)

REM Способ 2: Полный путь x86
echo [2] Пробую: полный путь (x86)
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:3000
timeout /t 1 /nobreak >nul
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:8000/docs
timeout /t 1 /nobreak >nul

tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Браузер открыт способом 2!
    goto success
)

REM Способ 3: Полный путь обычный
echo [3] Пробую: полный путь (обычный)
start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" http://localhost:3000
timeout /t 1 /nobreak >nul
start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" http://localhost:8000/docs
timeout /t 1 /nobreak >nul

tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Браузер открыт способом 3!
    goto success
)

REM Способ 4: PowerShell
echo [4] Пробую: PowerShell
powershell -Command "Start-Process msedge http://localhost:3000"
timeout /t 1 /nobreak >nul
powershell -Command "Start-Process msedge http://localhost:8000/docs"
timeout /t 1 /nobreak >nul

tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Браузер открыт способом 4!
    goto success
)

REM Способ 5: Через rundll32
echo [5] Пробую: rundll32
rundll32 url.dll,FileProtocolHandler http://localhost:3000
timeout /t 1 /nobreak >nul
rundll32 url.dll,FileProtocolHandler http://localhost:8000/docs

tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Браузер открыт способом 5!
    goto success
)

REM Если ничего не сработало
echo.
echo ⚠️  Не удалось открыть браузер автоматически!
echo.
echo ОТКРОЙТЕ ВРУЧНУЮ:
echo 1. Откройте Edge браузер
echo 2. Перейдите на: http://localhost:3000
echo 3. И на: http://localhost:8000/docs
echo.
pause
exit /b 1

:success
echo.
echo ✅ Браузеры Edge открыты!
echo.
echo Фронтенд: http://localhost:3000
echo Бэкенд: http://localhost:8000/docs
echo.
pause







