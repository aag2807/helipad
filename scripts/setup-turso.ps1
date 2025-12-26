# Turso Setup Script for Helipad (PowerShell)
# This script helps you set up Turso for Vercel deployment

Write-Host "Helipad - Turso Setup Script" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if turso CLI is installed
if (-not (Get-Command turso -ErrorAction SilentlyContinue)) {
    Write-Host "[X] Turso CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it first:" -ForegroundColor Yellow
    Write-Host "  irm get.tur.so/windows | iex" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "[OK] Turso CLI is installed" -ForegroundColor Green
Write-Host ""

# Check if user is authenticated
$authCheck = turso auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] You're not logged in to Turso" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please authenticate:" -ForegroundColor Yellow
    Write-Host "  turso auth signup  (for new users)" -ForegroundColor White
    Write-Host "  turso auth login   (for existing users)" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "[OK] Authenticated with Turso" -ForegroundColor Green
Write-Host ""

# Ask for database name
$dbName = Read-Host "Enter database name (default: helipad)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "helipad"
}

Write-Host ""
Write-Host "Creating database: $dbName" -ForegroundColor Cyan
turso db create $dbName

Write-Host ""
Write-Host "Database Information:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Get database URL
$dbUrl = turso db show $dbName --url
Write-Host "DATABASE_URL=$dbUrl" -ForegroundColor White
Write-Host ""

# Create auth token
Write-Host "Creating auth token..." -ForegroundColor Cyan
$dbToken = turso db tokens create $dbName
Write-Host "DATABASE_AUTH_TOKEN=$dbToken" -ForegroundColor White
Write-Host ""

# Save to .env.production.local
Write-Host "Saving to .env.production.local" -ForegroundColor Cyan
@"
# Turso Production Database
DATABASE_URL="$dbUrl"
DATABASE_AUTH_TOKEN="$dbToken"
"@ | Out-File -FilePath ".env.production.local" -Encoding UTF8

Write-Host "[OK] Configuration saved!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "===========" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add these environment variables to Vercel:" -ForegroundColor Yellow
Write-Host "   - Go to your Vercel project settings" -ForegroundColor White
Write-Host "   - Navigate to Environment Variables" -ForegroundColor White
Write-Host "   - Add DATABASE_URL and DATABASE_AUTH_TOKEN" -ForegroundColor White
Write-Host ""
Write-Host "2. Push your schema to Turso:" -ForegroundColor Yellow
Write-Host "   npm run db:push" -ForegroundColor White
Write-Host ""
Write-Host "3. (Optional) Seed your database:" -ForegroundColor Yellow
Write-Host "   npm run db:seed" -ForegroundColor White
Write-Host ""
Write-Host "4. Deploy to Vercel:" -ForegroundColor Yellow
Write-Host "   vercel deploy" -ForegroundColor White
Write-Host ""
Write-Host "[DONE] Your database is ready for Vercel deployment!" -ForegroundColor Green
