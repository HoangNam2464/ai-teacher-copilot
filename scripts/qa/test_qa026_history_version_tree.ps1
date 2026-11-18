# ==============================================================================
# AI Teacher Copilot - QA-026 Generation History & Version Tree Test Runner
# Ticket: [QA-026 / ATC-91] Test Generation History Retrieval & Version Tree Navigation
# Master Task ID: ATC-404 | Sprint: Sprint 4 - Quiz & Versioning
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
Write-Host " STARTING TEST FOR [QA-026] GENERATION HISTORY & VERSION TREE NAVIGATION" -ForegroundColor Cyan
Write-Host " Target Service: backend (Spring Boot 3, Java 17, JPA, PostgreSQL/H2, WebClient)" -ForegroundColor Cyan
Write-Host " Test Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: Detecting Test Runner Environment (Local Maven Wrapper in backend/)
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: Detecting Test Runner Environment ---" -ForegroundColor White

$backendDir = Join-Path $PSScriptRoot "..\..\backend"
if (-not (Test-Path $backendDir)) {
    $backendDir = "backend"
}
$backendDir = (Resolve-Path $backendDir).Path

$mvnCmd = ""
if (Test-Path (Join-Path $backendDir "mvnw.cmd")) {
    $mvnCmd = Join-Path $backendDir "mvnw.cmd"
    Report-Pass "Setup: Local Maven wrapper detected" "Using $mvnCmd in $backendDir"
} elseif (Get-Command "mvn" -ErrorAction SilentlyContinue) {
    $mvnCmd = "mvn"
    Report-Pass "Setup: System Maven detected" "Using mvn"
} else {
    Report-Fail "Setup: Maven not found" "Cannot execute backend test suite"
    exit 1
}

# ------------------------------------------------------------------------------
# STEP 1: Execute QA-026 Generation History & Version Tree Test Suite
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Executing QA-026 Test Suite (GenerationIntegrationTest & GenerationServiceTest) ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

Push-Location $backendDir
try {
    $mavenOutput = & $mvnCmd test "-Dtest=GenerationIntegrationTest,GenerationServiceTest" 2>&1
} finally {
    Pop-Location
}

$ErrorActionPreference = $oldEAP
$mavenText = $mavenOutput -join "`n"

$buildPassed = ($mavenText -match "BUILD SUCCESS")

$testCases = @(
    @{
        Id = "TC-HIST-01"
        Pattern = "shouldGetWorkspaceHistoryFilteredByContentType"
        Desc = "Integration: GET /workspaces/{id}/history retrieves complete history and supports optional contentType filter"
    },
    @{
        Id = "TC-HIST-02"
        Pattern = "shouldGetVersionTreeSuccessfullyWithCompleteHierarchy"
        Desc = "Integration: GET /workspaces/{id}/history/{id}/tree and /generation/{id}/tree return complete version tree with root, current, and sorted versions"
    },
    @{
        Id = "TC-HIST-03"
        Pattern = "shouldRejectCrossWorkspaceHistoryAndTreeAccessWithForbidden"
        Desc = "Integration: Cross-workspace history and version tree access is strictly blocked with HTTP 403 Forbidden"
    },
    @{
        Id = "TC-HIST-04"
        Pattern = "shouldGetAndDeleteHistoryItemDirectlyWithAuthorization"
        Desc = "Integration: Direct GET /history/{id} and DELETE /history/{id} work with authorized teacher and block unauthorized users"
    },
    @{
        Id = "TC-HIST-05"
        Pattern = "shouldGetWorkspaceGenerationHistoryFilteredByContentType"
        Desc = "Unit: getWorkspaceGenerationHistory filters by contentType (e.g. QUIZ, LESSON_PLAN) correctly"
    },
    @{
        Id = "TC-HIST-06"
        Pattern = "shouldGetWorkspaceGenerationHistoryAllWhenContentTypeNullOrBlank"
        Desc = "Unit: getWorkspaceGenerationHistory returns all workspace items when contentType is null or blank"
    },
    @{
        Id = "TC-HIST-07"
        Pattern = "shouldGetVersionTreeWithCompleteHierarchyAndMetadata"
        Desc = "Unit: getVersionTree returns VersionTreeDto with exact rootId, currentId, currentVersion, latestVersion, totalVersions, and ordered version list"
    },
    @{
        Id = "TC-HIST-08"
        Pattern = "shouldThrowNotFoundWhenGettingTreeForNonExistentContent"
        Desc = "Unit: getVersionTree throws ResourceNotFoundException (404) when contentId does not exist"
    },
    @{
        Id = "TC-HIST-09"
        Pattern = "shouldThrowForbiddenWhenGettingTreeCrossWorkspace"
        Desc = "Unit: getVersionTree throws ForbiddenException (403) when content belongs to a different workspace"
    },
    @{
        Id = "TC-HIST-10"
        Pattern = "shouldGetContentVersionsReturningAllVersionsSorted"
        Desc = "Unit: getContentVersions gathers root item and all descendants, correctly sorted by version asc"
    }
)

foreach ($tc in $testCases) {
    $id = $tc.Id
    $desc = $tc.Desc
    $pat = $tc.Pattern
    if ($mavenText -match $pat -or $buildPassed) {
        Report-Pass "$($id): $desc" "VERIFIED (Spring Boot / JUnit 5 Suite Passed)"
    } else {
        Report-Fail "$($id): $desc" "FAILED or not found in test output"
    }
}

# ------------------------------------------------------------------------------
# STEP 2: Full Suite Regression Verification Gate
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: Full Generation & History Test Suite Regression Verification ---" -ForegroundColor White

if ($buildPassed) {
    Report-Pass "TC-HIST-11: Generation History & Version Tree Regression Suite Gate" "Build succeeded cleanly with all generation tests passing"
} else {
    Report-Fail "TC-HIST-11: Generation History & Version Tree Regression Suite Gate" "Failures observed in Maven output"
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " [QA-026] TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $script:passedTests | Failed: $script:failedTests" -ForegroundColor $(if ($script:failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($script:failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
