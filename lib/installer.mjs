import path from "path";
import {
  ok, info, warn, fail, dim, title, step,
  detectRuntimes, choosePM, validateNode,
  getSystemInfo, getClaudeConfigPath,
  readJSON, mergeConfig, writeConfig,
  cloneOrPull, installDeps,
} from "./core.mjs";

const REPO_URL   = "https://github.com/rocnubie/nanobanana-mcp.git";
const ENTRY_FILE = "src/index.mjs";
const MCP_KEY    = "nanobanana-mcp";

export async function install() {
  // ── Banner ──────────────────────────────────────────────────────────────────
  console.log(`
\x1b[1m\x1b[35m
  ╔═══════════════════════════════════════════╗
  ║   🍌  nanobanana-mcp  Auto Installer      ║
  ║   by Alpha X Solutions                    ║
  ╚═══════════════════════════════════════════╝
\x1b[0m`);

  // ── Step 1: System info ─────────────────────────────────────────────────────
  step("1/6", "Detecting system…");
  const sys = getSystemInfo();
  info(`OS       : ${sys.platform} (${sys.arch})`);
  info(`Username : ${sys.username}`);
  info(`Home     : ${sys.homeDir}`);

  // ── Step 2: Runtime detection ───────────────────────────────────────────────
  step("2/6", "Scanning installed runtimes…");
  const rt = detectRuntimes();

  const printRuntime = (name, v) =>
    v ? ok(`${name.padEnd(10)} v${v.raw}`) : warn(`${name.padEnd(10)} not found`);

  printRuntime("Node.js", rt.node);
  printRuntime("npm",     rt.npm);
  printRuntime("pnpm",    rt.pnpm);
  printRuntime("yarn",    rt.yarn);
  printRuntime("Python",  rt.python);
  printRuntime("git",     rt.git);

  // ── Step 3: Validate requirements ──────────────────────────────────────────
  step("3/6", "Validating requirements…");

  if (!rt.git) {
    fail("git is required. Install from: https://git-scm.com");
    process.exit(1);
  }
  ok("git ✓");

  const nodeCheck = validateNode(rt);
  if (!nodeCheck.ok) {
    fail(nodeCheck.reason);
    process.exit(1);
  }
  ok(`Node.js v${rt.node.raw} ✓`);

  const pm = choosePM(rt);
  if (!pm) {
    fail("No package manager found (npm/pnpm/yarn). Please install Node.js: https://nodejs.org");
    process.exit(1);
  }
  ok(`Package manager: ${pm} ✓`);

  // Python info (optional — log but don't block)
  if (rt.python) {
    ok(`Python v${rt.python.raw} detected (${rt.pythonCmd}) — noted for MCP compatibility`);
  } else {
    warn("Python not found — not required for nanobanana-mcp but noted.");
  }

  // ── Step 4: Install nanobanana-mcp ─────────────────────────────────────────
  step("4/6", "Installing nanobanana-mcp…");
  const installDir = `${sys.homeDir}/.nanobanana/nanobanana-mcp`;

  try {
    cloneOrPull(REPO_URL, installDir);
    installDeps(installDir, pm);
    ok(`Installed at: ${installDir}`);
  } catch (e) {
    fail(`Install failed: ${e.message}`);
    process.exit(1);
  }

  const entryPoint = `${installDir}/${ENTRY_FILE}`;

  // ── Step 5: Locate Claude Desktop config ───────────────────────────────────
  step("5/6", "Locating Claude Desktop config…");
  const { found, configPath } = getClaudeConfigPath();

  if (found) {
    ok(`Config found: ${configPath}`);
  } else {
    warn(`Config not found — will create: ${configPath}`);
  }

  const existing = readJSON(configPath);
  const existingKeys = Object.keys(existing.mcpServers || {});
  if (existingKeys.length) {
    info(`Existing MCP servers preserved: ${existingKeys.join(", ")}`);
  }

  // ── Step 6: Merge & write config ───────────────────────────────────────────
  step("6/6", "Updating Claude Desktop config…");

  const newEntry = {
    command: "node",
    args: [entryPoint],
    ...(rt.python ? { env: { PYTHON_CMD: rt.pythonCmd } } : {}),
  };

  const { config, changed } = mergeConfig(existing, MCP_KEY, newEntry);

  if (changed) {
    writeConfig(configPath, config);
    ok(`Config updated: ${configPath}`);
    dim(`Added entry: "${MCP_KEY}" → ${entryPoint}`);
  } else {
    info(`"${MCP_KEY}" already in config — no changes made.`);
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log(`
\x1b[1m\x1b[32m
  ✅  Installation Complete!
\x1b[0m
  \x1b[2mNext step: Restart Claude Desktop to activate nanobanana-mcp.\x1b[0m
  \x1b[2mSupport  : support@nanobanana-ai.online\x1b[0m
  \x1b[2mBy       : Alpha X Solutions\x1b[0m
`);
}
