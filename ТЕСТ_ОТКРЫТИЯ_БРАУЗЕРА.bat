@echo off
chcp 65001 >nul
echo ========================================
echo   ТЕСТ ОТКРЫТИЯ БРАУЗЕРА EDGE
echo ========================================
echo.

echo Тестирую разные способы открытия Edge...
echo.

echo [1/4] Способ 1: start msedge
start msedge http://localhost:3000
timeout /t 2 /nobreak >nul
tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Способ 1 работает!
) else (
    echo ❌ Способ 1 не сработал
)

echo.
echo [2/4] Способ 2: Полный путь (x86)
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://localhost:8000/docs
timeout /t 2 /nobreak >nul
tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Способ 2 работает!
) else (
    echo ❌ Способ 2 не сработал
)

echo.
echo [3/4] Способ 3: Полный путь (обычный)
start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" http://localhost:3000
timeout /t 2 /nobreak >nul
tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Способ 3 работает!
) else (
    echo ❌ Способ 3 не сработал
)

echo.
echo [4/4] Способ 4: PowerShell
powershell -Command "Start-Process msedge http://localhost:8000/docs"
timeout /t 2 /nobreak >nul
tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Способ 4 работает!
) else (
    echo ❌ Способ 4 не сработал
)

echo.
echo ========================================
echo   РЕЗУЛЬТАТ ТЕСТА
echo ========================================
echo.
tasklist | findstr /I "msedge.exe" >nul
if %errorlevel%==0 (
    echo ✅ Edge браузер открыт!
    echo Используйте рабочий способ в ваших скриптах.
) else (
    echo ❌ Edge браузер не открылся ни одним способом!
    echo.
    echo Проверьте:
    echo 1. Установлен ли Edge браузер?
    echo 2. Откройте Edge вручную и проверьте что он работает
    echo 3. Попробуйте открыть вручную: http://localhost:3000
)
echo.
pause







