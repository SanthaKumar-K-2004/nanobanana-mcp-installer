import assert from "assert";
import {
  parseSemver, detectRuntimes, choosePM,
  validateNode, mergeConfig, getSystemInfo, getClaudeConfigPath,
} from "../lib/core.mjs";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`\x1b[32m✔\x1b[0m ${name}`); passed++; }
  catch (e) { console.log(`\x1b[31m✖\x1b[0m ${name}\n   → ${e.message}`); failed++; }
}

// ── parseSemver ───────────────────────────────────────────────────────────────
test("parseSemver: parses v18.12.0", () => {
  const v = parseSemver("v18.12.0");
  assert.strictEqual(v.major, 18);
  assert.strictEqual(v.minor, 12);
  assert.strictEqual(v.patch, 0);
});
test("parseSemver: parses bare 3.1.4", () => {
  const v = parseSemver("3.1.4");
  assert.strictEqual(v.major, 3);
});
test("parseSemver: returns null for garbage", () => {
  assert.strictEqual(parseSemver("not-a-version"), null);
});
test("parseSemver: returns null for null input", () => {
  assert.strictEqual(parseSemver(null), null);
});

// ── validateNode ──────────────────────────────────────────────────────────────
test("validateNode: passes when node ≥18", () => {
  const rt = { node: { major: 20, minor: 0, patch: 0, raw: "20.0.0" } };
  assert.strictEqual(validateNode(rt).ok, true);
});
test("validateNode: fails when node is 16", () => {
  const rt = { node: { major: 16, minor: 0, patch: 0, raw: "16.0.0" } };
  const r = validateNode(rt);
  assert.strictEqual(r.ok, false);
  assert.ok(r.reason.includes("16"));
});
test("validateNode: fails when node is null", () => {
  assert.strictEqual(validateNode({ node: null }).ok, false);
});

// ── choosePM ──────────────────────────────────────────────────────────────────
test("choosePM: prefers pnpm", () => {
  const rt = { pnpm: { raw: "8.0.0" }, yarn: { raw: "1.22.0" }, npm: { raw: "9.0.0" } };
  assert.strictEqual(choosePM(rt), "pnpm");
});
test("choosePM: falls back to yarn when no pnpm", () => {
  const rt = { pnpm: null, yarn: { raw: "1.22.0" }, npm: { raw: "9.0.0" } };
  assert.strictEqual(choosePM(rt), "yarn");
});
test("choosePM: falls back to npm", () => {
  const rt = { pnpm: null, yarn: null, npm: { raw: "9.0.0" } };
  assert.strictEqual(choosePM(rt), "npm");
});
test("choosePM: returns null when nothing found", () => {
  assert.strictEqual(choosePM({ pnpm: null, yarn: null, npm: null }), null);
});

// ── mergeConfig ───────────────────────────────────────────────────────────────
test("mergeConfig: adds when empty", () => {
  const { config, changed } = mergeConfig({}, "nanobanana-mcp", { command: "node", args: [] });
  assert.strictEqual(changed, true);
  assert.ok(config.mcpServers["nanobanana-mcp"]);
});
test("mergeConfig: skips if key exists", () => {
  const ex = { mcpServers: { "nanobanana-mcp": { command: "node", args: ["/old"] } } };
  const { changed, config } = mergeConfig(ex, "nanobanana-mcp", { command: "node", args: ["/new"] });
  assert.strictEqual(changed, false);
  assert.strictEqual(config.mcpServers["nanobanana-mcp"].args[0], "/old");
});
test("mergeConfig: preserves other servers", () => {
  const ex = { mcpServers: { "other-tool": { command: "go", args: ["run"] } } };
  const { config } = mergeConfig(ex, "nanobanana-mcp", { command: "node", args: [] });
  assert.deepStrictEqual(config.mcpServers["other-tool"], { command: "go", args: ["run"] });
});
test("mergeConfig: preserves top-level keys", () => {
  const ex = { theme: "dark", mcpServers: {} };
  const { config } = mergeConfig(ex, "nanobanana-mcp", { command: "node", args: [] });
  assert.strictEqual(config.theme, "dark");
});
test("mergeConfig: does not mutate original object", () => {
  const ex = { mcpServers: {} };
  mergeConfig(ex, "nanobanana-mcp", { command: "node", args: [] });
  assert.strictEqual(Object.keys(ex.mcpServers).length, 0);
});

// ── getSystemInfo ─────────────────────────────────────────────────────────────
test("getSystemInfo: returns platform/username/homeDir", () => {
  const s = getSystemInfo();
  assert.ok(["win32","darwin","linux"].includes(s.platform));
  assert.ok(s.username.length > 0);
  assert.ok(s.homeDir.length > 0);
});

// ── getClaudeConfigPath ───────────────────────────────────────────────────────
test("getClaudeConfigPath: returns configPath ending in .json", () => {
  const { configPath } = getClaudeConfigPath();
  assert.ok(configPath.endsWith("claude_desktop_config.json"));
});

// ── detectRuntimes (live) ─────────────────────────────────────────────────────
test("detectRuntimes: returns object with expected keys", () => {
  const rt = detectRuntimes();
  for (const k of ["node","npm","pnpm","yarn","python","git"]) {
    assert.ok(k in rt, `missing key: ${k}`);
  }
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
