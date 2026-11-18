# ==============================================================================
# AI Teacher Copilot - QA-007 Live System E2E Test Script
# Ticket: [QA-007] Test Teacher Registration & Duplicate Email Handling (ATC-22)
# With Full Email Verification & Activation Flow (SMTP)
# Tests against running Docker containers: atc-backend (8080) and atc-postgres (5432)
# ==============================================================================

$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$testEmail = "qa.teacher.$timestamp@school.edu.vn"
$rawPassword = "SecurePassword2026!"
$fullName = "Thầy QA Hoàng Nam"

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

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " STARTING LIVE E2E TEST FOR [QA-007] TEACHER REGISTRATION" -ForegroundColor Cyan
Write-Host " Target Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host " Test Email:      $testEmail" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# Test 1: AC-1 - Valid Teacher Registration (Pending Email Verification)
# ------------------------------------------------------------------------------
Write-Host "--- TEST 1: AC-1 - Valid Teacher Registration (Pending Email Activation) ---" -ForegroundColor White
$regBody = @{
    email = $testEmail
    password = $rawPassword
    fullName = $fullName
} | ConvertTo-Json

try {
    $res1 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    if ($res1.success -eq $true -and $res1.data.email -eq $testEmail -and $res1.data.requiresEmailVerification -eq $true) {
        Report-Pass "AC-1: Valid teacher registration initiated" "Email=$($res1.data.email), requiresEmailVerification=true"
    } else {
        Report-Fail "AC-1: Valid teacher registration returned unexpected body" ($res1 | ConvertTo-Json -Compress)
    }

    # Verify no password or passwordHash leaked in API response
    if ($null -eq $res1.data.password -and $null -eq $res1.data.passwordHash) {
        Report-Pass "AC-1: API response sanitized (no password or hash returned)" "Password and passwordHash are absent from response"
    } else {
        Report-Fail "AC-1: API response leaks sensitive password data" ($res1.data | ConvertTo-Json -Compress)
    }
} catch {
    Report-Fail "AC-1: Valid teacher registration failed with exception" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# Test 2: AC-5 - User Record Persisted in DB as Inactive with BCrypt Hash
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 2: AC-5 - Direct Database Inspection (is_active=false & BCrypt Hash) ---" -ForegroundColor White
try {
    $sqlCmd = "SELECT email, password_hash, role, is_active FROM users WHERE email = '$testEmail';"
    $dbOutput = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -F "|" -c $sqlCmd

    if ($dbOutput) {
        $fields = $dbOutput.Trim().Split("|")
        $dbEmail = $fields[0]
        $dbHash = $fields[1]
        $dbRole = $fields[2]
        $dbActive = $fields[3]

        if ($dbEmail -eq $testEmail -and $dbRole -eq "TEACHER" -and $dbActive -eq "f") {
            Report-Pass "AC-5: User persisted correctly in PostgreSQL (is_active=false)" "Email=$dbEmail, Role=$dbRole, IsActive=$dbActive"
        } else {
            Report-Fail "AC-5: User attributes in PostgreSQL do not match" "DB Output: $dbOutput"
        }

        # Check BCrypt prefix: $2a$ or $2b$
        if ($dbHash -match '^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$') {
            Report-Pass "AC-5: Password is encrypted with strong BCrypt hash in DB" "Hash: $($dbHash.Substring(0, 15))... (length: $($dbHash.Length))"
        } else {
            Report-Fail "AC-5: Password in DB is NOT a valid BCrypt hash" "Stored Value: $dbHash"
        }

        # Ensure raw password is NOT in the database
        if ($dbHash -ne $rawPassword -and -not ($dbHash.Contains($rawPassword))) {
            Report-Pass "AC-5: Raw password is never stored in plain text" "Plain-text '$rawPassword' not found in database record"
        } else {
            Report-Fail "AC-5: Plain text password leaked in database!" "Found raw password in record!"
        }
    } else {
        Report-Fail "AC-5: No record found in PostgreSQL for email $testEmail" "Query returned empty"
    }
} catch {
    Report-Fail "AC-5: Failed to query PostgreSQL container" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# Test 3: Security Gate - Login Blocked Before Email Verification (HTTP 401)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 3: Security Gate - Login Blocked When Account Inactive ---" -ForegroundColor White
$loginBody = @{
    email = $testEmail
    password = $rawPassword
} | ConvertTo-Json

try {
    $preLogin = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Report-Fail "Security: Inactive user was unexpectedly allowed to login" "StatusCode=$($preLogin.StatusCode)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $respStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($respStream, [System.Text.Encoding]::UTF8)
    $respBody = $reader.ReadToEnd()

    if ($statusCode -eq 401 -and ($respBody -match "k.ch ho.t" -or $respBody -match "chua du" -or $respBody -match "email")) {
        Report-Pass "Security: Inactive account login blocked with HTTP 401" "Error message: 'Tài khoản chưa được kích hoạt...'"
    } else {
        Report-Fail "Security: Unexpected response on inactive login" "StatusCode=$statusCode, Body=$respBody"
    }
}

# ------------------------------------------------------------------------------
# Test 4: Email Verification & Account Activation (HTTP 200)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 4: Email Verification Token Processing & Activation ---" -ForegroundColor White
$token = $null
try {
    # Extract verification link from backend logs
    $logLines = docker logs atc-backend --tail 50
    $match = [regex]::Match($logLines, "token=([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)&email=$testEmail")
    if ($match.Success) {
        $token = $match.Groups[1].Value
        Report-Pass "Activation: Verification token extracted from EmailService logs" "Token: $($token.Substring(0, 20))..."
    } else {
        Report-Fail "Activation: Verification token not found in backend container logs" ""
    }
} catch {
    Report-Fail "Activation: Failed to read docker logs" $_.Exception.Message
}

if ($token) {
    try {
        $verifyBody = @{ token = $token } | ConvertTo-Json
        $verifyRes = Invoke-RestMethod -Uri "$baseUrl/auth/verify-email" -Method Post -Body $verifyBody -ContentType "application/json"
        if ($verifyRes.success -eq $true) {
            Report-Pass "Activation: POST /api/auth/verify-email succeeded with HTTP 200" "Message: $($verifyRes.message)"
        } else {
            Report-Fail "Activation: Verify-email returned success=false" ($verifyRes | ConvertTo-Json -Compress)
        }

        # Verify DB is_active = true
        $activeCheck = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -c "SELECT is_active FROM users WHERE email = '$testEmail';"
        if ($activeCheck.Trim() -eq "t") {
            Report-Pass "Activation: PostgreSQL record successfully updated to is_active=true" "is_active = t"
        } else {
            Report-Fail "Activation: User is_active not updated in PostgreSQL" "Value: $activeCheck"
        }
    } catch {
        Report-Fail "Activation: verify-email request failed with exception" $_.Exception.Message
    }
}

# ------------------------------------------------------------------------------
# Test 5: Login Succeeds After Account Activation (HTTP 200)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 5: Login Verification (After Email Activation) ---" -ForegroundColor White
try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    if ($loginRes.success -eq $true -and $loginRes.data.token -and $loginRes.data.role -eq "TEACHER") {
        Report-Pass "Authentication: Successfully logged in after email activation" "JWT Token received, Role=TEACHER"
    } else {
        Report-Fail "Authentication: Login returned unexpected response" ($loginRes | ConvertTo-Json -Compress)
    }
} catch {
    Report-Fail "Authentication: Login failed for activated user" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# Test 6: AC-4 - Duplicate Email Handling (HTTP 400 Bad Request)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 6: AC-4 - Duplicate Email Registration Handling ---" -ForegroundColor White
$dupBody = @{
    email = $testEmail
    password = "DifferentPassword999!"
    fullName = "Người Trùng Email"
} | ConvertTo-Json

try {
    $resDup = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method Post -Body $dupBody -ContentType "application/json"
    Report-Fail "AC-4: Duplicate email was unexpectedly accepted with HTTP $($resDup.StatusCode)" ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $respStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($respStream, [System.Text.Encoding]::UTF8)
    $respBody = $reader.ReadToEnd()

    if (($statusCode -eq 400 -or $statusCode -eq 409) -and ($respBody -match "Email is already registered" -or $respBody -match "already in use")) {
        Report-Pass "AC-4: Duplicate email correctly rejected with HTTP $statusCode" "Message: 'Email is already registered'"
    } else {
        Report-Fail "AC-4: Unexpected response on duplicate email" "StatusCode=$statusCode, Body=$respBody"
    }
}

# Verify still only 1 user exists in DB
$countOutput = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -c "SELECT COUNT(*) FROM users WHERE email = '$testEmail';"
if ($countOutput.Trim() -eq "1") {
    Report-Pass "AC-4: Exactly 1 record exists in PostgreSQL (no duplicate created)" "Record count = 1"
} else {
    Report-Fail "AC-4: Unexpected number of records for duplicate email" "Count = $countOutput"
}

# ------------------------------------------------------------------------------
# Test 7: AC-2 - Invalid Email Format Rejection (HTTP 400)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 7: AC-2 - Invalid Email Format Handling ---" -ForegroundColor White
$invalidEmails = @("not-an-email", "@nodomain.com", "user space@test.com", "")

foreach ($invEmail in $invalidEmails) {
    $badEmailBody = @{
        email = $invEmail
        password = "ValidPassword123!"
        fullName = "Test Invalid Email"
    } | ConvertTo-Json

    try {
        $resInv = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method Post -Body $badEmailBody -ContentType "application/json"
        Report-Fail "AC-2: Invalid email '$invEmail' was unexpectedly accepted" ""
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) {
            Report-Pass "AC-2: Invalid email '$invEmail' correctly rejected with HTTP 400" "Status 400 Bad Request"
        } else {
            Report-Fail "AC-2: Invalid email '$invEmail' returned status $statusCode" ""
        }
    }
}

# ------------------------------------------------------------------------------
# Test 8: AC-3 - Invalid Password Rejection (HTTP 400)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 8: AC-3 - Invalid Password Handling ---" -ForegroundColor White
$invalidPasswords = @("12345", "short", "1234567", "")

foreach ($invPass in $invalidPasswords) {
    $badPassBody = @{
        email = "valid.email.$timestamp@school.edu.vn"
        password = $invPass
        fullName = "Test Invalid Password"
    } | ConvertTo-Json

    try {
        $resPass = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method Post -Body $badPassBody -ContentType "application/json"
        Report-Fail "AC-3: Invalid password '$invPass' was unexpectedly accepted" ""
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) {
            Report-Pass "AC-3: Invalid password '$invPass' correctly rejected with HTTP 400" "Status 400 Bad Request"
        } else {
            Report-Fail "AC-3: Invalid password '$invPass' returned status $statusCode" ""
        }
    }
}

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " QA-007 TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $passedTests" -ForegroundColor Green
Write-Host " Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
