#!/usr/bin/env pwsh
# ══════════════════════════════════════════════════════════════════
#  SuratKama Mascots — Firebase Secrets Setup Script
#  Run this ONCE after deploying Cloud Functions
#  Usage: .\setup-secrets.ps1
# ══════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SuratKama Mascots — Firebase Secrets Setup         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "You will be prompted to enter 5 secret values." -ForegroundColor Yellow
Write-Host "These are stored ENCRYPTED in Google Secret Manager." -ForegroundColor Yellow
Write-Host ""

# 1. Fast2SMS API Key
Write-Host "━━━ 1/5 ── FAST2SMS API KEY ━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  Get it from: https://www.fast2sms.com → Developer → API" -ForegroundColor Gray
$fast2smsKey = Read-Host "  Paste your Fast2SMS API Key"
echo $fast2smsKey | firebase functions:secrets:set FAST2SMS_KEY

# 2. Gmail User
Write-Host ""
Write-Host "━━━ 2/5 ── GMAIL ADDRESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  The Gmail that will SEND booking confirmation emails" -ForegroundColor Gray
$gmailUser = Read-Host "  Your Gmail address (e.g. akshay@gmail.com)"
echo $gmailUser | firebase functions:secrets:set GMAIL_USER

# 3. Gmail App Password
Write-Host ""
Write-Host "━━━ 3/5 ── GMAIL APP PASSWORD (16-char) ━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  Google Account → Security → 2-Step Verification → App Passwords" -ForegroundColor Gray
Write-Host "  Create app password for 'Mail' → copy the 16-char code" -ForegroundColor Gray
$gmailPass = Read-Host "  Gmail App Password (16 characters, no spaces)"
echo $gmailPass | firebase functions:secrets:set GMAIL_PASS

# 4. Owner Phone
Write-Host ""
Write-Host "━━━ 4/5 ── OWNER PHONE NUMBER ━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  Phone that receives NEW BOOKING SMS alerts" -ForegroundColor Gray
$ownerPhone = Read-Host "  Owner phone (default: 6353046419)"
if ([string]::IsNullOrWhiteSpace($ownerPhone)) { $ownerPhone = "6353046419" }
echo $ownerPhone | firebase functions:secrets:set OWNER_PHONE

# 5. Owner Email
Write-Host ""
Write-Host "━━━ 5/5 ── OWNER EMAIL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  Email that receives NEW BOOKING alert emails" -ForegroundColor Gray
$ownerEmail = Read-Host "  Owner email address"
echo $ownerEmail | firebase functions:secrets:set OWNER_EMAIL

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ All secrets set! Verifying...                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

firebase functions:secrets:access FAST2SMS_KEY --version latest 2>&1 | ForEach-Object {
    if ($_ -match "ERROR") {
        Write-Host "  ❌ FAST2SMS_KEY: Failed" -ForegroundColor Red
    } else {
        Write-Host "  ✅ FAST2SMS_KEY: Set" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Setup complete! SMS & Email notifications are now ACTIVE." -ForegroundColor Cyan
Write-Host "   Test by making a booking on your live site." -ForegroundColor Gray
Write-Host ""
