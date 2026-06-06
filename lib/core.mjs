import os from "os";
import fs from "fs";
import path from "path";
import { execSync, spawnSync } from "child_process";

// ─── ANSI ────────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", green: "\x1b[32m",
  yellow: "\x1b[33m", cyan: "\x1b[36m", red: "\x1b[31m",
  magenta: "\x1b[35m", blue: "\x1b[34m", dim: "\x1b[2m",
};
export const ok    = (m) => console.log(`${C.green}✔${C.reset}  ${m}`);
export const info  = (m) => console.log(`${C.cyan}ℹ${C.reset}  ${m}`);
export const warn  = (m) => console.log(`${C.yellow}⚠${C.reset}  ${m}`);
export const fail  = (m) => console.log(`${C.red}✖${C.reset}  ${m}`);
export const dim   = (m) => console.log(`${C.dim}   ${m}${C.reset}`);
export const title = (m) => console.log(`\n${C.bold}${C.magenta}${m}${C.reset}\n`);
export const step  = (n, m) => console.log(`\n${C.bold}${C.blue}[${n}]${C.reset} ${C.bold}${m}${C.reset}`);

// ─── Run a command safely, return stdout or null ──────────────────────────────
export function run(cmd, args = [], cwd = undefined) {
  try {
    const r = spawnSync(cmd, args, { encoding: "utf8", cwd });
    if (r.status === 0) return r.stdout.trim();
    return null;
  } catch { return null; }
}

// ─── Parse semver string → { major, minor, patch } ───────────────────────────
export function parseSemver(raw) {
  const m = (raw || "").match(/(\d+)\.(\d+)\.?(\d*)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +(m[3] || 0), raw: m[0] };
}

// ─── Detect all runtimes on the system ────────────────────────────────────────
export function detectRuntimes() {
  const runtimes = {};

  // Node.js
  const nodeRaw = run("node", ["--version"]);
  runtimes.node = nodeRaw ? parseSemver(nodeRaw) : null;

  // npm
  const npmRaw = run("npm", ["--version"]);
  runtimes.npm = npmRaw ? parseSemver(npmRaw) : null;

  // pnpm
  const pnpmRaw = run("pnpm", ["--version"]);
  runtimes.pnpm = pnpmRaw ? parseSemver(pnpmRaw) : null;

  // yarn
  const yarnRaw = run("yarn", ["--version"]);
  runtimes.yarn = yarnRaw ? parseSemver(yarnRaw) : null;

  // Python (try python3 first, then python)
  const py3Raw = run("python3", ["--version"]);
  const py2Raw = run("python",  ["--version"]);
  const pyRaw  = py3Raw || py2Raw;
  runtimes.python     = pyRaw ? parseSemver(pyRaw) : null;
  runtimes.pythonCmd  = py3Raw ? "python3" : (py2Raw ? "python" : null);

  // pip
  const pip3Raw = run("pip3", ["--version"]);
  const pipRaw  = run("pip",  ["--version"]);
  runtimes.pip    = (pip3Raw || pipRaw) ? true : false;
  runtimes.pipCmd = pip3Raw ? "pip3" : (pipRaw ? "pip" : null);

  // git
  const gitRaw = run("git", ["--version"]);
  runtimes.git = gitRaw ? parseSemver(gitRaw) : null;

  return runtimes;
}

// ─── Choose best package manager (pnpm > yarn > npm) ─────────────────────────
export function choosePM(runtimes) {
  if (runtimes.pnpm) return "pnpm";
  if (runtimes.yarn) return "yarn";
  if (runtimes.npm)  return "npm";
  return null;
}

// ─── Validate Node version ≥ 18 ───────────────────────────────────────────────
export function validateNode(runtimes) {
  if (!runtimes.node) return { ok: false, reason: "Node.js not found" };
  if (runtimes.node.major < 18) {
    return {
      ok: false,
      reason: `Node.js ${runtimes.node.raw} found but ≥18 required. Download: https://nodejs.org`,
    };
  }
  return { ok: true };
}

// ─── System info ─────────────────────────────────────────────────────────────
export function getSystemInfo() {
  return {
    platform: os.platform(),
    arch:     os.arch(),
    username: os.userInfo().username,
    homeDir:  os.homedir(),
    nodeEnv:  process.version,
  };
}

// ─── Claude Desktop config path per OS ───────────────────────────────────────
export function getClaudeConfigPath() {
  const { platform, homeDir } = getSystemInfo();
  const map = {
    win32:  [
      path.join(homeDir, "AppData", "Roaming", "Claude", "claude_desktop_config.json"),
      path.join(homeDir, "AppData", "Local",   "Claude", "claude_desktop_config.json"),
    ],
    darwin: [
      path.join(homeDir, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
    ],
    linux:  [
      path.join(homeDir, ".config", "Claude", "claude_desktop_config.json"),
      path.join(homeDir, ".claude", "claude_desktop_config.json"),
    ],
  };
  const list = map[platform] ?? map.linux;
  for (const p of list) if (fs.existsSync(p)) return { found: true,  configPath: p };
  return { found: false, configPath: list[0] };
}

// ─── Safe JSON read ───────────────────────────────────────────────────────────
export function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return {}; }
}

// ─── Safe config merge ────────────────────────────────────────────────────────
export function mergeConfig(existing, key, entry) {
  const config = JSON.parse(JSON.stringify(existing)); // deep clone
  if (!config.mcpServers) config.mcpServers = {};
  if (config.mcpServers[key]) return { config, changed: false };
  config.mcpServers[key] = entry;
  return { config, changed: true };
}

// ─── Atomic write with backup ─────────────────────────────────────────────────
export function writeConfig(filePath, config) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(filePath)) {
    const bak = filePath + ".bak";
    fs.copyFileSync(filePath, bak);
    dim(`Backup → ${bak}`);
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
}

// ─── Clone / pull repo ────────────────────────────────────────────────────────
export function cloneOrPull(repoUrl, targetDir) {
  if (fs.existsSync(path.join(targetDir, ".git"))) {
    info("Repo already cloned — pulling latest…");
    execSync("git pull", { cwd: targetDir, stdio: "inherit" });
  } else {
    info(`Cloning ${repoUrl} …`);
    fs.mkdirSync(targetDir, { recursive: true });
    execSync(`git clone "${repoUrl}" "${targetDir}"`, { stdio: "inherit" });
  }
}

// ─── Install deps with best PM ────────────────────────────────────────────────
export function installDeps(dir, pm) {
  info(`Installing dependencies with ${pm}…`);
  const cmd = pm === "yarn" ? "yarn" : `${pm} install`;
  execSync(cmd, { cwd: dir, stdio: "inherit" });
}
