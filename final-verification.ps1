$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
$WorkspaceRoot = $PSScriptRoot
$check = [char]0x2705

Write-Host "========== FINAL VERIFICATION - PORTAL NEGERI ==========" -ForegroundColor Cyan
Write-Host ""

$scanFiles = Get-ChildItem -Path $WorkspaceRoot -Recurse -Include "*.html", "*.css", "*.json", "*.md", "*.toml" -File |
    Where-Object {
        $_.FullName -notlike "*\node_modules\*" -and
        $_.FullName -notlike "*\.git\*" -and
        $_.Name -notmatch '\.bak(\.|$)'
    }

$htmlFiles = $scanFiles | Where-Object { $_.Extension -eq '.html' }
$cssFiles = $scanFiles | Where-Object { $_.Extension -eq '.css' }

Write-Host "1. Checking old branding strings..." -ForegroundColor Yellow
$oldBrandPatterns = @('Warta Janten', 'wartajanten', 'WartaJanten')
$oldBrandHits = foreach ($pattern in $oldBrandPatterns) {
    $scanFiles | Select-String -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
}

if ($oldBrandHits) {
    Write-Host "   Found $($oldBrandHits.Count) old-brand reference(s)." -ForegroundColor Yellow
} else {
    Write-Host ("   " + $check + " No exact old-brand strings found.") -ForegroundColor Green
}

Write-Host "2. Checking logo.png references..." -ForegroundColor Yellow
$logoHits = $scanFiles | Select-String -Pattern 'logo\.png' -ErrorAction SilentlyContinue
if ($logoHits) {
    Write-Host "   Found $($logoHits.Count) logo.png reference(s)." -ForegroundColor Yellow
} else {
    Write-Host ("   " + $check + " No logo.png references found.") -ForegroundColor Green
}

Write-Host "3. Checking required theme colors..." -ForegroundColor Yellow
$requiredColors = @('#15803D', '#052E16', '#1F5F7F')
$colorsFound = 0
foreach ($color in $requiredColors) {
    $hits = $cssFiles | Select-String -Pattern ([regex]::Escape($color)) -ErrorAction SilentlyContinue
    if ($hits) {
        $colorsFound++
        Write-Host ("   " + $check + " Found $color") -ForegroundColor Green
    } else {
        Write-Host "   Missing $color" -ForegroundColor Yellow
    }
}

Write-Host "4. Checking Portal Negeri branding presence..." -ForegroundColor Yellow
$newBrandHits = $htmlFiles | Select-String -Pattern 'Portal Negeri|portalnegeri@gmail\.com|portalnegeri' -ErrorAction SilentlyContinue
if ($newBrandHits) {
    Write-Host ("   " + $check + " Found Portal Negeri branding in $($newBrandHits.Count) place(s).") -ForegroundColor Green
} else {
    Write-Host "   Missing Portal Negeri branding." -ForegroundColor Yellow
}

Write-Host "5. Checking package metadata..." -ForegroundColor Yellow
$packageOk = 0
foreach ($pkg in Get-ChildItem -Path $WorkspaceRoot -Recurse -Include 'package.json', 'package-lock.json' -File | Where-Object { $_.FullName -notlike '*\node_modules\*' }) {
    $content = Get-Content -Path $pkg.FullName -Raw -Encoding UTF8
    if ($content -match '"name"\s*:\s*"portalnegeri' -or $content -match '"name"\s*:\s*"portalnegeri-article-generator') {
        $packageOk++
    }
}
Write-Host ("   " + $check + " Package files with Portal Negeri metadata: $packageOk") -ForegroundColor Green

Write-Host ""
Write-Host "========== SUMMARY ==========" -ForegroundColor Cyan
Write-Host "Files checked: $($scanFiles.Count)"
Write-Host "Old brand hits: $(@($oldBrandHits).Count)"
Write-Host "logo.png hits: $(@($logoHits).Count)"
Write-Host "Theme colors found: $colorsFound/3"

if ((@($oldBrandHits).Count -eq 0) -and (@($logoHits).Count -eq 0) -and ($colorsFound -eq 3)) {
    Write-Host ("Rebrand Portal Negeri selesai " + $check) -ForegroundColor Green
} else {
    Write-Host "Verification completed with warnings. Review the summary above." -ForegroundColor Yellow
}
