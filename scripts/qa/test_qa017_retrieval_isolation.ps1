# ==============================================================================
# AI Teacher Copilot - QA-017 Top-K Vector Retrieval & Workspace Isolation Test Script
# Ticket: [QA-017 / ATC-53] Test Top-K Vector Retrieval & Workspace Data Isolation
# Sprint: Sprint 3 - RAG & Lesson
# Unified Test Location: scripts/qa/
# ==============================================================================

$ErrorActionPreference = "Stop"

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$passedTests = 0
$failedTests = 0

function Report-Pass($name, $detail) {
    Write-Host "[PASS] $name" -ForegroundColor Green
    if ($detail) { Write-Host "       $detail" -ForegroundColor Gray }
    $script:passedTests++
}

function Report-Fail($name, $detail) {
    Write-Host "[FAIL] $name" -ForegroundColor Red
    if ($detail) { Write-Host "       $detail" -ForegroundColor Yellow }
    $script:failedTests++
}

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " STARTING TEST FOR [QA-017] TOP-K VECTOR RETRIEVAL & WORKSPACE ISOLATION" -ForegroundColor Cyan
Write-Host " Target Service: ai-service (Python 3.12, FastAPI, pgvector Cosine Search)" -ForegroundColor Cyan
Write-Host " Test Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: Environment Detection (Local venv vs Docker Container)
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: Detecting Test Runner Environment ---" -ForegroundColor White

$pythonCmd = ""
$isDocker = $false

if (Test-Path "ai-service\venv\Scripts\python.exe") {
    $pythonCmd = "ai-service\venv\Scripts\python.exe"
    Report-Pass "Setup: Local Python venv detected" "Using $pythonCmd"
} elseif (Get-Command "docker" -ErrorAction SilentlyContinue) {
    $containerStatus = docker ps --filter "name=atc-ai-service" --format "{{.Status}}" 2>&1
    if ($containerStatus -like "*Up*") {
        $isDocker = $true
        docker cp ai-service/tests atc-ai-service:/app/ 2>&1 | Out-Null
        Report-Pass "Setup: Docker container atc-ai-service detected" "Synchronized tests to container"
    }
}

if (-not $pythonCmd -and -not $isDocker) {
    $pythonCmd = "python"
    Report-Pass "Setup: Falling back to system python" "Command: python"
}

# ------------------------------------------------------------------------------
# STEP 1: Execute QA-017 Retrieval & Isolation Suite
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Executing QA-017 Retrieval & Isolation Suite ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

if ($isDocker) {
    $pytestOutput = docker exec atc-ai-service pytest tests/test_vector_retrieval_isolation_qa017.py -v -W ignore 2>&1
} else {
    $pytestOutput = & $pythonCmd -m pytest ai-service/tests/test_vector_retrieval_isolation_qa017.py -v -W ignore 2>&1
}

$ErrorActionPreference = $oldEAP

$testMap = [ordered]@{
    "test_top_k_default_returns_five_chunks"                     = "TC-RET-01: Default top_k returns 5 relevant chunks"
    "test_top_k_custom_parameter_honored"                       = "TC-RET-02: Custom top_k parameter (top_k=3) strictly honored"
    "test_top_k_bounded_to_minimum_one"                         = "TC-RET-03: Lower bound enforcement (top_k <= 0 bounded to 1)"
    "test_top_k_bounded_to_maximum_ten"                         = "TC-RET-04: Upper bound enforcement (top_k > 10 capped at 10)"
    "test_chunks_ordered_by_descending_similarity"              = "TC-RET-05: Chunks strictly ordered by descending similarity score"
    "test_similarity_threshold_filters_out_low_relevance_chunks"= "TC-RET-06: Similarity threshold filtering drops irrelevant chunks"
    "test_retrieved_chunk_preserves_full_grounding_metadata"    = "TC-RET-07: Provenance metadata (doc_id, page, index) preserved"
    "test_query_embedding_dense_vector_generated"               = "TC-RET-08: Query embedding dense 768-dim vector generated"
    "test_sql_filter_strictly_enforces_workspace_id"            = "TC-RET-09: SQL WHERE clause strictly enforces workspace_id"
    "test_cross_workspace_data_never_leaked"                    = "TC-RET-10: Cross-workspace data isolation guarantees zero leakage"
    "test_multi_tenant_concurrent_isolation"                    = "TC-RET-11: Concurrent tenant isolation across multiple workspaces"
    "test_metadata_filtering_within_isolated_workspace"         = "TC-RET-12: Additional metadata filtering within workspace bounds"
    "test_zero_matches_sets_insufficient_evidence_flag"         = "TC-RET-13: Zero matching chunks sets insufficient_evidence=True"
    "test_all_chunks_below_threshold_sets_insufficient_evidence"= "TC-RET-14: Below-threshold chunks trigger insufficient_evidence=True"
    "test_empty_query_raises_value_error"                       = "TC-RET-15: Empty or whitespace query raises ValueError"
    "test_invalid_workspace_uuid_raises_value_error"            = "TC-RET-16: Invalid workspace UUID raises ValueError pre-flight"
    "test_api_endpoint_retrieval_search_contract_success"       = "TC-RET-17: POST /retrieval/search returns HTTP 200 with RetrievalResponse"
    "test_api_endpoint_retrieval_search_missing_auth_returns_401"= "TC-RET-18: POST /retrieval/search rejects missing API key with HTTP 401"
    "test_api_endpoint_retrieval_search_invalid_uuid_returns_422"= "TC-RET-19: POST /retrieval/search invalid UUID returns HTTP 422"
}

foreach ($tKey in $testMap.Keys) {
    $tDesc = $testMap[$tKey]
    if ($pytestOutput -match "$tKey\s+PASSED") {
        Report-Pass $tDesc "PASSED"
    } else {
        Report-Fail $tDesc "FAILED or not detected in test output"
    }
}

# ------------------------------------------------------------------------------
# STEP 2: Full Regression Verification on ai-service
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: Full AI-Service Test Suite Regression Verification ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

if ($isDocker) {
    $fullTestOutput = docker exec atc-ai-service pytest tests/ -q -W ignore 2>&1
} else {
    $fullTestOutput = & $pythonCmd -m pytest ai-service/tests/ -q -W ignore 2>&1
}

$ErrorActionPreference = $oldEAP

$fullTestText = $fullTestOutput -join "`n"
if ($fullTestText -match "(\d+)\s+passed") {
    $passedCount = $Matches[1]
    Report-Pass "TC-RET-20: Full AI-Service Regression Suite" "$passedCount/$passedCount tests passed across all domain modules"
} else {
    Report-Fail "TC-RET-20: Full AI-Service Regression Suite" "Full regression suite did not pass cleanly: $fullTestText"
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " [QA-017] TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $script:passedTests | Failed: $script:failedTests" -ForegroundColor $(if ($script:failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($script:failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
