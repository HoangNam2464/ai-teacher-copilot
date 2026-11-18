# ==============================================================================
# AI Teacher Copilot — BE-034 pgvector Query Plan & HNSW Performance Verification
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Running BE-034 pgvector Query Plan & HNSW Performance Verification..." -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$ScriptPath = Join-Path $PSScriptRoot "..\devops\benchmark_hnsw_query_plan.py"
python $ScriptPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] BE-034 Benchmark script failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

$AiServicePath = Join-Path $PSScriptRoot "..\..\ai-service"
Push-Location $AiServicePath
try {
    Write-Host "`nRunning Retrieval & Evaluation Regression Suite (pytest)..." -ForegroundColor Yellow
    pytest tests/test_retrieval_service.py tests/test_evaluation_logger.py -v --tb=short
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERROR] Pytest execution failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}
finally {
    Pop-Location
}

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] All 4 Acceptance Criteria for [BE-034] are 100% SATISFIED:" -ForegroundColor Green
Write-Host " - [x] Query plan analyzed (EXPLAIN ANALYZE comparison)" -ForegroundColor Green
Write-Host " - [x] HNSW index properly configured (m=16, ef_construction=64, ef_search=100)" -ForegroundColor Green
Write-Host " - [x] Retrieval latency improved (< 200ms target)" -ForegroundColor Green
Write-Host " - [x] Retrieval accuracy preserved without significant deviation" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
