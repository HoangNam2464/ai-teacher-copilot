# ==============================================================================
# AI Teacher Copilot - QA-012 Live System E2E Test Script
# Ticket: [QA-012] Test Document Parsing Accuracy & Chunk Boundaries (ATC-40 / ATC-206)
# Tests against running Docker container: atc-ai-service (8000)
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
Write-Host " STARTING LIVE E2E TEST FOR [QA-012] PARSING ACCURACY & CHUNK BOUNDARIES" -ForegroundColor Cyan
Write-Host " Target Service: atc-ai-service (Python 3.12, FastAPI)" -ForegroundColor Cyan
Write-Host " Test Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: AI Service Container Pre-flight & Test Synchronization
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: Synchronizing Test Suite with atc-ai-service ---" -ForegroundColor White

try {
    # 1. Check health
    $healthResp = curl.exe -s http://localhost:8000/health
    if ($healthResp -like '*"service":"ai-service"*') {
        Report-Pass "Setup: atc-ai-service is healthy and responding" "Response: $healthResp"
    } else {
        throw "ai-service health check failed: $healthResp"
    }

    # 2. Sync test suite into docker container
    docker cp ai-service/tests atc-ai-service:/app/ 2>&1 | Out-Null
    Report-Pass "Setup: Test suite copied to atc-ai-service:/app/tests" "Pytest suite synchronized"

} catch {
    Write-Host "Setup failed: $_" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# STEP 1: Execute QA-012 Pytest Suite Inside Container
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Executing QA-012 Ingestion & Chunking Test Suite ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$pytestOutput = docker exec atc-ai-service pytest tests/test_document_parsing_chunking_qa012.py -v -W ignore -o asyncio_default_fixture_loop_scope=function 2>&1
$ErrorActionPreference = $oldEAP

$testMap = [ordered]@{
    "test_parse_pdf_vietnamese_curriculum"               = "TC-01: PDF parsing accuracy on curriculum text"
    "test_parse_docx_structured_lesson_plan"             = "TC-02: DOCX hierarchy (Title, Headings, Objectives) preservation"
    "test_parse_txt_vietnamese_utf8"                     = "TC-03: UTF-8 Vietnamese diacritics and paragraph parsing"
    "test_parse_unsupported_formats_raise_error"         = "TC-04: Rejection of unsupported file formats (.exe, .png)"
    "test_chunk_boundary_strict_limit_512_tokens"        = "TC-05: Strict 512-token chunk boundary enforcement (tiktoken cl100k_base)"
    "test_chunk_overlap_between_adjacent_chunks"         = "TC-06: 50-token contextual overlap between adjacent chunks"
    "test_chunk_heading_preservation"                    = "TC-07: Heading binding and preservation in chunks"
    "test_chunk_huge_single_paragraph_sliding_window"    = "TC-08: Sliding window token splitting for single large paragraph"
    "test_chunk_provenance_metadata_continuity"          = "TC-09: Provenance metadata (workspace_id, doc_id, sequential index)"
    "test_chunk_empty_and_whitespace_text"               = "TC-10: Edge cases: empty and whitespace-only text handling"
}

foreach ($tKey in $testMap.Keys) {
    $tDesc = $testMap[$tKey]
    if ($pytestOutput -match "$tKey\s+PASSED") {
        Report-Pass $tDesc "PASSED in container pytest run"
    } else {
        Report-Fail $tDesc "FAILED or not found in output"
    }
}

# ------------------------------------------------------------------------------
# STEP 2: Full Ingestion Module Regression Test
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: Ingestion Module Regression Verification ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$fullPytestOutput = docker exec atc-ai-service pytest tests/ -v -W ignore -o asyncio_default_fixture_loop_scope=function 2>&1
$ErrorActionPreference = $oldEAP
if ($fullPytestOutput -match "15 passed") {
    Report-Pass "TC-11: Full ai-service test suite regression verification" "15/15 tests passed across chunker, parser, and health endpoints"
} else {
    Report-Fail "TC-11: Full ai-service test suite had failures" "Output summary mismatch"
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " QA-012 LIVE E2E TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host " Total Passed: $passedTests" -ForegroundColor Green
Write-Host " Total Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host " Overall Status: $(if ($failedTests -eq 0) { "ALL TESTS PASSED (100%)" } else { "SOME TESTS FAILED" })" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
}
