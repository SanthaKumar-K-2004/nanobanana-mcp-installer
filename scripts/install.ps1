# ─────────────────────────────────────────────────────────────────────────────
#  Alpha X Solutions — nanobanana-mcp One-Line Installer (Windows PowerShell)
#  Usage (one command, paste in PowerShell):
#    irm https://raw.githubusercontent.com/SanthaKumar-K-2004/YOUR_REPO/main/scripts/install.ps1 | iex
# ─────────────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$REPO = "https://github.com/SanthaKumar-K-2004/nanobanana-mcp-installer"
$TMP  = Join-Path $env:TEMP "alphax-nano-$(Get-Random)"

function ok   { param($m) Write-Host "✔  $m" -ForegroundColor Green }
function info { param($m) Write-Host "ℹ  $m" -ForegroundColor Cyan }
function warn { param($m) Write-Host "⚠  $m" -ForegroundColor Yellow }
function fail { param($m) Write-Host "✖  $m" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║   🍌  nanobanana-mcp  One-Line Installer  ║" -ForegroundColor Magenta
Write-Host "  ║   by Alpha X Solutions                    ║" -ForegroundColor Magenta
Write-Host "  ╚═══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ── Check git ─────────────────────────────────────────────────────────────────
try { $gitVer = git --version 2>&1; ok "git found: $gitVer" }
catch { fail "git not found. Install from: https://git-scm.com" }

# ── Check Node.js ─────────────────────────────────────────────────────────────
try {
  $nodeVer = node --version 2>&1
  $nodeMajor = [int]($nodeVer -replace "v(\d+)\..*", '$1')
  if ($nodeMajor -lt 18) { fail "Node.js $nodeVer found but v18+ is required. Upgrade: https://nodejs.org" }
  ok "Node.js $nodeVer ✓"
} catch { fail "Node.js not found. Install from: https://nodejs.org (v18+)" }

# ── Detect package manager ────────────────────────────────────────────────────
$pm = $null
try { $v = pnpm --version 2>&1; $pm = "pnpm"; ok "Package manager: pnpm v$v" } catch {}
if (-not $pm) {
  try { $v = yarn --version 2>&1; $pm = "yarn"; ok "Package manager: yarn v$v" } catch {}
}
if (-not $pm) {
  try { $v = npm --version 2>&1; $pm = "npm"; ok "Package manager: npm v$v" } catch {}
}
if (-not $pm) { fail "No package manager found (npm/pnpm/yarn)." }

# ── Detect Python (optional) ──────────────────────────────────────────────────
$pyFound = $false
try {
  $pyVer = python --version 2>&1
  ok "Python $pyVer detected"
  $pyFound = $true
} catch { warn "Python not found — not required, noted." }

# ── Clone installer ───────────────────────────────────────────────────────────
info "Cloning Alpha X installer…"
New-Item -ItemType Directory -Force -Path $TMP | Out-Null
git clone --depth=1 $REPO "$TMP\installer" 2>&1 | Out-Null
ok "Installer ready."

# ── Run installer ─────────────────────────────────────────────────────────────
info "Running installer…"
node "$TMP\installer\bin\install.mjs"

# ── Cleanup ───────────────────────────────────────────────────────────────────
Remove-Item -Recurse -Force $TMP -ErrorAction SilentlyContinue
Write-Host "`n✅  All done! Restart Claude Desktop to activate.`n" -ForegroundColor Green
