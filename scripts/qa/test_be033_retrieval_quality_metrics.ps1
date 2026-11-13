# ==============================================================================
# AI Teacher Copilot — BE-033 RAG Retrieval Quality Metrics Verification Script
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Running BE-033 Retrieval Quality Metrics & Telemetry Verification..." -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$AiServicePath = Join-Path $PSScriptRoot "..\..\ai-service"

Push-Location $AiServicePath

try {
    Write-Host "`n[1/2] Running Unit & Integration Tests (pytest)..." -ForegroundColor Yellow
    pytest tests/test_evaluation_logger.py -v --tb=short
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERROR] Pytest execution failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }

    Write-Host "`n[2/2] Running Full Retrieval Regression Suite..." -ForegroundColor Yellow
    pytest tests/test_retrieval_service.py tests/test_vector_retrieval_isolation_qa017.py -v --tb=short
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERROR] Regression suite failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }

    Write-Host "`n======================================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] All 4 Acceptance Criteria for [BE-033] are 100% SATISFIED:" -ForegroundColor Green
    Write-Host " - [x] AC-1: Retrieval metrics recorded (Cosine similarity, latency_ms, chunk counts)" -ForegroundColor Green
    Write-Host " - [x] AC-2: Query & Top-K result traceable (trace_id, source_page, chunk_id)" -ForegroundColor Green
    Write-Host " - [x] AC-3: Sensitive info & PII redacted (emails, phones, credentials masked)" -ForegroundColor Green
    Write-Host " - [x] AC-4: Aggregated benchmark metrics (P50, P90, P95, mean similarity)" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
}
finally {
    Pop-Location
}
