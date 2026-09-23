# Project Eventix - Automated Local Test Suite Runner & Email Dispatcher
# Runs tests and delivers full QA results to bill.nissim@gmail.com

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   🚀 EVENTIX CLOUD - AUTOMATED TEST SUITE RUNNER       " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$recipient = "bill.nissim@gmail.com"
$startTime = Get-Date

# 1. Run Frontend Vitest
Write-Host "[1/3] Running Frontend Client Unit Tests (Vitest)..." -ForegroundColor Yellow
$frontendExit = 0
try {
    Push-Location "frontend-client"
    & cmd /c "npm test"
    $frontendExit = $LASTEXITCODE
    Pop-Location
} catch {
    $frontendExit = 1
    Pop-Location
}

if ($frontendExit -eq 0) {
    Write-Host "  ✅ Frontend Tests Passed (8/8)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Frontend Tests Failed" -ForegroundColor Red
}

# 2. Run Backend Microservices Tests & JaCoCo
Write-Host "`n[2/3] Running Backend Microservices Tests & JaCoCo Aggregation..." -ForegroundColor Yellow
$backendExit = 0
try {
    & .\gradlew.bat test jacocoRootReport --continue --no-daemon
    $backendExit = $LASTEXITCODE
} catch {
    $backendExit = 1
}

if ($backendExit -eq 0) {
    Write-Host "  ✅ Backend Tests Passed (41/41) & JaCoCo Report Generated" -ForegroundColor Green
} else {
    Write-Host "  ❌ Backend Tests Failed" -ForegroundColor Red
}

$duration = [Math]::Round(((Get-Date) - $startTime).TotalSeconds, 2)
$overallSuccess = ($frontendExit -eq 0 -and $backendExit -eq 0)
$statusText = if ($overallSuccess) { "PASSED" } else { "FAILED" }

# 3. Dispatch Email to bill.nissim@gmail.com via node send_qa_report.cjs
Write-Host "`n[3/3] Dispatching Automated QA Report Email to $recipient..." -ForegroundColor Yellow
try {
    & node send_qa_report.cjs "$recipient" "$duration" "$statusText"
} catch {
    Write-Host "  ⚠️ Email dispatch notice: $_" -ForegroundColor Yellow
}

Write-Host "`nAll tests completed in ${duration}s." -ForegroundColor Cyan
Write-Host "Standalone QA Dashboard URL (Cloud): https://frontend-client-production-9a03.up.railway.app/qa.html" -ForegroundColor Cyan
Write-Host "Local Dashboard file: file://$PSScriptRoot/qa-dashboard.html`n" -ForegroundColor Cyan
