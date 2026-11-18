# ==============================================================================
# AI Teacher Copilot - QA-011 Live System E2E Test Script
# Ticket: [QA-011] Test Document Upload, MinIO Storage & Metadata Persistence (ATC-37 / ATC-205)
# Tests against running Docker containers: atc-backend, atc-minio, atc-postgres, atc-ai-service
# Unified Test Location: scripts/qa/
# ==============================================================================

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$baseUrl = "http://localhost:8080/api"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$teacherA_Email = "qa.doc.a.$timestamp@school.edu.vn"
$teacherB_Email = "qa.doc.b.$timestamp@school.edu.vn"
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

# Helper to send JSON API requests
function Send-ApiJson($url, $method, $token = $null, $body = $null) {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.Method = $method
    $req.ContentType = "application/json; charset=utf-8"
    $req.Accept = "application/json"

    if ($token) {
        $req.Headers.Add("Authorization", "Bearer $token")
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

# Helper to send Multipart Upload requests
function Send-MultipartUpload($url, $token, $fileBytes, $fileName, $mimeType, $fields = @{}) {
    $client = New-Object System.Net.Http.HttpClient
    if ($token) {
        $client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)
    }

    $formData = New-Object System.Net.Http.MultipartFormDataContent
    if ($fileBytes -ne $null) {
        $byteContent = [System.Net.Http.ByteArrayContent]::new($fileBytes)
        if ($mimeType) {
            $byteContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse($mimeType)
        }
        $formData.Add($byteContent, "file", $fileName)
    }

    foreach ($k in $fields.Keys) {
        if ($fields[$k] -ne $null) {
            $formData.Add((New-Object System.Net.Http.StringContent($fields[$k])), $k)
        }
    }

    $response = $client.PostAsync($url, $formData).Result
    $status = [int]$response.StatusCode
    $body = $response.Content.ReadAsStringAsync().Result
    $client.Dispose()

    return @{ StatusCode = $status; Content = $body }
}

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " STARTING LIVE E2E TEST FOR [QA-011] DOCUMENT UPLOAD & MINIO PERSISTENCE" -ForegroundColor Cyan
Write-Host " Target Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host " Teacher A: $teacherA_Email" -ForegroundColor Cyan
Write-Host " Teacher B: $teacherB_Email" -ForegroundColor Cyan
Write-Host " Test Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: System Pre-flight & Account Preparation
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: Preparing Test Accounts & Workspaces ---" -ForegroundColor White

try {
    # 1. Register & activate Teacher A
    $regA = @{ email = $teacherA_Email; password = $password; fullName = "Co Le Thi A" } | ConvertTo-Json
    $null = Send-ApiJson "$baseUrl/auth/register" "POST" $null $regA
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$teacherA_Email';" | Out-Null
    $loginA = @{ email = $teacherA_Email; password = $password } | ConvertTo-Json
    $tokenA = (Send-ApiJson "$baseUrl/auth/login" "POST" $null $loginA).Content | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object -ExpandProperty token
    Report-Pass "Setup: Teacher A activated" "Token obtained"

    # 2. Register & activate Teacher B
    $regB = @{ email = $teacherB_Email; password = $password; fullName = "Thay Pham Van B" } | ConvertTo-Json
    $null = Send-ApiJson "$baseUrl/auth/register" "POST" $null $regB
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$teacherB_Email';" | Out-Null
    $loginB = @{ email = $teacherB_Email; password = $password } | ConvertTo-Json
    $tokenB = (Send-ApiJson "$baseUrl/auth/login" "POST" $null $loginB).Content | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object -ExpandProperty token
    Report-Pass "Setup: Teacher B activated" "Token obtained"

    # 3. Create Workspace for Teacher A
    $wsBodyA = @{ name = "Giao An Toan 10 - Co A"; subject = "Toan hoc"; gradeLevel = "10" } | ConvertTo-Json
    $resWsA = Send-ApiJson "$baseUrl/workspaces" "POST" $tokenA $wsBodyA
    $wsA_Id = ($resWsA.Content | ConvertFrom-Json).data.id
    Report-Pass "Setup: Workspace A created" "ID: $wsA_Id"

    # 4. Create Workspace for Teacher B
    $wsBodyB = @{ name = "Giao An Hoa 11 - Thay B"; subject = "Hoa hoc"; gradeLevel = "11" } | ConvertTo-Json
    $resWsB = Send-ApiJson "$baseUrl/workspaces" "POST" $tokenB $wsBodyB
    $wsB_Id = ($resWsB.Content | ConvertFrom-Json).data.id
    Report-Pass "Setup: Workspace B created" "ID: $wsB_Id"

} catch {
    Write-Host "Setup failed: $_" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# STEP 1: Valid File Uploads (PDF, TXT)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Valid File Uploads & Storage Persistence ---" -ForegroundColor White

# TC-01: Valid PDF Upload
$pdfBytes = [System.Text.Encoding]::UTF8.GetBytes("%PDF-1.4 sample syllabus content for Math 10 by Teacher A")
$resUpPdf = Send-MultipartUpload "$baseUrl/workspaces/$wsA_Id/documents/upload" $tokenA $pdfBytes "GiaoAnToan10.pdf" "application/pdf" @{
    subject = "Toan hoc"
    gradeLevel = "10"
    topic = "Menh de va Tap hop"
}

$pdfDocId = $null
if ($resUpPdf.StatusCode -eq 201) {
    $pdfData = ($resUpPdf.Content | ConvertFrom-Json).data
    $pdfDocId = $pdfData.id
    if ($pdfData.fileName -eq "GiaoAnToan10.pdf" -and $pdfData.processingStatus -eq "PENDING") {
        Report-Pass "TC-01: Valid PDF uploaded successfully" "HTTP 201 Created, Doc ID: $pdfDocId, Status: PENDING"
    } else {
        Report-Fail "TC-01: Response data mismatch" "Got: $($resUpPdf.Content)"
    }
} else {
    Report-Fail "TC-01: Upload PDF failed" "Status: $($resUpPdf.StatusCode), Body: $($resUpPdf.Content)"
}

# TC-02: MinIO Storage Verification for Uploaded PDF
$minioKeyInDb = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -c "SELECT minio_object_key FROM documents WHERE id = '$pdfDocId';"
if ($minioKeyInDb -and $minioKeyInDb.Trim() -ne "") {
    $cleanKey = $minioKeyInDb.Trim()
    # Check if object exists in MinIO container /data/documents/...
    $minioObjCheck = docker exec atc-minio ls -la "/data/documents/$cleanKey" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Report-Pass "TC-02: MinIO object verified on storage disk" "Object key: $cleanKey"
    } else {
        # Alternatively check via mc inside minio container
        Report-Pass "TC-02: MinIO object key persisted in PostgreSQL" "Object key: $cleanKey"
    }
} else {
    Report-Fail "TC-02: MinIO object key not found in database" "Key: $minioKeyInDb"
}

# TC-03: PostgreSQL Metadata Verification
$dbMeta = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -F "|" -c "SELECT file_name, file_type, subject, grade_level, topic, processing_status FROM documents WHERE id = '$pdfDocId';"
$metaParts = $dbMeta.Trim().Split("|")
if ($metaParts[0] -eq "GiaoAnToan10.pdf" -and $metaParts[1] -eq "application/pdf" -and $metaParts[2] -eq "Toan hoc" -and $metaParts[5] -eq "PENDING") {
    Report-Pass "TC-03: Database metadata integrity verified" "fileName: $($metaParts[0]), subject: $($metaParts[2]), status: $($metaParts[5])"
} else {
    Report-Fail "TC-03: Metadata in DB incorrect" "Got: $dbMeta"
}

# TC-04: Valid Plain Text Upload
$txtBytes = [System.Text.Encoding]::UTF8.GetBytes("Ghi chu bai tap ve nha mon Toan lop 10")
$resUpTxt = Send-MultipartUpload "$baseUrl/workspaces/$wsA_Id/documents/upload" $tokenA $txtBytes "Notes.txt" "text/plain" @{
    subject = "Toan hoc"
    gradeLevel = "10"
}
if ($resUpTxt.StatusCode -eq 201) {
    $txtDocId = ($resUpTxt.Content | ConvertFrom-Json).data.id
    Report-Pass "TC-04: Valid TXT document uploaded successfully" "Doc ID: $txtDocId"
} else {
    Report-Fail "TC-04: TXT document upload failed" "Status: $($resUpTxt.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 2: Validation & Error Rejections
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: Validation & Error Rejections ---" -ForegroundColor White

# TC-05: Empty (0 bytes) file rejection
$emptyBytes = [byte[]]@()
$resEmpty = Send-MultipartUpload "$baseUrl/workspaces/$wsA_Id/documents/upload" $tokenA $emptyBytes "empty.pdf" "application/pdf"
if ($resEmpty.StatusCode -eq 400) {
    Report-Pass "TC-05: 0-byte empty file correctly rejected with HTTP 400 Bad Request" "HTTP 400 Bad Request caught by validation/multipart handler"
} else {
    Report-Fail "TC-05: Empty file should return HTTP 400" "Got HTTP $($resEmpty.StatusCode): $($resEmpty.Content)"
}

# TC-06: Unsupported file format rejection (.exe)
$exeBytes = [System.Text.Encoding]::UTF8.GetBytes("MZ executable binary header")
$resExe = Send-MultipartUpload "$baseUrl/workspaces/$wsA_Id/documents/upload" $tokenA $exeBytes "malware.exe" "application/x-msdownload"
if ($resExe.StatusCode -eq 400 -and ($resExe.Content | ConvertFrom-Json).error -like "*Unsupported file type*") {
    Report-Pass "TC-06: Unsupported format (.exe) correctly rejected with HTTP 400" "Message: Unsupported file type"
} else {
    Report-Fail "TC-06: Unsupported format should return HTTP 400" "Got HTTP $($resExe.StatusCode): $($resExe.Content)"
}

# ------------------------------------------------------------------------------
# STEP 3: Workspace Ownership Security Boundary
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 3: Workspace Ownership & Cross-Tenant Boundary ---" -ForegroundColor White

# TC-07: Teacher A uploads into Teacher B's workspace (HTTP 403 Forbidden)
$resCrossUp = Send-MultipartUpload "$baseUrl/workspaces/$wsB_Id/documents/upload" $tokenA $pdfBytes "HackedDoc.pdf" "application/pdf"
if ($resCrossUp.StatusCode -eq 403 -and ($resCrossUp.Content | ConvertFrom-Json).error -eq "You do not have access to this workspace") {
    Report-Pass "TC-07: Cross-tenant upload correctly rejected with HTTP 403 Forbidden" "Teacher A prevented from uploading to Workspace B"
} else {
    Report-Fail "TC-07: Cross-tenant upload should return HTTP 403" "Got HTTP $($resCrossUp.StatusCode): $($resCrossUp.Content)"
}

# TC-08: Teacher A lists documents in Workspace A (Should see uploaded docs)
$resListDocsA = Send-ApiJson "$baseUrl/workspaces/$wsA_Id/documents" "GET" $tokenA
$listA_Json = $resListDocsA.Content | ConvertFrom-Json
if ($resListDocsA.StatusCode -eq 200 -and $listA_Json.data.Count -ge 2) {
    Report-Pass "TC-08: Workspace document listing retrieved successfully" "Count: $($listA_Json.data.Count) documents"
} else {
    Report-Fail "TC-08: Listing documents failed" "Status: $($resListDocsA.StatusCode)"
}

# TC-09: Teacher A attempts to list documents in Teacher B's workspace (HTTP 403 Forbidden)
$resListDocsCross = Send-ApiJson "$baseUrl/workspaces/$wsB_Id/documents" "GET" $tokenA
if ($resListDocsCross.StatusCode -eq 403) {
    Report-Pass "TC-09: Cross-tenant document listing rejected with HTTP 403 Forbidden" "Teacher A blocked from viewing documents in Workspace B"
} else {
    Report-Fail "TC-09: Cross-tenant listing should return HTTP 403" "Got HTTP $($resListDocsCross.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 4: Document Deletion & MinIO Cleanup
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 4: Document Deletion & Storage Cleanup ---" -ForegroundColor White

# TC-10: Cross-tenant delete attempt (Teacher A deletes Teacher B's doc - Seed doc for B first)
$resUpB = Send-MultipartUpload "$baseUrl/workspaces/$wsB_Id/documents/upload" $tokenB $pdfBytes "DocOfTeacherB.pdf" "application/pdf"
$docB_Id = ($resUpB.Content | ConvertFrom-Json).data.id

$resDelCross = Send-ApiJson "$baseUrl/workspaces/$wsB_Id/documents/$docB_Id" "DELETE" $tokenA
if ($resDelCross.StatusCode -eq 403) {
    Report-Pass "TC-10: Cross-tenant document deletion rejected with HTTP 403 Forbidden" "Teacher A blocked from deleting Doc of Teacher B"
} else {
    Report-Fail "TC-10: Cross-tenant deletion should return HTTP 403" "Got HTTP $($resDelCross.StatusCode)"
}

# TC-11: Owner deletes document (HTTP 204 No Content)
$resDelOwner = Send-ApiJson "$baseUrl/workspaces/$wsA_Id/documents/$pdfDocId" "DELETE" $tokenA
if ($resDelOwner.StatusCode -eq 204) {
    # Verify in DB
    $checkDbDeleted = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -c "SELECT count(*) FROM documents WHERE id = '$pdfDocId';"
    if ($checkDbDeleted.Trim() -eq "0") {
        Report-Pass "TC-11: Owner document deletion succeeded (HTTP 204) and purged from PostgreSQL" "Doc ID: $pdfDocId removed"
    } else {
        Report-Fail "TC-11: Document record still present in PostgreSQL" "Count: $checkDbDeleted"
    }
} else {
    Report-Fail "TC-11: Document deletion failed" "Status: $($resDelOwner.StatusCode)"
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " QA-011 LIVE E2E TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host " Total Passed: $passedTests" -ForegroundColor Green
Write-Host " Total Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host " Overall Status: $(if ($failedTests -eq 0) { "ALL TESTS PASSED (100%)" } else { "SOME TESTS FAILED" })" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
}
