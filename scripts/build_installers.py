"""
Build self-contained, offline-resilient installers for Windows (install.ps1) and macOS/Linux (install.sh).
Embeds the standalone aravanta.py script as base64 fallback payload so installation never fails
even if network/ISP blocks raw.githubusercontent.com or GitHub is unreachable.
"""
import base64
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CLI_PY = REPO_ROOT / "cli" / "aravanta.py"

with open(CLI_PY, "rb") as f:
    cli_bytes = f.read()

cli_b64 = base64.b64encode(cli_bytes).decode("ascii")

# 1. Windows install.ps1 template
ps1_template = f'''# Aravanta Cloud OS CLI — Windows 1-Line Installer
# Supported Invocation:
#   irm https://aravantacos.vercel.app/install.ps1 | iex
#   curl.exe -fsSL https://aravantacos.vercel.app/install.ps1 | iex

$ErrorActionPreference = "Stop"

# Ensure TLS 1.2+ in Windows PowerShell 5.1
try {{
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
}} catch {{
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}}
$ProgressPreference = 'SilentlyContinue'

Write-Host "`n=== ARAVANTA CLOUD OS CLI INSTALLER ===" -ForegroundColor Cyan
Write-Host "Setting up native Aravanta Cloud CLI for Windows...`n" -ForegroundColor DarkGray

# 1. Check for Python
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {{
    $pythonCmd = "python"
}} elseif (Get-Command py -ErrorAction SilentlyContinue) {{
    $pythonCmd = "py -3"
}}

if (-not $pythonCmd) {{
    Write-Warning "Python 3 is required but was not found on your PATH."
    Write-Host "Please install Python from https://python.org or run:" -ForegroundColor Yellow
    Write-Host "  winget install Python.Python.3.11" -ForegroundColor Green
    Exit 1
}}

# 2. Setup destination directories
$binDir = Join-Path $env:USERPROFILE ".aravanta\\bin"
if (-not (Test-Path $binDir)) {{
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}}

$aravantaPy = Join-Path $binDir "aravanta.py"
$aravantaCmd = Join-Path $binDir "aravanta.cmd"
$aravantaPs1 = Join-Path $binDir "aravanta.ps1"

# 3. Unpack CLI engine
$downloaded = $false
$sources = @(
    "https://aravantacos.vercel.app/aravanta.py",
    "https://raw.githubusercontent.com/yashbaviskar15/acos/main/cli/aravanta.py"
)

if (Get-Command curl.exe -ErrorAction SilentlyContinue) {{
    foreach ($url in $sources) {{
        try {{
            $null = & curl.exe -fsSL --connect-timeout 3 "$url" -o "$aravantaPy" 2>$null
            if ($LASTEXITCODE -eq 0 -and (Test-Path $aravantaPy) -and (Get-Item $aravantaPy).Length -gt 1000) {{
                $downloaded = $true
                break
            }}
        }} catch {{}}
    }}
}}

if (-not $downloaded) {{
    foreach ($url in $sources) {{
        try {{
            (New-Object System.Net.WebClient).DownloadFile($url, $aravantaPy)
            if ((Test-Path $aravantaPy) -and (Get-Item $aravantaPy).Length -gt 1000) {{
                $downloaded = $true
                break
            }}
        }} catch {{
            try {{
                Invoke-WebRequest -Uri $url -OutFile $aravantaPy -UseBasicParsing -TimeoutSec 4
                if ((Test-Path $aravantaPy) -and (Get-Item $aravantaPy).Length -gt 1000) {{
                    $downloaded = $true
                    break
                }}
            }} catch {{}}
        }}
    }}
}}

# Fallback to embedded payload if network is restricted
if (-not $downloaded) {{
    Write-Host "Unpacking self-contained Aravanta CLI engine..." -ForegroundColor Gray
    $b64Payload = "{cli_b64}"
    $bytes = [System.Convert]::FromBase64String($b64Payload)
    [System.IO.File]::WriteAllBytes($aravantaPy, $bytes)
}}

# 4. Generate Windows CMD shim
$cmdContent = @"
@echo off
$pythonCmd "%~dp0aravanta.py" %*
"@
[System.IO.File]::WriteAllText($aravantaCmd, $cmdContent)

# 5. Generate PowerShell shim
$psContent = @"
& $pythonCmd "`$PSScriptRoot\\aravanta.py" `$args
"@
[System.IO.File]::WriteAllText($aravantaPs1, $psContent)

# 6. Add to User PATH if not present
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$binDir*") {{
    $newPath = "$binDir;$userPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "Added $binDir to User PATH." -ForegroundColor Green
}}

# Also update current session PATH
if ($env:PATH -notlike "*$binDir*") {{
    $env:PATH = "$binDir;$env:PATH"
}}

Write-Host "`n[SUCCESS] Aravanta CLI installed successfully!" -ForegroundColor Green
Write-Host "Executable location: $binDir\\aravanta.cmd" -ForegroundColor DarkGray
Write-Host "`nVerify from any terminal or directory:" -ForegroundColor Cyan
Write-Host "  aravanta --version" -ForegroundColor White
Write-Host "  aravanta status" -ForegroundColor White
Write-Host "  aravanta auth login --email your-email@example.com`n" -ForegroundColor White
'''

# 2. POSIX install.sh template
sh_template = f'''#!/usr/bin/env bash
set -e

# Aravanta Cloud OS CLI — macOS & Linux 1-Line Installer
# Usage: curl -fsSL https://aravantacos.vercel.app/install.sh | bash

echo ""
echo "=== ARAVANTA CLOUD OS CLI INSTALLER ==="
echo "Setting up native Aravanta Cloud CLI for macOS/Linux..."
echo ""

# Check python3
if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required but not installed." >&2
  echo "Please install Python 3 using your package manager (e.g. brew install python3, apt install python3)" >&2
  exit 1
fi

BIN_DIR="$HOME/.aravanta/bin"
mkdir -p "$BIN_DIR"
TARGET="$BIN_DIR/aravanta"

echo "Setting up Aravanta CLI engine..."

DOWNLOADED=0
for URL in "https://aravantacos.vercel.app/aravanta.py" "https://raw.githubusercontent.com/yashbaviskar15/acos/main/cli/aravanta.py"; do
  if command -v curl >/dev/null 2>&1; then
    if curl -fsSL --connect-timeout 4 "$URL" -o "$TARGET" 2>/dev/null; then
      if [ -s "$TARGET" ]; then
        DOWNLOADED=1
        break
      fi
    fi
  elif command -v wget >/dev/null 2>&1; then
    if wget -q --timeout=4 "$URL" -O "$TARGET" 2>/dev/null; then
      if [ -s "$TARGET" ]; then
        DOWNLOADED=1
        break
      fi
    fi
  fi
done

if [ "$DOWNLOADED" -eq 0 ]; then
  echo "Extracting self-contained CLI payload..."
  cat << 'EOF_B64' | base64 -d > "$TARGET"
{cli_b64}
EOF_B64
fi

chmod +x "$TARGET"

# Check if ~/.aravanta/bin is in PATH
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    SHELL_PROFILE=""
    if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
      SHELL_PROFILE="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
      SHELL_PROFILE="$HOME/.bashrc"
    else
      SHELL_PROFILE="$HOME/.profile"
    fi

    if [ -f "$SHELL_PROFILE" ]; then
      if ! grep -q ".aravanta/bin" "$SHELL_PROFILE"; then
        echo "export PATH=\"\\$HOME/.aravanta/bin:\\$PATH\"" >> "$SHELL_PROFILE"
        echo "Added $BIN_DIR to $SHELL_PROFILE"
      fi
    fi
    export PATH="$BIN_DIR:$PATH"
    ;;
esac

if [ -w "/usr/local/bin" ] && [ ! -e "/usr/local/bin/aravanta" ]; then
  ln -sf "$TARGET" /usr/local/bin/aravanta 2>/dev/null || true
fi

echo ""
echo "[SUCCESS] Aravanta CLI installed successfully!"
echo "Location: $TARGET"
echo ""
echo "Verify from any terminal:"
echo "  aravanta --version"
echo "  aravanta status"
echo "  aravanta auth login --email your-email@example.com"
echo ""
'''

# Write outputs
targets = [
    (REPO_ROOT / "scripts" / "install.ps1", ps1_template),
    (REPO_ROOT / "frontend" / "public" / "install.ps1", ps1_template),
    (REPO_ROOT / "scripts" / "install.sh", sh_template),
    (REPO_ROOT / "frontend" / "public" / "install.sh", sh_template),
]

for path, content in targets:
    path.write_text(content, encoding="utf-8")
    print(f"Generated: {{path}} ({{len(content)}} bytes)")

# Also ensure frontend/public/aravanta.py exists
(REPO_ROOT / "frontend" / "public" / "aravanta.py").write_bytes(cli_bytes)
print("Copied aravanta.py to frontend/public/aravanta.py")
