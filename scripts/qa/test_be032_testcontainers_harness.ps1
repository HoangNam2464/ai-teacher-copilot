# ==============================================================================
# AI Teacher Copilot — BE-032 Testcontainers Integration Harness Verification
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Running BE-032 Testcontainers Integration Harness Verification..." -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$BackendPath = Join-Path $PSScriptRoot "..\..\backend"
$AiServicePath = Join-Path $PSScriptRoot "..\..\ai-service"

# 1. Spring Boot Integration Tests via Testcontainers
Push-Location $BackendPath
try {
    Write-Host "`n[1/2] Running Spring Boot Testcontainers Integration Suite (Maven)..." -ForegroundColor Yellow
    ./mvnw test -Dtest=TestcontainersHarnessIntegrationTest
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERROR] Spring Boot Testcontainers tests failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}
finally {
    Pop-Location
}

# 2. FastAPI AI Service Integration Tests via Testcontainers
Push-Location $AiServicePath
try {
    Write-Host "`n[2/2] Running FastAPI Testcontainers Integration Suite (Pytest)..." -ForegroundColor Yellow
    venv\Scripts\python -m pytest tests/test_testcontainers_harness.py -v --tb=short
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERROR] FastAPI Testcontainers tests failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}
finally {
    Pop-Location
}

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] All 4 Acceptance Criteria for [BE-032] are 100% SATISFIED:" -ForegroundColor Green
Write-Host " - [x] Testcontainers khoi tao duoc dependency (Postgres 16 + pgvector, MinIO)" -ForegroundColor Green
Write-Host " - [x] Spring Boot integration test chay duoc (TestcontainersConfig + Dynamic properties)" -ForegroundColor Green
Write-Host " - [x] FastAPI integration test chay duoc (Async pgvector search + MinIO S3 ops)" -ForegroundColor Green
Write-Host " - [x] Database test duoc isolation giua cac test (Zero data leakage across tests)" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
