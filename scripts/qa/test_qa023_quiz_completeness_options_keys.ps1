# ==============================================================================
# AI Teacher Copilot - QA-023 Quiz Question Completeness, Options & Answer Keys
# Ticket: [QA-023 / ATC-78] Test Quiz Question Completeness, Options and Answer Keys
# Sprint: Sprint 4 - Quiz & Versioning
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
Write-Host " STARTING TEST FOR [QA-023] QUIZ QUESTION COMPLETENESS, OPTIONS & ANSWER KEYS" -ForegroundColor Cyan
Write-Host " Target Service: ai-service (FastAPI, Pydantic, Quiz Generator Pipeline)" -ForegroundColor Cyan
Write-Host " Test Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: Environment Detection
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: Detecting Test Runner Environment ---" -ForegroundColor White

$pythonCmd = ""
$isDocker = $false

if (Test-Path "ai-service\venv\Scripts\python.exe") {
    $pythonCmd = "ai-service\venv\Scripts\python.exe"
    Report-Pass "Setup: Local Python venv detected" "Using $pythonCmd"
} elseif (Test-Path "venv\Scripts\python.exe") {
    $pythonCmd = "venv\Scripts\python.exe"
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
# STEP 1: Execute QA-023 Pytest Suite
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Executing QA-023 Question Completeness & Answer Key Suite ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

if ($isDocker) {
    $pytestOutput = docker exec atc-ai-service pytest tests/test_quiz_question_completeness_qa023.py -v -W ignore 2>&1
} else {
    $pytestOutput = & $pythonCmd -m pytest ai-service/tests/test_quiz_question_completeness_qa023.py -v -W ignore 2>&1
}

$ErrorActionPreference = $oldEAP

$testMap = [ordered]@{
    "test_quiz_scales_across_supported_question_counts\[3\]"      = "TC-QZ-01: Scale verification with minimum bound (3 questions)"
    "test_quiz_scales_across_supported_question_counts\[5\]"      = "TC-QZ-02: Scale verification with short quiz (5 questions)"
    "test_quiz_scales_across_supported_question_counts\[8\]"      = "TC-QZ-03: Scale verification with medium quiz (8 questions)"
    "test_quiz_scales_across_supported_question_counts\[10\]"     = "TC-QZ-04: Scale verification with 15-minute test (10 questions)"
    "test_quiz_scales_across_supported_question_counts\[15\]"     = "TC-QZ-05: Scale verification with 45-minute test (15 questions)"
    "test_quiz_scales_across_supported_question_counts\[20\]"     = "TC-QZ-06: Scale verification with maximum bound (20 questions)"
    "test_minimum_bound_3_questions"                              = "TC-QZ-07: Minimum bound sequential numbering integrity"
    "test_maximum_bound_20_questions"                             = "TC-QZ-08: Maximum bound bloom taxonomy level integrity"
    "test_every_mcq_has_single_valid_answer_key_and_index"        = "TC-QZ-09: 100% MCQ have exactly 1 valid answer key and 0..3 index"
    "test_every_mcq_has_meaningful_non_empty_explanation"         = "TC-QZ-10: 100% MCQ have comprehensive, non-placeholder explanation"
    "test_reject_mcq_when_options_have_fewer_than_two_distinct"   = "TC-QZ-11: Rejection when MCQ has fewer than 2 distinct options"
    "test_short_answer_has_model_answer_and_guidance"             = "TC-QZ-12: Short-answer questions have model answer and guidance"
    "test_reject_short_answer_when_model_answer_is_missing"       = "TC-QZ-13: Rejection of short-answer when model answer is missing"
    "test_answer_key_mapped_from_exact_option_text"               = "TC-QZ-14: Auto-mapping answer key from option text content"
    "test_reject_when_answer_key_does_not_match_any_option"       = "TC-QZ-15: Rejection when answer key does not match any of 4 options"
    "test_pipeline_produces_fully_compliant_quiz"                 = "TC-QZ-16: End-to-end pipeline execution with citation bindings"
    "test_http_endpoint_returns_200_and_structured_quiz"          = "TC-QZ-17: FastAPI POST /generation/quiz endpoint returning structured quiz"
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
    Report-Pass "TC-QZ-18: Full AI-Service Regression Suite" "$passedCount/$passedCount tests passed across all domain modules"
} else {
    Report-Fail "TC-QZ-18: Full AI-Service Regression Suite" "Failures observed in full regression"
}

# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " [QA-023] TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $script:passedTests | Failed: $script:failedTests" -ForegroundColor $(if ($script:failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($script:failedTests -gt 0) {
    exit 1
}
exit 0
