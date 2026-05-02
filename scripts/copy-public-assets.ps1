# Windows PowerShell script to copy public assets to .open-next/assets
# Run this script manually if npm script fails

Write-Host "Copying public folder assets to .open-next/assets..." -ForegroundColor Green

# Get paths
$projectDir = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $projectDir "public"
$targetDir = Join-Path $projectDir ".open-next" "assets"

# Create target directory if it doesn't exist
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir
    Write-Host "✓ Created .open-next/assets directory" -ForegroundColor Green
}

# Files to copy
$filesToCopy = @(
    "favicon.ico",
    "favicon.svg",
    "logo.svg",
    "manifest.json",
    "robots.txt",
    "sw.js"
)

$copied = 0
$skipped = 0

# Copy each file
foreach ($file in $filesToCopy) {
    $sourcePath = Join-Path $sourceDir $file
    $targetPath = Join-Path $targetDir $file

    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $targetPath -Force
        Write-Host "  ✓ Copied: $file" -ForegroundColor Green
        $copied++
    } else {
        Write-Host "  ✗ Skipped (not found): $file" -ForegroundColor Yellow
        $skipped++
    }
}

Write-Host "`n✓ Copied $copied file(s), $skipped skipped" -ForegroundColor Green
Write-Host "`nAssets are now in: $targetDir" -ForegroundColor Cyan
