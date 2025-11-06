# =====================================================================
# ILAS Development Launcher Script
# Starts Redis (no persistence), Celery, and Django automatically
# =====================================================================

Write-Host "Starting ILAS Development Environment..." -ForegroundColor Green

# 1️⃣ Start Redis in no-persistence mode
$redisPath = "D:\Redis\redis-server.exe"
if (Test-Path $redisPath) {
    Write-Host "Starting Redis (no persistence mode)..." -ForegroundColor Cyan
    Start-Process -NoNewWindow -FilePath $redisPath -ArgumentList "--save", '""', "--appendonly", "no"
    Start-Sleep -Seconds 3
}
else {
    Write-Host "Redis not found at $redisPath" -ForegroundColor Red
    exit 1
}

# 2️⃣ Start Celery Worker
$celeryCmd = "python -m celery -A ilas_backend worker -l info"
Write-Host "Starting Celery worker..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $celeryCmd
Start-Sleep -Seconds 3

# 3️⃣ Start Django Development Server
Write-Host "Starting Django development server on http://127.0.0.1:8000 ..." -ForegroundColor Green
python manage.py runserver

# =====================================================================
# Note:
# - Redis runs in no-persistence mode to avoid MISCONF errors.
# - Celery runs asynchronously; tasks auto-load from ilas_backend.celery.
# - Django runs in the same window for convenience.
# =====================================================================

Write-Host "ILAS Development Environment is up and running!" -ForegroundColor Green
