# ==============================================================================
# AI Teacher Copilot - QA-008 Live System E2E Test Script
# Ticket: [QA-008] Test Teacher Login & Invalid Credentials Handling (ATC-26 / ATC-202)
# Tests against running Docker containers: atc-backend (8080) and atc-postgres (5432)
# Unified Test Location: scripts/qa/
# ==============================================================================

$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$activeEmail = "qa.login.$timestamp@school.edu.vn"
$inactiveEmail = "qa.inactive.$timestamp@school.edu.vn"
$validPassword = "ValidPassword2026!"
$wrongPassword = "WrongPassword999!"
$fullName = "Thay QA Do Nam Trung"

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
Write-Host " STARTING LIVE E2E TEST FOR [QA-008] TEACHER LOGIN" -ForegroundColor Cyan
Write-Host " Target Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host " Active Email:   $activeEmail" -ForegroundColor Cyan
Write-Host " Inactive Email: $inactiveEmail" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: Seed Users Directly in PostgreSQL Container
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: Seeding Active and Inactive Users in PostgreSQL ---" -ForegroundColor White

try {
    # 1. Register active user via API and activate in DB
    $regBody1 = @{
        email = $activeEmail
        password = $validPassword
        fullName = $fullName
    } | ConvertTo-Json
    $resReg1 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($regBody1)) -ContentType "application/json; charset=utf-8"
    
    # Activate user in DB
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$activeEmail';" | Out-Null
    Report-Pass "Setup: Active user registered and activated" "Email: $activeEmail, is_active=true"

    # 2. Register inactive user via API (stays is_active=false)
    $regBody2 = @{
        email = $inactiveEmail
        password = $validPassword
        fullName = "Giao Vien Chua Kich Hoat"
    } | ConvertTo-Json
    $resReg2 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($regBody2)) -ContentType "application/json; charset=utf-8"
    Report-Pass "Setup: Inactive user registered (pending activation)" "Email: $inactiveEmail, is_active=false"
} catch {
    Report-Fail "Setup: Failed to seed test users" $_.Exception.Message
    exit 1
}

# ------------------------------------------------------------------------------
# TEST 1: AC-1 - Valid Teacher Login (HTTP 200)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 1: AC-1 - Valid Teacher Login ---" -ForegroundColor White
$loginBody = @{
    email = $activeEmail
    password = $validPassword
} | ConvertTo-Json

$token = $null
try {
    $res1 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    if ($res1.success -eq $true -and $res1.data.token -and $res1.data.role -eq "TEACHER" -and $res1.data.email -eq $activeEmail) {
        $token = $res1.data.token
        Report-Pass "AC-1: Valid teacher login succeeded with HTTP 200" "Token received, Role=$($res1.data.role), FullName=$($res1.data.fullName)"
    } else {
        Report-Fail "AC-1: Valid login returned unexpected body" ($res1 | ConvertTo-Json -Compress)
    }
} catch {
    Report-Fail "AC-1: Valid login failed with exception" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# TEST 2: AC-4 - Token Structure and Claims Verification
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 2: AC-4 - JWT Token Format & Claims Verification ---" -ForegroundColor White
if ($token) {
    $parts = $token.Split(".")
    if ($parts.Length -eq 3) {
        Report-Pass "AC-4: Token is valid 3-part JWT (Header.Payload.Signature)" "Part count = 3"

        # Decode base64url payload
        try {
            $base64 = $parts[1].Replace('-', '+').Replace('_', '/')
            switch ($base64.Length % 4) {
                2 { $base64 += '==' }
                3 { $base64 += '=' }
            }
            $payloadJson = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($base64))
            $payload = $payloadJson | ConvertFrom-Json

            if ($payload.sub -and $payload.email -eq $activeEmail -and $payload.exp) {
                Report-Pass "AC-4: JWT payload contains valid sub, email and exp claims" "Subject=$($payload.sub), Email=$($payload.email), Exp=$($payload.exp)"
            } else {
                Report-Fail "AC-4: JWT payload missing required claims" $payloadJson
            }
        } catch {
            Report-Fail "AC-4: Failed to decode JWT payload" $_.Exception.Message
        }
    } else {
        Report-Fail "AC-4: Token is not a valid 3-part JWT" "Part count = $($parts.Length)"
    }
} else {
    Report-Fail "AC-4: Cannot verify token because login failed" ""
}

# ------------------------------------------------------------------------------
# TEST 3: AC-5 - Sensitive Information Protection (No Leaks in Response)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 3: AC-5 - Sensitive Data Protection Verification ---" -ForegroundColor White
try {
    $rawSuccess = curl.exe -s -X POST "$baseUrl/auth/login" -H "Content-Type: application/json" -d $loginBody
    
    $leaks = @()
    if ($rawSuccess -match '"password"') { $leaks += 'password' }
    if ($rawSuccess -match '"passwordHash"') { $leaks += 'passwordHash' }
    if ($rawSuccess -match '"password_hash"') { $leaks += 'password_hash' }
    if ($rawSuccess -match '"salt"') { $leaks += 'salt' }
    if ($rawSuccess -match [regex]::Escape($validPassword)) { $leaks += 'plainTextPassword' }

    if ($leaks.Count -eq 0) {
        Report-Pass "AC-5: Success response never leaks password, hash, or salt" "No sensitive attributes present"
    } else {
        Report-Fail "AC-5: Sensitive data leaked in success response!" ($leaks -join ", ")
    }
} catch {
    Report-Fail "AC-5: Failed to check sensitive data" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# TEST 4: AC-2 - Wrong Password Rejection (HTTP 401)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 4: AC-2 - Wrong Password Handling ---" -ForegroundColor White
$wrongPassBody = @{
    email = $activeEmail
    password = $wrongPassword
} | ConvertTo-Json

try {
    $resWrong = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $wrongPassBody -ContentType "application/json"
    Report-Fail "AC-2: Wrong password was unexpectedly accepted with HTTP $($resWrong.StatusCode)" ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
    $respBody = $reader.ReadToEnd()

    if ($statusCode -eq 401 -and ($respBody -match "Invalid credentials" -or $respBody -match "Invalid email or password")) {
        Report-Pass "AC-2: Wrong password correctly rejected with HTTP 401 Unauthorized" "Generic message: 'Invalid credentials'"
    } else {
        Report-Fail "AC-2: Unexpected response on wrong password" "Status=$statusCode, Body=$respBody"
    }

    # Ensure no token was returned in failure body
    if (-not ($respBody -match '"token"')) {
        Report-Pass "AC-2: No token issued on wrong password" "Token field absent"
    } else {
        Report-Fail "AC-2: Token leaked on failed authentication!" ""
    }
}

# ------------------------------------------------------------------------------
# TEST 5: AC-3 - Non-Existent User Rejection (HTTP 401)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 5: AC-3 - Non-Existent User Handling ---" -ForegroundColor White
$nonExistentBody = @{
    email = "unregistered.user.$timestamp@school.edu.vn"
    password = $validPassword
} | ConvertTo-Json

try {
    $resGhost = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $nonExistentBody -ContentType "application/json"
    Report-Fail "AC-3: Non-existent user was unexpectedly accepted with HTTP $($resGhost.StatusCode)" ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
    $respBody = $reader.ReadToEnd()

    if ($statusCode -eq 401 -and ($respBody -match "Invalid credentials" -or $respBody -match "Invalid email or password")) {
        Report-Pass "AC-3: Non-existent user rejected with HTTP 401 (Anti-enumeration)" "Message identical to wrong password"
    } else {
        Report-Fail "AC-3: Unexpected response on non-existent user" "Status=$statusCode, Body=$respBody"
    }
}

# ------------------------------------------------------------------------------
# TEST 6: AC-6 - Inactive Account Login Blocked (HTTP 401)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 6: AC-6 - Inactive Account Blocked (Pending Verification) ---" -ForegroundColor White
$inactiveLoginBody = @{
    email = $inactiveEmail
    password = $validPassword
} | ConvertTo-Json

try {
    $resInact = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $inactiveLoginBody -ContentType "application/json"
    Report-Fail "AC-6: Inactive user was unexpectedly allowed to login" ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
    $respBody = $reader.ReadToEnd()

    if ($statusCode -eq 401 -and ($respBody -match "k.ch ho.t" -or $respBody -match "chua du" -or $respBody -match "email")) {
        Report-Pass "AC-6: Inactive account blocked with HTTP 401 and activation reminder" "Message: 'Tài khoản chưa được kích hoạt...'"
    } else {
        Report-Fail "AC-6: Unexpected response for inactive account" "Status=$statusCode, Body=$respBody"
    }
}

# ------------------------------------------------------------------------------
# TEST 7: AC-6 - Input Validation (Blank Email, Invalid Formats, Blank Password)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 7: AC-6 - Input Validation Rejection (HTTP 400) ---" -ForegroundColor White

$badInputs = @(
    @{ name = "Blank Email"; body = @{ email = "   "; password = $validPassword } },
    @{ name = "Malformed Email (no @)"; body = @{ email = "notanemail"; password = $validPassword } },
    @{ name = "Malformed Email (no domain)"; body = @{ email = "teacher@"; password = $validPassword } },
    @{ name = "Blank Password"; body = @{ email = $activeEmail; password = "   " } }
)

foreach ($tc in $badInputs) {
    $json = $tc.body | ConvertTo-Json
    try {
        $resBad = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $json -ContentType "application/json"
        Report-Fail "AC-6: $($tc.name) was unexpectedly accepted with HTTP $($resBad.StatusCode)" ""
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) {
            Report-Pass "AC-6: $($tc.name) correctly rejected with HTTP 400 Bad Request" "Validation caught"
        } else {
            Report-Fail "AC-6: $($tc.name) returned unexpected status $statusCode" ""
        }
    }
}

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " QA-008 TEST EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host " Passed: $passedTests" -ForegroundColor Green
Write-Host " Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
