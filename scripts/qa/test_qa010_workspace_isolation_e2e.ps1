# ==============================================================================
# AI Teacher Copilot - QA-010 Live System E2E Test Script
# Ticket: [QA-010] Test Workspace Multi-Tenant Data Isolation & 403 Forbidden (ATC-33 / ATC-204)
# Tests against running Docker containers: atc-backend (8080) and atc-postgres (5432)
# Unified Test Location: scripts/qa/
# ==============================================================================

$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$teacherA_Email = "qa.teacher.a.$timestamp@school.edu.vn"
$teacherB_Email = "qa.teacher.b.$timestamp@school.edu.vn"
$password       = "TeacherPass2026!"

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

# Helper to execute HTTP requests and capture status codes without halting on 4xx
function Send-ApiRequest($url, $method, $headers = $null, $body = $null) {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.Method = $method
    $req.ContentType = "application/json; charset=utf-8"
    $req.Accept = "application/json"

    if ($headers) {
        foreach ($key in $headers.Keys) {
            $req.Headers.Add($key, $headers[$key])
        }
    }

    if ($body) {
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
        $req.ContentLength = $bodyBytes.Length
        $stream = $req.GetRequestStream()
        $stream.Write($bodyBytes, 0, $bodyBytes.Length)
        $stream.Close()
    }

    try {
        $resp = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $content = $reader.ReadToEnd()
        $statusCode = [int]$resp.StatusCode
        $resp.Close()
        return @{ StatusCode = $statusCode; Content = $content }
    } catch [System.Net.WebException] {
        $errResp = $_.Exception.Response
        if ($errResp) {
            $statusCode = [int]$errResp.StatusCode
            $reader = New-Object System.IO.StreamReader($errResp.GetResponseStream())
            $content = $reader.ReadToEnd()
            $errResp.Close()
            return @{ StatusCode = $statusCode; Content = $content }
        }
        throw $_
    }
}

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " STARTING LIVE E2E TEST FOR [QA-010] WORKSPACE MULTI-TENANT ISOLATION" -ForegroundColor Cyan
Write-Host " Target Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host " Teacher A: $teacherA_Email" -ForegroundColor Cyan
Write-Host " Teacher B: $teacherB_Email" -ForegroundColor Cyan
Write-Host " Test Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: System Pre-flight & Account Preparation
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: Preparing Test Accounts (Teacher A & Teacher B) ---" -ForegroundColor White

try {
    # 1. Register and activate Teacher A
    $regBodyA = @{ email = $teacherA_Email; password = $password; fullName = "Co Nguyen Thi A" } | ConvertTo-Json
    $resRegA = Send-ApiRequest "$baseUrl/auth/register" "POST" $null $regBodyA
    if ($resRegA.StatusCode -ne 200 -and $resRegA.StatusCode -ne 201) { throw "Failed to register Teacher A: $($resRegA.Content)" }
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$teacherA_Email';" | Out-Null

    $loginBodyA = @{ email = $teacherA_Email; password = $password } | ConvertTo-Json
    $resLoginA = Send-ApiRequest "$baseUrl/auth/login" "POST" $null $loginBodyA
    $tokenA = ($resLoginA.Content | ConvertFrom-Json).data.token
    Report-Pass "Setup: Teacher A created, activated, and token obtained" "Token: $($tokenA.Substring(0, 15))..."

    # 2. Register and activate Teacher B
    $regBodyB = @{ email = $teacherB_Email; password = $password; fullName = "Thay Tran Van B" } | ConvertTo-Json
    $resRegB = Send-ApiRequest "$baseUrl/auth/register" "POST" $null $regBodyB
    if ($resRegB.StatusCode -ne 200 -and $resRegB.StatusCode -ne 201) { throw "Failed to register Teacher B: $($resRegB.Content)" }
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$teacherB_Email';" | Out-Null

    $loginBodyB = @{ email = $teacherB_Email; password = $password } | ConvertTo-Json
    $resLoginB = Send-ApiRequest "$baseUrl/auth/login" "POST" $null $loginBodyB
    $tokenB = ($resLoginB.Content | ConvertFrom-Json).data.token
    Report-Pass "Setup: Teacher B created, activated, and token obtained" "Token: $($tokenB.Substring(0, 15))..."

    # 3. Teacher A creates Workspace A
    $wsBodyA = @{
        name = "Toan Hoc Lop 10 - Co A"
        description = "Workspace soan bai Toan 10"
        subject = "Toan hoc"
        gradeLevel = "10"
    } | ConvertTo-Json
    $resWsA = Send-ApiRequest "$baseUrl/workspaces" "POST" @{ "Authorization" = "Bearer $tokenA" } $wsBodyA
    if ($resWsA.StatusCode -ne 200 -and $resWsA.StatusCode -ne 201) { throw "Failed to create Workspace A: $($resWsA.Content)" }
    $wsA_Id = ($resWsA.Content | ConvertFrom-Json).data.id
    Report-Pass "Setup: Workspace A created by Teacher A" "Workspace ID: $wsA_Id"

    # 4. Teacher B creates Workspace B
    $wsBodyB = @{
        name = "Vat Ly Lop 12 - Thay B"
        description = "Workspace soan bai Vat Ly 12"
        subject = "Vat ly"
        gradeLevel = "12"
    } | ConvertTo-Json
    $resWsB = Send-ApiRequest "$baseUrl/workspaces" "POST" @{ "Authorization" = "Bearer $tokenB" } $wsBodyB
    if ($resWsB.StatusCode -ne 200 -and $resWsB.StatusCode -ne 201) { throw "Failed to create Workspace B: $($resWsB.Content)" }
    $wsB_Id = ($resWsB.Content | ConvertFrom-Json).data.id
    Report-Pass "Setup: Workspace B created by Teacher B" "Workspace ID: $wsB_Id"

} catch {
    Write-Host "Setup aborted due to error: $_" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# STEP 1: Workspace List Isolation (AC-2)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Workspace List Isolation (GET /api/workspaces) ---" -ForegroundColor White

# TC-01: Teacher A lists workspaces (Should only see Workspace A, never Workspace B)
$resListA = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer $tokenA" }
$listA_Json = $resListA.Content | ConvertFrom-Json
$hasWsA_in_A = $listA_Json.data | Where-Object { $_.id -eq $wsA_Id }
$hasWsB_in_A = $listA_Json.data | Where-Object { $_.id -eq $wsB_Id }

if ($resListA.StatusCode -eq 200 -and $hasWsA_in_A -and (-not $hasWsB_in_A)) {
    Report-Pass "TC-01: Teacher A list isolation verified" "Teacher A sees Workspace A, Workspace B is completely excluded"
} else {
    Report-Fail "TC-01: Teacher A list isolation failed" "Got HTTP $($resListA.StatusCode), contains B: $($null -ne $hasWsB_in_A)"
}

# TC-02: Teacher B lists workspaces (Should only see Workspace B, never Workspace A)
$resListB = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer $tokenB" }
$listB_Json = $resListB.Content | ConvertFrom-Json
$hasWsB_in_B = $listB_Json.data | Where-Object { $_.id -eq $wsB_Id }
$hasWsA_in_B = $listB_Json.data | Where-Object { $_.id -eq $wsA_Id }

if ($resListB.StatusCode -eq 200 -and $hasWsB_in_B -and (-not $hasWsA_in_B)) {
    Report-Pass "TC-02: Teacher B list isolation verified" "Teacher B sees Workspace B, Workspace A is completely excluded"
} else {
    Report-Fail "TC-02: Teacher B list isolation failed" "Got HTTP $($resListB.StatusCode), contains A: $($null -ne $hasWsA_in_B)"
}

# ------------------------------------------------------------------------------
# STEP 2: Workspace Read Isolation (AC-1 & AC-4)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: Workspace Read Isolation (GET /api/workspaces/{id}) ---" -ForegroundColor White

# TC-03: Teacher A reads own Workspace A (HTTP 200 OK)
$resGetOwnA = Send-ApiRequest "$baseUrl/workspaces/$wsA_Id" "GET" @{ "Authorization" = "Bearer $tokenA" }
if ($resGetOwnA.StatusCode -eq 200 -and ($resGetOwnA.Content | ConvertFrom-Json).data.id -eq $wsA_Id) {
    Report-Pass "TC-03: Teacher A reads own Workspace A" "HTTP 200 OK, ID and metadata match"
} else {
    Report-Fail "TC-03: Teacher A should read own Workspace A" "Got HTTP $($resGetOwnA.StatusCode)"
}

# TC-04: Teacher A attempts to read Teacher B's Workspace B (HTTP 403 Forbidden)
$resGetCrossB = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id" "GET" @{ "Authorization" = "Bearer $tokenA" }
$getCrossB_Json = $resGetCrossB.Content | ConvertFrom-Json
if ($resGetCrossB.StatusCode -eq 403 -and $getCrossB_Json.error -eq "You do not have access to this workspace") {
    Report-Pass "TC-04: Cross-tenant read is blocked with HTTP 403 Forbidden" "Teacher A denied access to Workspace B"
} else {
    Report-Fail "TC-04: Cross-tenant read should return HTTP 403" "Got HTTP $($resGetCrossB.StatusCode): $($resGetCrossB.Content)"
}

# TC-05: Teacher B reads own Workspace B (HTTP 200 OK)
$resGetOwnB = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id" "GET" @{ "Authorization" = "Bearer $tokenB" }
if ($resGetOwnB.StatusCode -eq 200 -and ($resGetOwnB.Content | ConvertFrom-Json).data.id -eq $wsB_Id) {
    Report-Pass "TC-05: Teacher B reads own Workspace B" "HTTP 200 OK"
} else {
    Report-Fail "TC-05: Teacher B should read own Workspace B" "Got HTTP $($resGetOwnB.StatusCode)"
}

# TC-06: Teacher B attempts to read Teacher A's Workspace A (HTTP 403 Forbidden)
$resGetCrossA = Send-ApiRequest "$baseUrl/workspaces/$wsA_Id" "GET" @{ "Authorization" = "Bearer $tokenB" }
if ($resGetCrossA.StatusCode -eq 403) {
    Report-Pass "TC-06: Reverse cross-tenant read is blocked with HTTP 403 Forbidden" "Teacher B denied access to Workspace A"
} else {
    Report-Fail "TC-06: Reverse cross-tenant read should return HTTP 403" "Got HTTP $($resGetCrossA.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 3: Workspace Update Isolation (AC-2 & AC-4)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 3: Workspace Update Isolation (PUT /api/workspaces/{id}) ---" -ForegroundColor White

# TC-07: Teacher A attempts to modify Teacher B's Workspace B (HTTP 403 Forbidden)
$updateBodyHacked = @{ name = "HACKED BY TEACHER A"; description = "Illicit tamper" } | ConvertTo-Json
$resUpCross = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id" "PUT" @{ "Authorization" = "Bearer $tokenA" } $updateBodyHacked
if ($resUpCross.StatusCode -eq 403) {
    Report-Pass "TC-07: Cross-tenant update rejected with HTTP 403 Forbidden" "Teacher A prevented from modifying Workspace B"
} else {
    Report-Fail "TC-07: Cross-tenant update should return HTTP 403" "Got HTTP $($resUpCross.StatusCode)"
}

# TC-08: Database verification - Verify Workspace B was NOT modified in PostgreSQL
$dbWsB_Name = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -c "SELECT name FROM workspaces WHERE id = '$wsB_Id';"
if ($dbWsB_Name.Trim() -eq "Vat Ly Lop 12 - Thay B") {
    Report-Pass "TC-08: Database verification confirmed integrity" "Workspace B name in DB remains: $dbWsB_Name"
} else {
    Report-Fail "TC-08: Workspace B was unexpectedly modified in DB" "Actual name in DB: $dbWsB_Name"
}

# TC-09: Teacher B updates own Workspace B (HTTP 200 OK)
$updateBodyLegit = @{ name = "Vat Ly Lop 12 Nang Cao - Thay B"; description = "On thi tot nghiep" } | ConvertTo-Json
$resUpOwner = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id" "PUT" @{ "Authorization" = "Bearer $tokenB" } $updateBodyLegit
if ($resUpOwner.StatusCode -eq 200 -and ($resUpOwner.Content | ConvertFrom-Json).data.name -eq "Vat Ly Lop 12 Nang Cao - Thay B") {
    Report-Pass "TC-09: Owner successfully updates own workspace" "HTTP 200 OK, new name saved"
} else {
    Report-Fail "TC-09: Owner update should return HTTP 200" "Got HTTP $($resUpOwner.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 4: Workspace Delete Isolation (AC-3 & AC-4)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 4: Workspace Delete Isolation (DELETE /api/workspaces/{id}) ---" -ForegroundColor White

# TC-10: Teacher A attempts to delete Teacher B's Workspace B (HTTP 403 Forbidden)
$resDelCross = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id" "DELETE" @{ "Authorization" = "Bearer $tokenA" }
if ($resDelCross.StatusCode -eq 403) {
    Report-Pass "TC-10: Cross-tenant delete rejected with HTTP 403 Forbidden" "Teacher A prevented from deleting Workspace B"
} else {
    Report-Fail "TC-10: Cross-tenant delete should return HTTP 403" "Got HTTP $($resDelCross.StatusCode)"
}

# TC-11: Database verification - Verify Workspace B is still active in PostgreSQL
$dbWsB_Active = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -c "SELECT is_active FROM workspaces WHERE id = '$wsB_Id';"
if ($dbWsB_Active.Trim() -eq "t") {
    Report-Pass "TC-11: Database verification confirmed Workspace B remains active" "is_active = t in PostgreSQL"
} else {
    Report-Fail "TC-11: Workspace B was unexpectedly deactivated" "is_active = $dbWsB_Active"
}

# ------------------------------------------------------------------------------
# STEP 5: Child Resource (Document Endpoint) Isolation
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 5: Child Resource Isolation (/workspaces/{id}/documents) ---" -ForegroundColor White

# TC-12: Teacher A attempts to access documents of Workspace B (HTTP 403 Forbidden)
$resDocsCross = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id/documents" "GET" @{ "Authorization" = "Bearer $tokenA" }
if ($resDocsCross.StatusCode -eq 403) {
    Report-Pass "TC-12: Child resource (documents) cross-tenant access blocked" "HTTP 403 Forbidden on /workspaces/{id_B}/documents"
} else {
    Report-Fail "TC-12: Child resource access should return HTTP 403" "Got HTTP $($resDocsCross.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 6: Owner Deletion, Anti-Enumeration & Boundary Checks
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 6: Deletion Lifecycle & Anti-Enumeration Boundary ---" -ForegroundColor White

# TC-13: Teacher B deletes own Workspace B (HTTP 200 OK)
$resDelOwner = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id" "DELETE" @{ "Authorization" = "Bearer $tokenB" }
if ($resDelOwner.StatusCode -eq 200) {
    Report-Pass "TC-13: Owner successfully deletes own Workspace B" "HTTP 200 OK, soft-deleted"
} else {
    Report-Fail "TC-13: Owner deletion should return HTTP 200" "Got HTTP $($resDelOwner.StatusCode)"
}

# TC-14: Teacher B reads soft-deleted Workspace B (HTTP 404 Not Found)
$resGetDeletedOwner = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id" "GET" @{ "Authorization" = "Bearer $tokenB" }
if ($resGetDeletedOwner.StatusCode -eq 404) {
    Report-Pass "TC-14: Owner reading soft-deleted workspace receives HTTP 404 Not Found" "Soft-deleted workspace hidden from owner"
} else {
    Report-Fail "TC-14: Soft-deleted workspace should return HTTP 404 to owner" "Got HTTP $($resGetDeletedOwner.StatusCode)"
}

# TC-15: Teacher A reads Teacher B's soft-deleted Workspace B (HTTP 403 Forbidden, Anti-Enumeration)
$resGetDeletedCross = Send-ApiRequest "$baseUrl/workspaces/$wsB_Id" "GET" @{ "Authorization" = "Bearer $tokenA" }
if ($resGetDeletedCross.StatusCode -eq 403) {
    Report-Pass "TC-15: Cross-tenant reading soft-deleted workspace receives HTTP 403 Forbidden" "Anti-enumeration protects deletion status"
} else {
    Report-Fail "TC-15: Cross-tenant query should return HTTP 403 even for deleted workspaces" "Got HTTP $($resGetDeletedCross.StatusCode)"
}

# TC-16: Non-existent workspace UUID returns HTTP 404 Not Found
$resNonExistent = Send-ApiRequest "$baseUrl/workspaces/00000000-0000-0000-0000-000000000000" "GET" @{ "Authorization" = "Bearer $tokenA" }
if ($resNonExistent.StatusCode -eq 404) {
    Report-Pass "TC-16: Non-existent workspace UUID returns HTTP 404 Not Found" "HTTP 404 Not Found"
} else {
    Report-Fail "TC-16: Non-existent workspace should return HTTP 404" "Got HTTP $($resNonExistent.StatusCode)"
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " QA-010 LIVE E2E TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host " Total Passed: $passedTests" -ForegroundColor Green
Write-Host " Total Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host " Overall Status: $(if ($failedTests -eq 0) { "ALL TESTS PASSED (100%)" } else { "SOME TESTS FAILED" })" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
}
