@echo off
chcp 65001 >nul
echo Запускаю через PowerShell...
powershell -ExecutionPolicy Bypass -File "%~dp0запуск.ps1"

