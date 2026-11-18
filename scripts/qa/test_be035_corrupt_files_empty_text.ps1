# ==============================================================================
# AI Teacher Copilot — BE-035 Corrupt Files & Empty Text Handling Verification
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Running BE-035 Corrupt Files & Empty Text Exception Handling Suite..." -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$BackendPath = Join-Path $PSScriptRoot "..\..\backend"
$AiServicePath = Join-Path $PSScriptRoot "..\..\ai-service"

# 1. Spring Boot Integration Tests (Exception Handlers & Validation)
Push-Location $BackendPath
try {
    Write-Host "`n[1/2] Running Spring Boot Document Exception Handler Tests (Maven)..." -ForegroundColor Yellow
    ./mvnw test "-Dtest=DocumentExceptionHandlerIntegrationTest,DocumentUploadIntegrationTest"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERROR] Spring Boot document exception handler tests failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}
finally {
    Pop-Location
}

# 2. FastAPI AI Service Ingestion & Parsing Exception Tests
Push-Location $AiServicePath
try {
    Write-Host "`n[2/2] Running FastAPI Corrupt File & Empty Text Parsing Suite (Pytest)..." -ForegroundColor Yellow
    venv\Scripts\python -m pytest tests/test_corrupt_files_empty_text.py tests/test_parser.py -v --tb=short
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERROR] FastAPI corrupt files & empty text tests failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}
finally {
    Pop-Location
}

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] All 4 Acceptance Criteria for [BE-035] are 100% SATISFIED:" -ForegroundColor Green
Write-Host " - [x] Corrupt file duoc phat hien (PDF header, DOCX zip, encrypted, binary text)" -ForegroundColor Green
Write-Host " - [x] Empty text duoc xu ly (Scanned PDF without OCR, empty blank pages, 0 bytes)" -ForegroundColor Green
Write-Host " - [x] API tra loi ro rang (Structured JSON error messages in Vietnamese/English)" -ForegroundColor Green
Write-Host " - [x] Khong lam crash ingestion service (Resilient background task, DB FAILED update)" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
