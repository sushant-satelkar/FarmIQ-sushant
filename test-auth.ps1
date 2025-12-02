# PowerShell script to test authentication flow completely
# Test registration, login, cookie capture, and API calls

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FARMIQ AUTHENTICATION & API TEST SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Register a new test user
Write-Host "STEP 1: Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    role = 'farmer'
    full_name = 'Test Farmer'
    email = 'testfarmer@example.com'
    phone = '9999999999'
    password = 'test123'
    language_pref = 'en'
} | ConvertTo-Json

try {
    $regResponse = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/register' `
        -Method POST `
        -Body $registerBody `
        -ContentType 'application/json'
    Write-Host "[SUCCESS] Registration: $($regResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Registration failed (user may already exist): $($_.Exception.Message)" -ForegroundColor Magenta
}

# Step 2: Login and capture session cookie
Write-Host "`nSTEP 2: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    role = 'farmer'
    email = 'testfarmer@example.com'
    password = 'test123'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' `
        -Method POST `
        -Body $loginBody `
        -ContentType 'application/json' `
        -SessionVariable websession
    
    Write-Host "[SUCCESS] Login Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body: $($loginResponse.Content)" -ForegroundColor White
    
    # Check for Set-Cookie header
    if ($loginResponse.Headers['Set-Cookie']) {
        Write-Host "`n[SUCCESS] Set-Cookie Header Found!" -ForegroundColor Green
        Write-Host "Set-Cookie: $($loginResponse.Headers['Set-Cookie'])" -ForegroundColor White
    } else {
        Write-Host "`n[WARNING] No Set-Cookie header in response!" -ForegroundColor Red
    }
    
    # Check cookies in session
    $cookies = $websession.Cookies.GetCookies('http://localhost:3001')
    if ($cookies.Count -gt 0) {
        Write-Host "`n[SUCCESS] Cookies stored in session:" -ForegroundColor Green
        foreach ($cookie in $cookies) {
            Write-Host "  Name: $($cookie.Name), Value: $($cookie.Value)" -ForegroundColor White
        }
    } else {
        Write-Host "`n[ERROR] No cookies in session! Authentication will fail." -ForegroundColor Red
    }
    
} catch {
    Write-Host "[ERROR] Login failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Exit 1
}

# Step 3: Test GET /api/ngo-schemes with session
Write-Host "`n`nSTEP 3: Testing GET /api/ngo-schemes..." -ForegroundColor Yellow
try {
    $ngoResponse = Invoke-WebRequest -Uri 'http://localhost:3001/api/ngo-schemes' `
        -Method GET `
        -WebSession $websession
    
    Write-Host "[SUCCESS] NGO Schemes Status: $($ngoResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($ngoResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "[ERROR] NGO Schemes request failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host "Response: $($reader.ReadToEnd())" -ForegroundColor Red
}

# Step 4: Test GET /api/soil-labs with session
Write-Host "`n`nSTEP 4: Testing GET /api/soil-labs..." -ForegroundColor Yellow
try {
    $soilResponse = Invoke-WebRequest -Uri 'http://localhost:3001/api/soil-labs' `
        -Method GET `
        -WebSession $websession
    
    Write-Host "[SUCCESS] Soil Labs Status: $($soilResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($soilResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "[ERROR] Soil Labs request failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host "Response: $($reader.ReadToEnd())" -ForegroundColor Red
}

# Step 5: Test POST /api/crops with session
Write-Host "`n`nSTEP 5: Testing POST /api/crops..." -ForegroundColor Yellow
$cropBody = @{
    crop_name = 'Test Wheat'
    crop_price = 1500
    selling_price = 1800
    crop_produced_kg = 2500
} | ConvertTo-Json

try {
    $cropResponse = Invoke-WebRequest -Uri 'http://localhost:3001/api/crops' `
        -Method POST `
        -Body $cropBody `
        -ContentType 'application/json' `
        -WebSession $websession
    
    Write-Host "[SUCCESS] Create Crop Status: $($cropResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($cropResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "[ERROR] Create Crop request failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host "Response: $($reader.ReadToEnd())" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
