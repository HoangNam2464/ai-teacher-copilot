# ==============================================================================
# AI Teacher Copilot - QA-016 AI Provider Dynamic Switching & Error Fallback Test Script
# Ticket: [QA-016 / ATC-51] Test AI Provider Dynamic Switching and API Error Fallback
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
Write-Host " STARTING TEST FOR [QA-016] AI PROVIDER SWITCHING & API ERROR FALLBACK" -ForegroundColor Cyan
Write-Host " Target Service: ai-service (Python 3.12, FastAPI, Gemini/OpenAI/Mock Adapters)" -ForegroundColor Cyan
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
# STEP 1: Execute QA-016 Provider Switching & Fallback Suite
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Executing QA-016 Provider Switching & Fallback Suite ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

if ($isDocker) {
    $pytestOutput = docker exec atc-ai-service pytest tests/test_provider_switching_fallback_qa016.py -v -W ignore 2>&1
} else {
    $pytestOutput = & $pythonCmd -m pytest ai-service/tests/test_provider_switching_fallback_qa016.py -v -W ignore 2>&1
}

$ErrorActionPreference = $oldEAP

$testMap = [ordered]@{
    "test_switch_provider_via_configuration_setting"            = "TC-PROV-01: Config-driven dynamic switching across gemini, openai, mock"
    "test_switch_provider_case_insensitivity_and_whitespace"    = "TC-PROV-02: Provider name case-insensitivity and whitespace sanitization"
    "test_unsupported_provider_raises_informative_error"        = "TC-PROV-03: Unsupported provider name raises informative UnsupportedProviderError"
    "test_dynamic_custom_provider_registration_and_switching"   = "TC-PROV-04: Runtime dynamic provider registration and decoupled switching"
    "test_provider_instance_caching_and_cache_clearing"         = "TC-PROV-05: Factory instance caching and explicit cache clearing behavior"
    "test_gemini_structured_generation_with_schema"             = "TC-PROV-06: Gemini structured output generation conforming to schema"
    "test_gemini_sources_boundary_enforcement"                  = "TC-PROV-07: Gemini prompt encloses sources strictly in <sources> boundary"
    "test_gemini_embedding_generation_success"                  = "TC-PROV-08: Gemini produces dense vector embeddings (768 dimensions)"
    "test_gemini_missing_api_key_raises_auth_error"             = "TC-PROV-09: Gemini pre-flight validation raises AuthenticationError when key missing"
    "test_openai_structured_generation_with_schema"             = "TC-PROV-10: OpenAI structured output generation via chat completions parse"
    "test_openai_sources_boundary_enforcement"                  = "TC-PROV-11: OpenAI prompt encloses sources strictly in <sources> boundary"
    "test_openai_embedding_generation_success"                  = "TC-PROV-12: OpenAI produces dense vector embeddings"
    "test_openai_missing_api_key_raises_auth_error"             = "TC-PROV-13: OpenAI pre-flight validation raises AuthenticationError when key missing"
    "test_gemini_sdk_exceptions_mapped_to_unified_errors"       = "TC-PROV-14: Gemini SDK exceptions mapped to RateLimitError and ServiceUnavailableError"
    "test_openai_sdk_exceptions_mapped_to_unified_errors"       = "TC-PROV-15: OpenAI SDK exceptions mapped to RateLimitError and ServiceUnavailableError"
    "test_api_route_generation_returns_502_on_provider_error"   = "TC-PROV-16: POST /generation/lesson-plan returns HTTP 502 Bad Gateway on provider failure"
    "test_api_route_quiz_returns_502_on_provider_error"          = "TC-PROV-17: POST /generation/quiz returns HTTP 502 Bad Gateway on provider failure"
    "test_transparent_provider_fallback_execution"              = "TC-PROV-18: FallbackAIProvider routes to secondary provider when primary fails"
    "test_dual_failure_in_fallback_raises_chained_error"        = "TC-PROV-19: Dual provider failure raises chained AIProviderError cleanly"
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
    Report-Pass "TC-PROV-20: Full AI-Service Regression Suite" "$passedCount/$passedCount tests passed across all domain modules"
} else {
    Report-Fail "TC-PROV-20: Full AI-Service Regression Suite" "Full regression suite did not pass cleanly: $fullTestText"
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " [QA-016] TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $passedTests | Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
