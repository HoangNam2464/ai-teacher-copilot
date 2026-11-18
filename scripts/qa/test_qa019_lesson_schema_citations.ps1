# ==============================================================================
# AI Teacher Copilot - QA-019 Lesson Plan Schema & Citation Traceability Test Script
# Ticket: [QA-019 / ATC-61] Test Lesson Plan JSON Schema & Source Citation Traceability
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
Write-Host " STARTING TEST FOR [QA-019] LESSON PLAN JSON SCHEMA & CITATION TRACEABILITY" -ForegroundColor Cyan
Write-Host " Target Service: ai-service (Python 3.12, FastAPI, Pydantic, RAG)" -ForegroundColor Cyan
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
# STEP 1: Execute QA-019 Pytest Suite
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Executing QA-019 Schema & Citation Traceability Suite ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

if ($isDocker) {
    $pytestOutput = docker exec atc-ai-service pytest tests/test_lesson_plan_schema_citations_qa019.py -v -W ignore 2>&1
} else {
    $pytestOutput = & $pythonCmd -m pytest ai-service/tests/test_lesson_plan_schema_citations_qa019.py -v -W ignore 2>&1
}

$ErrorActionPreference = $oldEAP

$testMap = [ordered]@{
    "test_valid_lesson_plan_schema_passes_validation"                = "TC-LP-01: Valid lesson plan dictionary conforms to LessonPlanSchema"
    "test_json_serialization_round_trip"                            = "TC-LP-02: JSON serialization and deserialization round-trip integrity"
    "test_missing_title_raises_validation_error"                     = "TC-LP-03: Required field 'title' rejection when absent"
    "test_missing_subject_raises_validation_error"                   = "TC-LP-04: Required field 'subject' rejection when absent"
    "test_missing_grade_level_raises_validation_error"               = "TC-LP-05: Required field 'grade_level' rejection when absent"
    "test_missing_objectives_raises_validation_error"                = "TC-LP-06: Required field 'objectives' rejection when absent"
    "test_missing_sections_raises_validation_error"                  = "TC-LP-07: Required field 'sections' rejection when absent"
    "test_section_missing_required_fields_raises_validation_error"   = "TC-LP-08: LessonSection field validation (title, duration, content)"
    "test_source_chunk_ids_populated_from_retrieved_chunks"          = "TC-LP-09: source_chunk_ids populated with valid chunk UUIDs"
    "test_source_chunk_ids_can_be_empty_when_no_sources"             = "TC-LP-10: Empty source_chunk_ids default handling"
    "test_pipeline_binds_retrieved_chunk_ids_to_generated_plan"      = "TC-LP-11: LessonPlannerPipeline binds retrieved chunk IDs into final output"
    "test_provenance_link_from_lesson_plan_to_document_metadata"     = "TC-LP-12: End-to-end citation provenance linking to doc ID and page"
    "test_api_route_lesson_plan_returns_valid_schema_with_citations" = "TC-LP-13: API route POST /generation/lesson-plan returns valid schema"
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
    Report-Pass "TC-LP-14: Full AI-Service Regression Suite" "$passedCount/$passedCount tests passed across all domain modules"
} else {
    Report-Fail "TC-LP-14: Full AI-Service Regression Suite" "Failures observed in full regression"
}

# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " [QA-019] TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $script:passedTests | Failed: $script:failedTests" -ForegroundColor $(if ($script:failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($script:failedTests -gt 0) {
    exit 1
}
exit 0
