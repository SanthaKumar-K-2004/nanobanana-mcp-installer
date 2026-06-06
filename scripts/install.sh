#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Alpha X Solutions — nanobanana-mcp One-Line Installer
#  Usage (one command, paste in terminal):
#    curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/scripts/install.sh | bash
# ─────────────────────────────────────────────────────────────────────────────
set -e

REPO="https://github.com/YOUR_ORG/nanobanana-mcp-installer"
TMP_DIR="$(mktemp -d)"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
CYAN='\033[0;36m';  BOLD='\033[1m';      RESET='\033[0m'
ok()   { echo -e "${GREEN}✔${RESET}  $1"; }
info() { echo -e "${CYAN}ℹ${RESET}  $1"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $1"; }
fail() { echo -e "${RED}✖${RESET}  $1"; exit 1; }

echo -e "${BOLD}${CYAN}"
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║   🍌  nanobanana-mcp  One-Line Installer  ║"
echo "  ║   by Alpha X Solutions                    ║"
echo "  ╚═══════════════════════════════════════════╝"
echo -e "${RESET}"

# ── Check git ─────────────────────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
  fail "git not found. Install from: https://git-scm.com"
fi
ok "git found: $(git --version)"

# ── Check Node.js ─────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  fail "Node.js not found. Install from: https://nodejs.org (v18+)"
fi

NODE_VER=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js v$NODE_VER found but v18+ is required. Upgrade: https://nodejs.org"
fi
ok "Node.js v$NODE_VER ✓"

# ── Detect best package manager ───────────────────────────────────────────────
if command -v pnpm &>/dev/null; then
  PM="pnpm"; PM_VER=$(pnpm --version)
elif command -v yarn &>/dev/null; then
  PM="yarn"; PM_VER=$(yarn --version)
elif command -v npm &>/dev/null; then
  PM="npm";  PM_VER=$(npm --version)
else
  fail "No package manager found (npm/pnpm/yarn)."
fi
ok "Package manager: $PM v$PM_VER"

# ── Detect Python (optional) ──────────────────────────────────────────────────
if command -v python3 &>/dev/null; then
  PY_VER=$(python3 --version 2>&1 | sed 's/Python //')
  ok "Python v$PY_VER (python3) — detected"
elif command -v python &>/dev/null; then
  PY_VER=$(python --version 2>&1 | sed 's/Python //')
  ok "Python v$PY_VER (python) — detected"
else
  warn "Python not found — not required, noted."
fi

# ── Clone installer ───────────────────────────────────────────────────────────
info "Cloning Alpha X installer into temp dir…"
git clone --depth=1 "$REPO" "$TMP_DIR/installer" 2>/dev/null
ok "Installer ready."

# ── Run Node installer ────────────────────────────────────────────────────────
info "Running installer…"
node "$TMP_DIR/installer/bin/install.mjs"

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -rf "$TMP_DIR"
echo -e "\n${GREEN}${BOLD}✅  All done! Restart Claude Desktop to activate.${RESET}\n"
