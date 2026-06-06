# 🍌 nanobanana-mcp Auto Installer
### by Alpha X Solutions

One command. Any OS. Zero manual config.

---

## ⚡ One-Line Install Commands

### macOS / Linux
```bash
curl -fsSL https://raw.githubusercontent.com/SanthaKumar-K-2004/nanobanana-mcp-installer/main/scripts/install.sh | bash
```

### Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/SanthaKumar-K-2004/nanobanana-mcp-installer/main/scripts/install.ps1 | iex
```

### Via npx (any OS, if Node.js already installed)
```bash
npx nanobanana-mcp-installer
```

---

## 🤖 What the Installer Does Automatically

| Step | Detail |
|------|--------|
| **Detect OS** | Windows / macOS / Linux + architecture |
| **Detect username & home** | Fully automatic, no input needed |
| **Scan runtimes** | Node.js, npm, pnpm, yarn, Python, git — all detected with versions |
| **Validate Node ≥18** | Friendly error + upgrade link if too old |
| **Choose best PM** | pnpm → yarn → npm (auto-selected) |
| **Note Python version** | Detected and passed as env var to MCP if found |
| **Clone & install MCP** | Clones nanobanana-mcp into `~/.nanobanana/` |
| **Find Claude config** | Checks all known OS paths automatically |
| **Safe merge** | Adds only new entry — never overwrites anything |
| **Backup config** | `.bak` file saved before any write |
| **Already installed?** | Silently skips — zero disturbance |

---

## 🛡 Safe Merge — Your Config Is Never Disturbed

```json
// Your config before
{
  "globalShortcut": "Ctrl+Alt+N",
  "theme": "dark",
  "mcpServers": {
    "my-custom-tool": { "command": "python", "args": ["server.py"] }
  }
}

// Your config after
{
  "globalShortcut": "Ctrl+Alt+N",
  "theme": "dark",
  "mcpServers": {
    "my-custom-tool": { "command": "python", "args": ["server.py"] },
    "nanobanana-mcp": { "command": "node", "args": ["/home/you/.nanobanana/nanobanana-mcp/src/index.mjs"] }
  }
}
```

✅ Existing MCP servers → untouched  
✅ Custom top-level keys → untouched  
✅ Already has `nanobanana-mcp` → skipped silently  
✅ Config dir missing → created automatically  
✅ Backup always saved before write  

---

## 📁 Claude Desktop Config Paths (Auto-Detected)

| OS | Path |
|----|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

---

## 🔧 Manual / Dev Usage

```bash
# Clone this installer repo
git clone https://github.com/SanthaKumar-K-2004/nanobanana-mcp-installer.git
cd nanobanana-mcp-installer

# Run installer directly
node bin/install.mjs

# Run tests
node tests/core.test.mjs
```

---

## 📋 Requirements

| Tool | Required | Notes |
|------|----------|-------|
| Node.js ≥18 | ✅ Yes | https://nodejs.org |
| git | ✅ Yes | https://git-scm.com |
| npm / pnpm / yarn | ✅ One of these | Auto-detected |
| Python | ❌ Optional | Auto-detected if present |

---

## 🚀 Push to GitHub — Checklist

1. Replace `SanthaKumar-K-2004` in `scripts/install.sh` and `scripts/install.ps1` with your GitHub org/username
2. Push to GitHub
3. Share the one-line command with users — that's it!

```bash
git init
git remote add origin https://github.com/SanthaKumar-K-2004/nanobanana-mcp-installer.git
git add .
git commit -m "feat: Alpha X Solutions nanobanana-mcp installer"
git push -u origin main
```

---

*Alpha X Solutions — nanobanana-ai.online*
# nanobanana-mcp-installer
