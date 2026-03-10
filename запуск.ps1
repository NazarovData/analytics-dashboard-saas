# Запуск серверов с автоматическим открытием браузера
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   АВТОЗАПУСК ЧЕРЕЗ POWERSHELL           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Переход в директорию скрипта
Set-Location $PSScriptRoot

# Проверка Python
Write-Host "[1/6] Проверяю Python..." -ForegroundColor Yellow
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python не найден!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✅ Python найден" -ForegroundColor Green

# Проверка Node.js
Write-Host "[2/6] Проверяю Node.js..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js не найден!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✅ Node.js найден" -ForegroundColor Green

# Создание venv
Write-Host "[3/6] Проверяю виртуальное окружение..." -ForegroundColor Yellow
if (!(Test-Path "venv\Scripts\python.exe")) {
    Write-Host "Создаю venv..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\activate.ps1"
    pip install -q uvicorn fastapi
    if (Test-Path "requirements.txt") {
        pip install -q -r requirements.txt
    }
}
Write-Host "✅ Venv готов" -ForegroundColor Green

# Установка зависимостей Node.js
Write-Host "[4/6] Проверяю зависимости Node.js..." -ForegroundColor Yellow
if (!(Test-Path "frontend\node_modules")) {
    Write-Host "Устанавливаю npm зависимости (это займет время)..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}
Write-Host "✅ Зависимости Node.js готовы" -ForegroundColor Green

# Запуск бэкенда
Write-Host "[5/6] Запускаю бэкенд..." -ForegroundColor Yellow
$backendCmd = "cd '$PSScriptRoot'; & venv\Scripts\activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

Write-Host "Жду 25 секунд..." -ForegroundColor Cyan
Start-Sleep -Seconds 25

# Запуск фронтенда
Write-Host "[6/6] Запускаю фронтенд..." -ForegroundColor Yellow
$frontendCmd = "cd '$PSScriptRoot\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

Write-Host "Жду 35 секунд пока серверы запустятся..." -ForegroundColor Cyan
Start-Sleep -Seconds 35

# Проверка готовности серверов
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ПРОВЕРКА ГОТОВНОСТИ СЕРВЕРОВ          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Проверка бэкенда
Write-Host "Проверяю бэкенд..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ Backend готов! (попытка $i)" -ForegroundColor Green
        $backendReady = $true
        break
    } catch {
        Write-Host "⏳ Backend еще не готов... (попытка $i/30)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (!$backendReady) {
    Write-Host "⚠️  Backend не отвечает!" -ForegroundColor Red
}

# Проверка фронтенда
Write-Host "Проверяю фронтенд..." -ForegroundColor Yellow
$frontendReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ Frontend готов! (попытка $i)" -ForegroundColor Green
        $frontendReady = $true
        break
    } catch {
        Write-Host "⏳ Frontend еще не готов... (попытка $i/30)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (!$frontendReady) {
    Write-Host "⚠️  Frontend не отвечает!" -ForegroundColor Red
}

# Открытие браузеров
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ОТКРЫТИЕ БРАУЗЕРОВ                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($backendReady -and $frontendReady) {
    Write-Host "✅ Оба сервера готовы! Открываю браузеры Edge..." -ForegroundColor Green
    Start-Process msedge "http://localhost:3000"
    Start-Sleep -Seconds 2
    Start-Process msedge "http://localhost:8000/docs"
    
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║           ✅ ГОТОВО!                    ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Фронтенд: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔧 Бэкенд:   http://localhost:8000/docs" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Серверы не готовы!" -ForegroundColor Red
    Write-Host "Проверьте окна PowerShell с серверами на наличие ошибок" -ForegroundColor Yellow
}

Write-Host ""
pause







