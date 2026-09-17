# ==============================================================================
# AI Teacher Copilot - Settings & Profile Live System E2E Test Script
# Tests all Settings features: Profile (K-12), Notifications, Plan, Password, Account Deletion
# Target: atc-backend (8080) and atc-postgres (5432)
# Location: scripts/qa/test_qa_settings_e2e.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$baseUrl = "http://localhost:8080/api"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$testEmail = "qa.settings.$timestamp@school.edu.vn"
$initPassword = "InitialPassword2026!"
$newPassword = "UpdatedPassword2026!"
$fullName = "Thay Giao Vien K12"

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
Write-Host " STARTING LIVE E2E TEST FOR USER SETTINGS & PROFILE" -ForegroundColor Cyan
Write-Host " Target Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host " Test Email:      $testEmail" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 0: Register & Activate User
# ------------------------------------------------------------------------------
Write-Host "--- STEP 0: User Registration & Activation ---" -ForegroundColor White

try {
    $regBody = @{
        email = $testEmail
        password = $initPassword
        fullName = $fullName
    } | ConvertTo-Json
    $resReg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($regBody)) -ContentType "application/json; charset=utf-8"
    
    # Activate user directly in DB
    docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -c "UPDATE users SET is_active = true WHERE email = '$testEmail';" | Out-Null
    Report-Pass "User Registration & Activation" "Email: $testEmail, is_active=true"
} catch {
    Report-Fail "User Registration" $_.Exception.Message
    exit 1
}

# ------------------------------------------------------------------------------
# STEP 1: Login to acquire JWT Token
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: Login & Token Acquisition ---" -ForegroundColor White

$token = $null
try {
    $loginBody = @{
        email = $testEmail
        password = $initPassword
    } | ConvertTo-Json
    $resLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($loginBody)) -ContentType "application/json; charset=utf-8"
    
    $token = $resLogin.data.token
    if ($token) {
        Report-Pass "Login successful" "Acquired JWT Bearer token"
    } else {
        Report-Fail "Login failed" "No token in response"
        exit 1
    }
} catch {
    Report-Fail "Login Exception" $_.Exception.Message
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json; charset=utf-8"
}

# ------------------------------------------------------------------------------
# STEP 2: GET /api/users/me (Current Profile)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: Fetch Current Profile (GET /api/users/me) ---" -ForegroundColor White

try {
    $resProfile = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Get -Headers $headers
    $data = $resProfile.data
    if ($data.email -eq $testEmail -and $data.fullName -eq $fullName) {
        Report-Pass "GET /api/users/me" "Returned expected email ($($data.email)) and fullName ($($data.fullName))"
    } else {
        Report-Fail "GET /api/users/me mismatch" "Received: $($data | ConvertTo-Json -Compress)"
    }
} catch {
    Report-Fail "GET /api/users/me failed" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# STEP 3: PUT /api/users/me (Update K-12 Profile & Subjects)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 3: Update K-12 Profile & Subjects (PUT /api/users/me) ---" -ForegroundColor White

$updatedName = "Thay Nguyen Van A (THPT)"
$updatedLevel = "high_school"
$updatedSubjects = '["Toan hoc","Vat ly","Tin hoc"]'
$avatarUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

try {
    $updateBody = @{
        fullName = $updatedName
        avatarUrl = $avatarUrl
        educationLevel = $updatedLevel
        subjects = $updatedSubjects
    } | ConvertTo-Json

    $resUpdate = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Put -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($updateBody))
    $data = $resUpdate.data

    if ($data.fullName -eq $updatedName -and $data.educationLevel -eq "high_school") {
        Report-Pass "PUT /api/users/me" "Updated fullName to '$updatedName' and educationLevel to '$updatedLevel'"
    } else {
        Report-Fail "PUT /api/users/me unexpected response" ($data | ConvertTo-Json -Compress)
    }

    # Verify persistence via fresh GET
    $verifyProfile = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Get -Headers $headers
    if ($verifyProfile.data.subjects -eq $updatedSubjects -and $verifyProfile.data.educationLevel -eq "high_school") {
        Report-Pass "Profile persistence verified via GET" "Subjects: $($verifyProfile.data.subjects), Level: $($verifyProfile.data.educationLevel)"
    } else {
        Report-Fail "Profile persistence check failed" ($verifyProfile.data | ConvertTo-Json -Compress)
    }
} catch {
    Report-Fail "PUT /api/users/me failed" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# STEP 4: PUT /api/users/me/notifications (Notification Preferences)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 4: Update Notification Preferences (PUT /api/users/me/notifications) ---" -ForegroundColor White

$prefsJson = '{"enabled":true,"documentProcessing":false,"securityAlerts":true,"productUpdates":true}'

try {
    $notifBody = @{
        notificationPreferences = $prefsJson
    } | ConvertTo-Json

    $resNotif = Invoke-RestMethod -Uri "$baseUrl/users/me/notifications" -Method Put -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($notifBody))
    $data = $resNotif.data

    if ($data.notificationPreferences -eq $prefsJson) {
        Report-Pass "PUT /api/users/me/notifications" "Saved preferences JSON successfully"
    } else {
        Report-Fail "PUT /api/users/me/notifications mismatch" ($data | ConvertTo-Json -Compress)
    }
} catch {
    Report-Fail "PUT /api/users/me/notifications failed" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# STEP 5: PUT /api/users/me/plan (Subscription Tier Update)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 5: Update Subscription Plan (PUT /api/users/me/plan) ---" -ForegroundColor White

try {
    # Upgrade to PRO
    $planBody = @{ plan = "PRO" } | ConvertTo-Json
    $resPlan = Invoke-RestMethod -Uri "$baseUrl/users/me/plan" -Method Put -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($planBody))
    if ($resPlan.data.plan -eq "PRO") {
        Report-Pass "PUT /api/users/me/plan (Upgrade to PRO)" "Plan updated to PRO"
    } else {
        Report-Fail "Plan upgrade mismatch" ($resPlan.data | ConvertTo-Json -Compress)
    }

    # Downgrade to FREE
    $freeBody = @{ plan = "FREE" } | ConvertTo-Json
    $resFree = Invoke-RestMethod -Uri "$baseUrl/users/me/plan" -Method Put -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($freeBody))
    if ($resFree.data.plan -eq "FREE") {
        Report-Pass "PUT /api/users/me/plan (Downgrade to FREE)" "Plan updated to FREE"
    } else {
        Report-Fail "Plan downgrade mismatch" ($resFree.data | ConvertTo-Json -Compress)
    }
} catch {
    Report-Fail "PUT /api/users/me/plan failed" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# STEP 6: PUT /api/users/me/password (Change Password)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 6: Change Password (PUT /api/users/me/password) ---" -ForegroundColor White

# 6.1 Test incorrect old password -> should fail
try {
    $badPassBody = @{
        oldPassword = "IncorrectPassword999!"
        newPassword = $newPassword
    } | ConvertTo-Json
    $resBad = Invoke-RestMethod -Uri "$baseUrl/users/me/password" -Method Put -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($badPassBody))
    Report-Fail "Incorrect password should return error" "Instead got HTTP 200"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Report-Pass "Incorrect password rejected with 400 Bad Request" "Security validation passed"
    } else {
        Report-Fail "Unexpected status code for wrong password" "$($_.Exception.Response.StatusCode)"
    }
}

# 6.2 Test valid old password -> should succeed
try {
    $goodPassBody = @{
        oldPassword = $initPassword
        newPassword = $newPassword
    } | ConvertTo-Json
    $resGood = Invoke-RestMethod -Uri "$baseUrl/users/me/password" -Method Put -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($goodPassBody))
    Report-Pass "Valid password change" "Password updated successfully"

    # Verify old password no longer works
    try {
        $oldLoginBody = @{ email = $testEmail; password = $initPassword } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($oldLoginBody)) -ContentType "application/json; charset=utf-8"
        Report-Fail "Old password should not work" "Login with old password succeeded unexpectedly"
    } catch {
        Report-Pass "Old password invalidated" "Login with old password returned error as expected"
    }

    # Verify new password works
    $newLoginBody = @{ email = $testEmail; password = $newPassword } | ConvertTo-Json
    $resNewLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($newLoginBody)) -ContentType "application/json; charset=utf-8"
    $token = $resNewLogin.data.token
    $headers["Authorization"] = "Bearer $token"
    Report-Pass "Login with new password succeeded" "Acquired new JWT token"
} catch {
    Report-Fail "Password change flow failed" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# STEP 7: DELETE /api/users/me (Delete Account)
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 7: Delete Account (DELETE /api/users/me) ---" -ForegroundColor White

try {
    $resDelete = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Delete -Headers $headers
    Report-Pass "DELETE /api/users/me" "Account deletion request returned 200 OK"

    # Verify user cannot login anymore
    try {
        $deletedLoginBody = @{ email = $testEmail; password = $newPassword } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($deletedLoginBody)) -ContentType "application/json; charset=utf-8"
        Report-Fail "Deleted user should not be able to login" "Login succeeded for deleted user"
    } catch {
        Report-Pass "Deleted user login blocked" "Login rejected for deleted account"
    }

    # Verify user record removed from PostgreSQL
    $dbOutput = docker exec atc-postgres psql -U aiteacher -d aiteachercopilot -t -A -c "SELECT COUNT(*) FROM users WHERE email = '$testEmail';"
    $count = [int]($dbOutput | Out-String).Trim()
    if ($count -eq 0) {
        Report-Pass "Database record purged" "User count in DB for $testEmail is 0"
    } else {
        Report-Fail "User still exists in DB" "Count: $count"
    }
} catch {
    Report-Fail "DELETE /api/users/me failed" $_.Exception.Message
}

# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " E2E TEST SUMMARY: USER SETTINGS & K-12 PROFILE" -ForegroundColor Cyan
Write-Host " Total Passed: $passedTests" -ForegroundColor Green
Write-Host " Total Failed: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Green" })
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
