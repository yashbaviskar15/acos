#!/usr/bin/env bash
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

CLI_URL="https://raw.githubusercontent.com/yashbaviskar15/acos/main/cli/aravanta.py"
TARGET="$BIN_DIR/aravanta"

echo "Downloading Aravanta CLI from source..."
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$CLI_URL" -o "$TARGET"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$TARGET" "$CLI_URL"
else
  echo "Error: curl or wget is required." >&2
  exit 1
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
        echo "export PATH=\"\$HOME/.aravanta/bin:\$PATH\"" >> "$SHELL_PROFILE"
        echo "Added $BIN_DIR to $SHELL_PROFILE"
      fi
    fi
    export PATH="$BIN_DIR:$PATH"
    ;;
esac

# Try to link to /usr/local/bin if writable
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
