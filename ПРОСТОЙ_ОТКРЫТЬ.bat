@echo off
chcp 65001 >nul
echo Открываю браузеры Edge...
start msedge http://localhost:3000
timeout /t 1 /nobreak >nul
start msedge http://localhost:8000/docs
echo ✅ Браузеры открыты!
