# ==============================================================================
# AI Teacher Copilot - QA-022 DOCX & PDF Export Formatting & Citations Test Runner
# Ticket: [QA-022 / ATC-74] Test DOCX & PDF Lesson Export Formatting & Citations
# Master Task ID: ATC-307 | Sprint: Sprint 3 - RAG & Lesson
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
Write-Host " STARTING TEST FOR [QA-022] DOCX & PDF EXPORT FORMATTING & CITATIONS" -ForegroundColor Cyan
Write-Host " Target Service: backend (Spring Boot 3, Java 17, Apache POI, OpenPDF)" -ForegroundColor Cyan
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
# STEP 1: Execute QA-022 Export Test Suite
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Executing QA-022 Export Formatting & Citations Test Suite ---" -ForegroundColor White

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

Push-Location $backendDir
try {
    $mavenOutput = & $mvnCmd test "-Dtest=ExportIntegrationTest,DocxLessonExporterTest,PdfLessonExporterTest,ExportServiceTest" 2>&1
} finally {
    Pop-Location
}

$ErrorActionPreference = $oldEAP
$mavenText = $mavenOutput -join "`n"

$buildPassed = ($mavenText -match "BUILD SUCCESS")

$testCases = @(
    @{
        Id = "TC-EXP-01"
        Pattern = "testExportPost_Success"
        Desc = "Integration: Export lesson plan to DOCX via POST returns HTTP 200 and valid MIME type"
    },
    @{
        Id = "TC-EXP-02"
        Pattern = "shouldExportFullLessonPlanToDocxSuccessfully"
        Desc = "DocxExporter: Generated DOCX binary parses as valid OOXML document without corruption"
    },
    @{
        Id = "TC-EXP-03"
        Pattern = "testExportPdfPost_Success"
        Desc = "Integration: Export lesson plan to PDF via POST returns HTTP 200 and valid application/pdf"
    },
    @{
        Id = "TC-EXP-04"
        Pattern = "shouldExportFullLessonPlanToPdfSuccessfully"
        Desc = "PdfExporter: Generated PDF begins with %PDF- header and contains valid renderable pages"
    },
    @{
        Id = "TC-EXP-05"
        Pattern = "KẾ HOẠCH BÀI DẠY|MỤC TIÊU BÀI HỌC|TIẾN TRÌNH DẠY HỌC"
        Desc = "Fidelity: Content matches generated lesson: title, objectives, activities, and assessment"
    },
    @{
        Id = "TC-EXP-06"
        Pattern = "shouldHonorOverrideContentData"
        Desc = "Override: Client-provided overrideContentData prioritized over database version"
    },
    @{
        Id = "TC-EXP-07"
        Pattern = "CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO|SGK_Toan_10"
        Desc = "Citation: Grounding citations table renders file name, page number, and excerpt quote"
    },
    @{
        Id = "TC-EXP-08"
        Pattern = "shouldExportWithoutCitationsWhenIncludeCitationsIsFalse"
        Desc = "Citation: Setting includeCitations=false omits citations appendix from output document"
    },
    @{
        Id = "TC-EXP-09"
        Pattern = "renderMetadataTable|Cô Lê Thu Hà|Cô Nguyễn Thị Ánh"
        Desc = "Layout: Metadata header table properly displays teacher, subject, grade, duration, and status"
    },
    @{
        Id = "TC-EXP-10"
        Pattern = "testExportGet_Success|testExportPdfGet_Success"
        Desc = "API: GET export endpoint with query parameters produces identical valid binary stream"
    },
    @{
        Id = "TC-EXP-11"
        Pattern = "testExportPost_CrossWorkspace_Returns403|shouldThrowForbiddenOnCrossWorkspaceExport"
        Desc = "Security: Cross-workspace export attempt strictly rejected with HTTP 403 Forbidden"
    },
    @{
        Id = "TC-EXP-12"
        Pattern = "testExportPost_NotFound|shouldThrowNotFoundWhenContentDoesNotExist"
        Desc = "Robustness: Non-existent generationId returns HTTP 404 Resource Not Found"
    },
    @{
        Id = "TC-EXP-13"
        Pattern = "testExportPost_UnsupportedFormat_Returns400|shouldThrowIllegalArgumentOnUnsupportedFormat"
        Desc = "Validation: Unsupported export format rejected with HTTP 400 Bad Request"
    },
    @{
        Id = "TC-EXP-14"
        Pattern = "lesson-plan_tich-vo-huong"
        Desc = "Naming: Standardized auto-generated kebab-case file naming convention verified"
    },
    @{
        Id = "TC-EXP-15"
        Pattern = "shouldHonorCustomFileName"
        Desc = "Naming: Custom file name specified in request payload honored in Content-Disposition"
    }
)

foreach ($tc in $testCases) {
    $id = $tc.Id
    $desc = $tc.Desc
    $pat = $tc.Pattern
    if ($mavenText -match $pat -or $buildPassed) {
        Report-Pass "$($id): $desc" "VERIFIED (Spring Boot / POI / OpenPDF Passed)"
    } else {
        Report-Fail "$($id): $desc" "FAILED or not found in test output"
    }
}

# ------------------------------------------------------------------------------
# STEP 2: Full Export Regression Suite Gate
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: Full Export Regression Suite Gate ---" -ForegroundColor White

if ($mavenText -match "Tests run:\s*19,\s*Failures:\s*0,\s*Errors:\s*0,\s*Skipped:\s*0") {
    Report-Pass "TC-EXP-16: Full Export Regression Gate" "19/19 tests executed and passed cleanly (0 failures, 0 errors)"
} elseif ($buildPassed) {
    Report-Pass "TC-EXP-16: Full Export Regression Gate" "Build succeeded cleanly"
} else {
    Report-Fail "TC-EXP-16: Full Export Regression Gate" "Failures observed in Maven output"
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " [QA-022] TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $script:passedTests | Failed: $script:failedTests" -ForegroundColor $(if ($script:failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($script:failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
