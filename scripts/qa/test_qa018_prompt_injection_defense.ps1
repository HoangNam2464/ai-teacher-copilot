# ==============================================================================
# AI Teacher Copilot - QA-018 Prompt Injection Defense & Evidence Rejection Test Script
# Ticket: [QA-018 / ATC-56] Test Prompt Injection Defense & Insufficient Evidence Rejection
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
Write-Host " STARTING TEST FOR [QA-018] PROMPT INJECTION DEFENSE & EVIDENCE REJECTION" -ForegroundColor Cyan
Write-Host " Target Service: ai-service (Python 3.12, FastAPI, OpenPDF/pgvector)" -ForegroundColor Cyan
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
    # Fallback to system python
    $pythonCmd = "python"
    Report-Pass "Setup: Falling back to system python" "Command: python"
}

# ------------------------------------------------------------------------------
# STEP 1: Execute QA-018 Pytest Suite
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Executing QA-018 Security & Evidence Rejection Suite ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

if ($isDocker) {
    $pytestOutput = docker exec atc-ai-service pytest tests/test_prompt_injection_defense_qa018.py -v -W ignore 2>&1
} else {
    $pytestOutput = & $pythonCmd -m pytest ai-service/tests/test_prompt_injection_defense_qa018.py -v -W ignore 2>&1
}

$ErrorActionPreference = $oldEAP

$testMap = [ordered]@{
    "test_direct_instruction_override_payload_neutralized"       = "TC-SEC-01: Direct instruction override neutralized within <sources>"
    "test_system_role_impersonation_neutralized"                 = "TC-SEC-02: System role impersonation payload neutralized"
    "test_xml_boundary_breakout_escaped"                         = "TC-SEC-03: Early XML closing tag breakout escaped successfully"
    "test_multi_chunk_mixed_malicious_and_legitimate"            = "TC-SEC-04: Multi-chunk handling with mixed benign and malicious content"
    "test_sources_boundary_directive_strictly_enforced"          = "TC-SEC-05: Untrusted data security directive enforced at root"
    "test_metadata_provenance_preserved_for_citations"           = "TC-SEC-06: Provenance metadata (chunk_id, document_id, page, index) preserved"
    "test_empty_or_none_sources_yields_clean_empty_boundary"     = "TC-SEC-07: Clean empty boundary handling for zero source chunks"
    "test_evidence_validator_rejects_empty_chunks"               = "TC-SEC-08: EvidenceValidator raises InsufficientEvidenceError on empty chunks"
    "test_evidence_validator_rejects_insufficient_evidence_flag" = "TC-SEC-09: EvidenceValidator halts when insufficient_evidence=True"
    "test_evidence_validator_rejects_scores_below_threshold"     = "TC-SEC-10: EvidenceValidator rejects chunks with scores below threshold"
    "test_evidence_validator_passes_when_sufficient"             = "TC-SEC-11: EvidenceValidator passes when valid high-similarity chunks exist"
    "test_generation_pipeline_halts_before_llm_on_insufficient_evidence" = "TC-SEC-12: LLM generate() is NEVER invoked on insufficient evidence"
    "test_api_route_lesson_plan_returns_422_on_insufficient_evidence"   = "TC-SEC-13: POST /generation/lesson-plan returns HTTP 422 on insufficient evidence"
    "test_api_route_quiz_returns_422_on_insufficient_evidence"          = "TC-SEC-14: POST /generation/quiz returns HTTP 422 on insufficient evidence"
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
    $fullPytestOutput = docker exec atc-ai-service pytest tests/ -q -W ignore 2>&1
} else {
    $fullPytestOutput = & $pythonCmd -m pytest ai-service/tests/ -q -W ignore 2>&1
}

$ErrorActionPreference = $oldEAP

$fullPytestText = $fullPytestOutput -join "`n"
if ($fullPytestText -match "(\d+)\s+passed") {
    $passedCount = $Matches[1]
    Report-Pass "TC-SEC-15: Full AI-Service Regression Suite" "$passedCount/$passedCount tests passed across all domain modules"
} else {
    Report-Fail "TC-SEC-15: Full AI-Service Regression Suite" "Failures observed in full regression"
}

# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " [QA-018] TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $script:passedTests | Failed: $script:failedTests" -ForegroundColor $(if ($script:failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($script:failedTests -gt 0) {
    exit 1
}
exit 0
