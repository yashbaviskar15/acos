# Aravanta Cloud OS CLI — Windows 1-Line Installer
# Usage: irm https://aravantacos.vercel.app/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host "`n=== ARAVANTA CLOUD OS CLI INSTALLER ===" -ForegroundColor Cyan
Write-Host "Setting up native Aravanta Cloud CLI for Windows...`n" -ForegroundColor DarkGray

# 1. Check for Python
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py -3"
}

if (-not $pythonCmd) {
    Write-Warning "Python 3 is required but was not found on your PATH."
    Write-Host "Please install Python from https://python.org or run:" -ForegroundColor Yellow
    Write-Host "  winget install Python.Python.3.11" -ForegroundColor Green
    Exit 1
}

# 2. Setup destination directories
$binDir = Join-Path $env:USERPROFILE ".aravanta\bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$aravantaPy = Join-Path $binDir "aravanta.py"
$aravantaCmd = Join-Path $binDir "aravanta.cmd"
$aravantaPs1 = Join-Path $binDir "aravanta.ps1"

# 3. Download standalone CLI script
$cliUrl = "https://raw.githubusercontent.com/yashbaviskar15/acos/main/cli/aravanta.py"
Write-Host "Downloading Aravanta CLI from source..." -ForegroundColor Gray

try {
    Invoke-WebRequest -Uri $cliUrl -OutFile $aravantaPy -UseBasicParsing
} catch {
    Write-Error "Failed to download CLI script: $_"
    Exit 1
}

# 4. Generate Windows CMD shim
$cmdContent = @"
@echo off
$pythonCmd "%~dp0aravanta.py" %*
"@
[System.IO.File]::WriteAllText($aravantaCmd, $cmdContent)

# 5. Generate PowerShell shim
$psContent = @"
& $pythonCmd "`$PSScriptRoot\aravanta.py" `$args
"@
[System.IO.File]::WriteAllText($aravantaPs1, $psContent)

# 6. Add to User PATH if not present
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$binDir*") {
    $newPath = "$binDir;$userPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "Added $binDir to User PATH." -ForegroundColor Green
}

# Also update current session PATH
if ($env:PATH -notlike "*$binDir*") {
    $env:PATH = "$binDir;$env:PATH"
}

Write-Host "`n[SUCCESS] Aravanta CLI installed successfully!" -ForegroundColor Green
Write-Host "Executable location: $binDir\aravanta.cmd" -ForegroundColor DarkGray
Write-Host "`nVerify from any terminal or directory:" -ForegroundColor Cyan
Write-Host "  aravanta --version" -ForegroundColor White
Write-Host "  aravanta status" -ForegroundColor White
Write-Host "  aravanta auth login --email your-email@example.com`n" -ForegroundColor White
