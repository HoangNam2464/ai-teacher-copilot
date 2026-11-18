# ==============================================================================
# AI Teacher Copilot - QA-009 Live System E2E Test Script
# Ticket: [QA-009] Test JWT Route Protection & Token Expiration (ATC-29 / ATC-203)
# Tests against running Docker containers: atc-backend (8080) and atc-postgres (5432)
# Unified Test Location: scripts/qa/
# ==============================================================================

$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$activeEmail = "qa.jwt.active.$timestamp@school.edu.vn"
$deactEmail = "qa.jwt.deact.$timestamp@school.edu.vn"
$delEmail   = "qa.jwt.del.$timestamp@school.edu.vn"
$password   = "ValidPassword2026!"
$fullName   = "Co Giao QA JWT Protection"

# JWT Secret from .env / docker environment
$jwtSecret = "changeme_jwt_secret_at_least_32_characters_long_for_hmac256"

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

# Helper to build JWT tokens with custom claims, timestamps, and signing keys
function New-CustomJwt($headerObj, $payloadObj, $secret) {
    $headerJson = $headerObj | ConvertTo-Json -Compress
    $payloadJson = $payloadObj | ConvertTo-Json -Compress

    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerJson)
    $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payloadJson)

    $b64Header = [Convert]::ToBase64String($headerBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    $b64Payload = [Convert]::ToBase64String($payloadBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')

    $dataToSign = "$b64Header.$b64Payload"
    $secretBytes = [System.Text.Encoding]::UTF8.GetBytes($secret)
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = $secretBytes
    $signatureBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($dataToSign))
    $b64Sig = [Convert]::ToBase64String($signatureBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')

    return "$dataToSign.$b64Sig"
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

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " STARTING LIVE E2E TEST FOR [QA-009] JWT ROUTE PROTECTION" -ForegroundColor Cyan
Write-Host " Target Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host " Test Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: System Pre-flight & Account Preparation
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: Preparing Test Accounts ---" -ForegroundColor White

try {
    # 1. Register active user
    $regBody1 = @{ email = $activeEmail; password = $password; fullName = $fullName } | ConvertTo-Json
    $res0 = Send-ApiRequest "$baseUrl/auth/register" "POST" $null $regBody1
    if ($res0.StatusCode -ne 200 -and $res0.StatusCode -ne 201) { throw "Failed to register active user: $($res0.Content)" }
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$activeEmail';" | Out-Null

    # Login to acquire valid token
    $loginBody1 = @{ email = $activeEmail; password = $password } | ConvertTo-Json
    $resLogin1 = Send-ApiRequest "$baseUrl/auth/login" "POST" $null $loginBody1
    $loginData1 = $resLogin1.Content | ConvertFrom-Json
    $validToken = $loginData1.data.token
    Report-Pass "Setup: Active user registered, activated, and token obtained" "Token: $($validToken.Substring(0, 20))..."

    # 2. Register deactivated user & acquire token before deactivation
    $regBody2 = @{ email = $deactEmail; password = $password; fullName = "Thay Se Bi Khoa" } | ConvertTo-Json
    $null = Send-ApiRequest "$baseUrl/auth/register" "POST" $null $regBody2
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$deactEmail';" | Out-Null
    $loginBody2 = @{ email = $deactEmail; password = $password } | ConvertTo-Json
    $resLogin2 = Send-ApiRequest "$baseUrl/auth/login" "POST" $null $loginBody2
    $deactToken = ($resLogin2.Content | ConvertFrom-Json).data.token
    # Now deactivate in DB
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = false WHERE email = '$deactEmail';" | Out-Null
    Report-Pass "Setup: Deactivated user setup complete" "User active during token issue, now is_active = false"

    # 3. Register deleted user & acquire token before deletion
    $regBody3 = @{ email = $delEmail; password = $password; fullName = "Thay Se Bi Xoa" } | ConvertTo-Json
    $null = Send-ApiRequest "$baseUrl/auth/register" "POST" $null $regBody3
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$delEmail';" | Out-Null
    $loginBody3 = @{ email = $delEmail; password = $password } | ConvertTo-Json
    $resLogin3 = Send-ApiRequest "$baseUrl/auth/login" "POST" $null $loginBody3
    $deletedToken = ($resLogin3.Content | ConvertFrom-Json).data.token
    # Now hard-delete from DB
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "DELETE FROM users WHERE email = '$delEmail';" | Out-Null
    Report-Pass "Setup: Deleted user setup complete" "Token obtained, user row deleted from PostgreSQL"

} catch {
    Write-Host "Setup aborted due to error: $_" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# STEP 1: Positive Access Scenario
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Valid JWT Access ---" -ForegroundColor White

# TC-01: Valid JWT Token Access
$resTC01 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer $validToken" }
if ($resTC01.StatusCode -eq 200 -and ($resTC01.Content | ConvertFrom-Json).success -eq $true) {
    Report-Pass "TC-01: Valid JWT allows access to /api/workspaces" "HTTP 200 OK, success=true, workspaces retrieved"
} else {
    Report-Fail "TC-01: Valid JWT should return HTTP 200" "Got HTTP $($resTC01.StatusCode): $($resTC01.Content)"
}

# ------------------------------------------------------------------------------
# STEP 2: Missing or Incomplete Authorization Header
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: Missing or Incomplete Authorization Header ---" -ForegroundColor White

# TC-02: Missing Authorization Header
$resTC02 = Send-ApiRequest "$baseUrl/workspaces" "GET"
if ($resTC02.StatusCode -eq 401 -and ($resTC02.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-02: Missing Authorization header is rejected" "HTTP 401 Unauthorized, error=Unauthorized"
} else {
    Report-Fail "TC-02: Missing Authorization header should return HTTP 401" "Got HTTP $($resTC02.StatusCode): $($resTC02.Content)"
}

# TC-03: Empty Bearer Header
$resTC03 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer " }
if ($resTC03.StatusCode -eq 401 -and ($resTC03.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-03: Empty Bearer token is rejected" "HTTP 401 Unauthorized"
} else {
    Report-Fail "TC-03: Empty Bearer token should return HTTP 401" "Got HTTP $($resTC03.StatusCode)"
}

# TC-04: Non-Bearer Scheme (Basic Auth)
$resTC04 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Basic dXNlcjpwYXNz" }
if ($resTC04.StatusCode -eq 401 -and ($resTC04.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-04: Non-Bearer scheme (Basic) is rejected" "HTTP 401 Unauthorized"
} else {
    Report-Fail "TC-04: Non-Bearer scheme should return HTTP 401" "Got HTTP $($resTC04.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 3: Malformed & Tampered Tokens
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 3: Malformed & Tampered Tokens ---" -ForegroundColor White

# TC-05: Malformed Token String
$resTC05 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer malformed.token.string" }
if ($resTC05.StatusCode -eq 401 -and ($resTC05.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-05: Malformed token string is rejected" "HTTP 401 Unauthorized"
} else {
    Report-Fail "TC-05: Malformed token string should return HTTP 401" "Got HTTP $($resTC05.StatusCode)"
}

# TC-06: Tampered Payload
$tokenParts = $validToken.Split(".")
$tamperedToken = $tokenParts[0] + "." + $tokenParts[1] + "tampered" + "." + $tokenParts[2]
$resTC06 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer $tamperedToken" }
if ($resTC06.StatusCode -eq 401 -and ($resTC06.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-06: Tampered payload bytes are rejected" "HTTP 401 Unauthorized"
} else {
    Report-Fail "TC-06: Tampered payload should return HTTP 401" "Got HTTP $($resTC06.StatusCode)"
}

# TC-07: Forged Signature (Different Secret Key)
$nowSec = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$fakeHeader = @{ alg = "HS256"; typ = "JWT" }
$fakePayload = @{
    sub = "00000000-0000-0000-0000-000000000001"
    email = "hacker@evil.com"
    iat = $nowSec
    exp = $nowSec + 3600
}
$forgedToken = New-CustomJwt $fakeHeader $fakePayload "this_is_a_completely_fake_secret_key_32_chars!"
$resTC07 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer $forgedToken" }
if ($resTC07.StatusCode -eq 401 -and ($resTC07.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-07: Forged token signed with different key is rejected" "HTTP 401 Unauthorized"
} else {
    Report-Fail "TC-07: Forged token should return HTTP 401" "Got HTTP $($resTC07.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 4: Token Expiration
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 4: Token Expiration Handling ---" -ForegroundColor White

# TC-08: Expired JWT Token (Signed with genuine secret, but exp in the past)
$pastSec = $nowSec - 600 # 10 minutes ago
$expiredPayload = @{
    sub = "00000000-0000-0000-0000-000000000001"
    email = $activeEmail
    iat = $pastSec - 3600
    exp = $pastSec
}
$expiredToken = New-CustomJwt $fakeHeader $expiredPayload $jwtSecret
$resTC08 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer $expiredToken" }
if ($resTC08.StatusCode -eq 401 -and ($resTC08.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-08: Expired JWT token is rejected" "HTTP 401 Unauthorized, exp was in past"
} else {
    Report-Fail "TC-08: Expired token should return HTTP 401" "Got HTTP $($resTC08.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 5: Account State & User Lifecycle Boundary
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 5: User Lifecycle & Account State Boundary ---" -ForegroundColor White

# TC-09: Token for Deactivated User
$resTC09 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer $deactToken" }
if ($resTC09.StatusCode -eq 401 -and ($resTC09.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-09: Token for deactivated user (is_active = false) is rejected" "HTTP 401 Unauthorized"
} else {
    Report-Fail "TC-09: Deactivated user token should return HTTP 401" "Got HTTP $($resTC09.StatusCode)"
}

# TC-10: Token for Deleted / Non-Existent User
$resTC10 = Send-ApiRequest "$baseUrl/workspaces" "GET" @{ "Authorization" = "Bearer $deletedToken" }
if ($resTC10.StatusCode -eq 401 -and ($resTC10.Content | ConvertFrom-Json).error -eq "Unauthorized") {
    Report-Pass "TC-10: Token for deleted user is rejected" "HTTP 401 Unauthorized"
} else {
    Report-Fail "TC-10: Deleted user token should return HTTP 401" "Got HTTP $($resTC10.StatusCode)"
}

# ------------------------------------------------------------------------------
# STEP 6: Public Endpoints Accessibility
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 6: Public Endpoints Accessibility ---" -ForegroundColor White

# TC-11: Actuator Health Endpoint
$resTC11 = Send-ApiRequest "$baseUrl/actuator/health" "GET"
if ($resTC11.StatusCode -eq 200 -and ($resTC11.Content | ConvertFrom-Json).status -eq "UP") {
    Report-Pass "TC-11: Public endpoint /api/actuator/health accessible without token" "HTTP 200 OK, status=UP"
} else {
    Report-Fail "TC-11: /api/actuator/health should return HTTP 200" "Got HTTP $($resTC11.StatusCode)"
}

# TC-12: Auth Login Endpoint (Permitted by route guard)
$badLogin = @{ email = "nobody@school.edu.vn"; password = "password" } | ConvertTo-Json
$resTC12 = Send-ApiRequest "$baseUrl/auth/login" "POST" $null $badLogin
if ($resTC12.StatusCode -eq 401 -and ($resTC12.Content | ConvertFrom-Json).message -eq "Invalid credentials") {
    Report-Pass "TC-12: Public endpoint /api/auth/login is accessible without JWT" "Reached auth logic, returned 401 Invalid credentials"
} else {
    Report-Fail "TC-12: /api/auth/login should reach auth logic" "Got HTTP $($resTC12.StatusCode): $($resTC12.Content)"
}

# TC-13: Auth Register Endpoint (Permitted by route guard)
$resTC13 = Send-ApiRequest "$baseUrl/auth/register" "POST" $null "{}"
if ($resTC13.StatusCode -eq 400) {
    Report-Pass "TC-13: Public endpoint /api/auth/register is accessible without JWT" "Reached validation logic, returned 400 Bad Request"
} else {
    Report-Fail "TC-13: /api/auth/register should reach validation logic" "Got HTTP $($resTC13.StatusCode)"
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " QA-009 LIVE E2E TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host " Total Passed: $passedTests" -ForegroundColor Green
Write-Host " Total Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host " Overall Status: $(if ($failedTests -eq 0) { "ALL TESTS PASSED (100%)" } else { "SOME TESTS FAILED" })" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
}
