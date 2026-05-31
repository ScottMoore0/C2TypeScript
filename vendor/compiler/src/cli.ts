#!/usr/bin/env node
/**
 * src2ts CLI — translate C/C++/Lua to TypeScript
 * Usage: npx src2ts --input <path> [--output <path>] [--verify]
 *        npx src2ts --project <dir> [--verify] [--ast-only]
 */
import { basename, extname, join } from "node:path";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const inputIdx = args.indexOf("--input");
const outputIdx = args.indexOf("--output");
const projectIdx = args.indexOf("--project");
const auditIdx = args.indexOf("--audit");
const compileCommandsIdx = args.indexOf("--compile-commands");
const verify = args.includes("--verify");
const astOnly = args.includes("--ast-only");
const libraryMode = args.includes("--library");
// Item 11-C: opt-in source-map emission. When `--source-map` is passed, every
// translated `.ts` file gets a sibling `<name>.ts.map` (Source Map v3 JSON)
// and a trailing `//# sourceMappingURL=<basename>.map` comment. Default off
// so existing pipelines (matrix, oracle, real-world fixtures) stay bit-stable
// until the four #11 agents land in concert.
const sourceMap = args.includes("--source-map");
if (sourceMap) process.env.c2ts_EMIT_SOURCE_MAP = "1";

// Engine Phase 2 — D10/D11/D12: --engine + --on-band-a flag handling.
// Per `compiler/plans/band-a-necessity-detection.md` §5 (D10/D11/D12) and
// `compiler/plans/rust-wasm-engine-roadmap.md` §13.2 / §13.4.
//   --engine={off|hotpath|required}     (default: off)
//   --on-band-a={engine-required|engine-hotpath|stubs|fail}
// When --engine=off AND Band-A sites are detected, the user gets either an
// interactive 4-choice prompt (TTY) or the explicit --on-band-a value
// (non-interactive). On "stubs", a post-translation overlay injects the
// throwing stub functions. The metadata for D13/D14 (pragma + attribute
// engine routing) is populated unconditionally as part of the same scan.
import { parseEngineMode, parseOnBandA, resolveBandAChoice } from "./engine-prompt.js";
import { detectBandA } from "./band-a-detector.js";
import { emitStubsForFile } from "./band-a-stub-emitter.js";
import { scanPragmasInSource, scanAttributesInAST } from "./engine-routing.js";
import { dumpAST } from "./clang-runner.js";

const engineMode = parseEngineMode(args);
const onBandA = parseOnBandA(args);
// Make the resolved engine mode visible to downstream code (emitter, SML)
// via env so we don't have to thread it through every function signature.
process.env.c2ts_ENGINE_MODE = engineMode;
if (onBandA) process.env.c2ts_ON_BAND_A = onBandA;

// Cross-cutting blocker #7 (real-world-c-codebase-translatability-audit.md):
// `--plugins=name:path,name:path,...` declares known plug-ins at translate
// time. The translator emits a `__plugins.ts` preamble next to the entry
// point that does:
//
//   import * as __plugin_NAME from "<path>";
//   import "posix-runtime";  // installs __cpp_register_plugin on globalThis
//   __cpp_register_plugin("NAME", __plugin_NAME);
//   ...
//
// At runtime the translated dlopen("name", ...) routes through the registry
// shim in posix-runtime/src/posix/dlfcn.ts. This unblocks OpenSSL ENGINE,
// mbedTLS PSA driver registration, nginx dynamic-modules, libcurl auth
// providers, and any C codebase whose plug-ins can be enumerated at
// translate time. Plug-in names that aren't pre-listed still resolve to
// NULL (POSIX-compliant dlopen failure path), so the flag is purely
// additive.
type PluginSpec = { name: string; path: string };
function parsePluginsFlag(argv: string[]): PluginSpec[] {
  const specs: PluginSpec[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    let raw: string | null = null;
    if (a === "--plugins") raw = argv[i + 1] ?? null;
    else if (a.startsWith("--plugins=")) raw = a.slice("--plugins=".length);
    if (raw === null) continue;
    for (const entry of raw.split(",")) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon < 0) {
        console.error(`Warning: --plugins entry '${trimmed}' is not 'name:path' — skipping`);
        continue;
      }
      const name = trimmed.slice(0, colon).trim();
      const p = trimmed.slice(colon + 1).trim();
      if (!name || !p) {
        console.error(`Warning: --plugins entry '${trimmed}' has empty name or path — skipping`);
        continue;
      }
      specs.push({ name, path: p });
    }
  }
  return specs;
}

/** Sanitize a plug-in name into a valid TS identifier suffix. */
function _pluginIdent(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, "_");
}

/** Emit `__plugins.ts` into outputDir. Returns the absolute path of the
 *  emitted file, or null if no plug-ins were declared. */
function emitPluginRegistryPreamble(outputDir: string, specs: PluginSpec[]): string | null {
  if (specs.length === 0) return null;
  const lines: string[] = [];
  lines.push("// AUTO-GENERATED by src2ts --plugins. Do not edit by hand.");
  lines.push("// BRIDGE: dlfcn-registry — pre-translation plug-in manifest.");
  lines.push("// Each `__cpp_register_plugin(name, ns)` wires a JS module under a");
  lines.push("// logical library name so the translated C `dlopen(name, ...)` call");
  lines.push("// resolves to that module's exports. See");
  lines.push("// c2typescript/posix-runtime/src/posix/dlfcn.ts for the runtime semantics.");
  lines.push("");
  // Side-effect import of posix-runtime installs __cpp_register_plugin on globalThis.
  lines.push('import "posix-runtime";');
  // Also import the function directly in case posix-runtime's side-effect install was
  // skipped by a sandboxed globalThis.
  lines.push('import { __cpp_register_plugin } from "posix-runtime";');
  lines.push("");
  for (const spec of specs) {
    const id = `__plugin_${_pluginIdent(spec.name)}`;
    lines.push(`import * as ${id} from ${JSON.stringify(spec.path)};`);
  }
  lines.push("");
  for (const spec of specs) {
    const id = `__plugin_${_pluginIdent(spec.name)}`;
    lines.push(`__cpp_register_plugin(${JSON.stringify(spec.name)}, ${id} as unknown as Record<string, unknown>);`);
  }
  lines.push("");
  const outPath = join(outputDir, "__plugins.ts");
  writeFileSync(outPath, lines.join("\n"), "utf-8");
  return outPath;
}

const _pluginSpecs = parsePluginsFlag(args);

// --audit mode: pre-translation codebase audit
if (auditIdx >= 0 && args[auditIdx + 1]) {
  const auditDir = args[auditIdx + 1];
  import("./pre-translation-audit.js").then(
    ({ runAuditCLI }) => process.exit(runAuditCLI(auditDir)),
    (err) => { console.error(err); process.exit(1); }
  );
// --compile-commands mode: ingest a JSON compilation database
} else if (compileCommandsIdx >= 0 && args[compileCommandsIdx + 1]) {
  const dbPath = args[compileCommandsIdx + 1];
  const output = outputIdx >= 0 && args[outputIdx + 1] ? args[outputIdx + 1] : "./ts-output";
  runCompileCommandsPipeline(dbPath, output).then(
    (code) => process.exit(code),
    (err) => { console.error(err); process.exit(1); }
  );
// --project mode: full pipeline orchestrator
} else if (projectIdx >= 0 && args[projectIdx + 1]) {
  const projectDir = args[projectIdx + 1];
  if (!existsSync(projectDir)) {
    console.error(`Error: project directory '${projectDir}' does not exist`);
    process.exit(1);
  }
  runProjectPipeline(projectDir, { verify, astOnly }).then(
    (code) => process.exit(code),
    (err) => { console.error(err); process.exit(1); }
  );
} else if (inputIdx < 0 || !args[inputIdx + 1]) {
  console.log("Usage: npx src2ts --input <path> [--output <path>] [--verify] [--ast-only]");
  console.log("       npx src2ts --project <dir> [--verify] [--ast-only]");
  console.log("       npx src2ts --compile-commands <path> [--output <path>]");
  console.log("       npx src2ts --audit <dir>");
  console.log("  --input             Source file or directory (C/C++/Lua)");
  console.log("  --output            Output directory (default: ./ts-output)");
  console.log("  --project           Project directory for full pipeline translation");
  console.log("  --compile-commands  Path to a clang JSON compilation database");
  console.log("  --verify            Run oracle verification after translation");
  console.log("  --ast-only          Translate without oracle verification (cross-platform)");
  console.log("  --audit             Run pre-translation codebase audit (no translation)");
  console.log("  --source-map        Emit a Source Map v3 sidecar (.ts.map) per translated file");
  console.log("  --plugins           Comma-separated 'name:path' list of pre-translation plug-ins");
  console.log("                      (e.g. --plugins=engine_rsa:./engines/rsa.ts,engine_aes:./engines/aes.ts)");
  console.log("                      Emits a __plugins.ts preamble that registers each module so");
  console.log("                      translated dlopen(name, ...) resolves to the registered handle.");
  process.exit(1);
} else {

const input = args[inputIdx + 1];
const output = outputIdx >= 0 && args[outputIdx + 1] ? args[outputIdx + 1] : "./ts-output";

if (!existsSync(input)) {
  console.error(`Error: input path '${input}' does not exist`);
  process.exit(1);
}

if (!existsSync(output)) mkdirSync(output, { recursive: true });

// Emit plug-in registry preamble (cross-cutting blocker #7).
const _pluginPreamble = emitPluginRegistryPreamble(output, _pluginSpecs);
if (_pluginPreamble !== null) {
  console.log(`Plug-in registry preamble: ${_pluginPreamble} (${_pluginSpecs.length} plug-in${_pluginSpecs.length === 1 ? "" : "s"})`);
}

// Dynamic import of the self-modifying loop
const { translateAndVerify } = require("./self-modifying-loop.ts");

// Extract preprocessor / include flags passed on the CLI by callers like
// run-real-world.ts (which forwards fixture.json's `cppFlags` verbatim).
// Without forwarding, library-mode translation silently ignored
// `-DBLAKE3_NO_SSE2` and emitted SSE2 calls that throw at runtime. Recognised:
//   -D<name>[=<val>]   (joined or separated)
//   -I<path>           (joined or separated)
//   -isystem <path>    (joined or separated)
//   -include <path>    (joined or separated)
//   -std=<lang>
// Unknown flags are skipped silently to avoid breaking other callers.
function extractPassthroughFlags(argv: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    if (a === "-D" || a === "-I" || a === "-isystem" || a === "-include") {
      const next = argv[i + 1];
      if (next !== undefined) { out.push(a + next); i++; }
      continue;
    }
    if (a.startsWith("-D") || a.startsWith("-I") ||
        a.startsWith("-isystem") || a.startsWith("-include") ||
        a.startsWith("-std=") || a.startsWith("-U")) {
      out.push(a);
    }
  }
  return out;
}
const passthroughFlags = extractPassthroughFlags(args);

// Collect source files
const files: string[] = [];
const inputStat = statSync(input);
if (inputStat.isDirectory()) {
  for (const f of readdirSync(input)) {
    if (/\.(c|cpp|lua)$/i.test(f)) files.push(join(input, f));
  }
} else {
  files.push(input);
}

if (files.length === 0) {
  console.log("No C/C++/Lua source files found in", input);
  process.exit(0);
}

// Check Clang availability before starting translation
const clangPath = process.env.CLANG_PATH ?? "C:/Program Files/LLVM/bin/clang";
try {
  execSync(`"${clangPath}" --version`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
} catch {
  console.error(`Error: Clang not found at '${clangPath}'.`);
  console.error("Install LLVM/Clang or set CLANG_PATH environment variable.");
  process.exit(1);
}

console.log(`Translating ${files.length} file(s) to ${output}`);

// --ast-only skips oracle verification entirely (for cross-platform scenarios)
const maxIterations = astOnly ? 0 : (verify ? 3 : 0);

if (libraryMode) {
  try {
    const { translateFiles } = require("./self-modifying-loop.ts");
    // Build a per-file compileFlags map applying the same CLI-level
    // -D/-I/-isystem/-include/-std= flags to every input. The translator's
    // Clang invocation reads compileFlags by file path, so empty entry =
    // no flags injected.
    let compileFlags: Map<string, string[]> | undefined;
    if (passthroughFlags.length > 0) {
      compileFlags = new Map();
      for (const f of files) compileFlags.set(f, passthroughFlags);
    }
    const tsFiles = translateFiles(files, output, { libraryMode: true, compileFlags });
    for (const tsFile of tsFiles) {
      console.log(`  [library] ${basename(tsFile)}`);
    }
    console.log(`\nResult: ${tsFiles.length} passed, 0 failed, 0 skipped out of ${files.length}`);
    process.exit(0);
  } catch (e: any) {
    console.error(`  [error] library translation: ${e.message?.substring(0, 200) ?? "unknown error"}`);
    console.log(`\nResult: 0 passed, 0 failed, ${files.length} skipped out of ${files.length}`);
    process.exit(1);
  }
}

let passed = 0, failed = 0, skipped = 0;
for (const file of files) {
  try {
    if (libraryMode) {
      // Library mode: just translate, no oracle verification
      const { translateFile } = require("./self-modifying-loop.ts");
      let compileFlags: Map<string, string[]> | undefined;
      if (passthroughFlags.length > 0) {
        compileFlags = new Map();
        compileFlags.set(file, passthroughFlags);
      }
      const tsFile = translateFile(file, output, { libraryMode: true, compileFlags });
      console.log(`  [library] ${basename(file)} → ${basename(tsFile)}`);
      passed++;
      continue;
    }
    // Item 11-A2: --ast-only must translate even when the C source can't be
    // compiled+run (e.g. a TU without main(), a TU that depends on a host
    // header missing from the local toolchain). The verification step
    // requires running the C binary, but translation has no such dependency.
    // Bypass `translateAndVerify` so a compile-failure short-circuit doesn't
    // suppress .ts and .ts.map emission. Source-map verification harness
    // relies on this for multi-TU fixtures (`multi_file_lib.c` has no main).
    if (astOnly) {
      const { translateFile } = require("./self-modifying-loop.ts");
      const tsFile = translateFile(file, output);
      console.log(`  [unverified] ${basename(tsFile)}`);
      passed++;
      continue;
    }
    const result = translateAndVerify(file, output, files, maxIterations);
    if (astOnly) {
      console.log(`  [unverified] ${basename(file)}`);
      passed++;
    } else if (result.matches) {
      console.log(`  [pass] ${basename(file)}`);
      passed++;
    } else {
      console.log(`  [divergence] ${basename(file)}`);
      failed++;
    }
  } catch (e: any) {
    console.error(`  [error] ${basename(file)}: ${e.message?.substring(0, 200) ?? "unknown error"}`);
    skipped++;
  }
}

console.log(`\nResult: ${passed} passed, ${failed} failed, ${skipped} skipped out of ${files.length}`);
if (astOnly) console.log("Note: --ast-only mode — output is unverified");

// Engine Phase 2 — D11/D12 + D13/D14: post-translation Band-A detection,
// engine-routing metadata population, and stub-emission overlay. We run
// detection AFTER the translator has produced the .ts files so the overlay
// has something to prepend to. Detection itself walks the Clang AST per
// source file (independently from the translator's AST cache) so the rest
// of the pipeline is unaffected.
(async () => {
  let exitCode = (failed > 0 || skipped > 0) ? 1 : 0;
  try {
    const choiceCode = await runEngineRoutingPostTranslate(files, output, engineMode, onBandA);
    if (choiceCode !== 0) exitCode = choiceCode;
  } catch (e: any) {
    console.error(`  [engine-detection] error: ${e?.message ?? e}`);
  }
  process.exit(exitCode);
})();
} // end of --input branch (the IIFE above calls process.exit; nothing past here in this branch)

/**
 * Run Band-A detection on each translated source file, populate D13/D14
 * engine-routing metadata, and — when --engine=off and Band-A sites are
 * present — invoke the prompt or honour --on-band-a. Returns a non-zero
 * exit code on user-chosen abort ("fail"); 0 otherwise.
 *
 * Stub emission ("stubs"): for each source file with detected sites,
 * prepend a block of `__cpu_*` throwing stubs to the corresponding `.ts`
 * file in `outDir`.
 */
async function runEngineRoutingPostTranslate(
  files: string[],
  outDir: string,
  mode: "off" | "hotpath" | "required",
  explicitChoice: ReturnType<typeof parseOnBandA>,
): Promise<number> {
  const allSites: import("./band-a-detector.js").BandASite[] = [];
  const sitesByFile = new Map<string, import("./band-a-detector.js").BandASite[]>();
  for (const f of files) {
    if (!/\.(c|cpp)$/i.test(f)) continue;
    let astResult;
    try {
      astResult = await dumpAST(f);
    } catch {
      continue; // detection is advisory; never block translation on a re-AST failure
    }
    // D13: source-text pragma scan (always run; metadata is consulted later
    // by the engine-routing emitter).
    try {
      const src = readFileSync(f, "utf-8");
      scanPragmasInSource(src, f);
    } catch {}
    // D14: AST attribute scan (always run).
    scanAttributesInAST(astResult.ast);
    // Band-A site detection (read-only).
    const sources = new Map<string, string>();
    try { sources.set(f, readFileSync(f, "utf-8")); } catch {}
    const result = detectBandA(astResult.ast, { sources });
    if (result.sites.length > 0) {
      allSites.push(...result.sites);
      sitesByFile.set(f, result.sites);
    }
  }
  if (allSites.length === 0) return 0;
  const choice = await resolveBandAChoice({ mode, explicitChoice, sites: allSites });
  if (choice === "none") return 0;
  if (choice === "fail") {
    console.error(`[engine-detection] Aborted: ${allSites.length} Band-A site(s) detected.`);
    return 2;
  }
  if (choice === "stubs") {
    let totalStubs = 0;
    for (const [src, sites] of sitesByFile) {
      const tsName = basename(src).replace(/\.(c|cpp)$/i, ".ts");
      const tsPath = join(outDir, tsName);
      const emitted = emitStubsForFile(tsPath, sites);
      totalStubs += emitted.length;
      if (emitted.length > 0) {
        console.log(`  [engine-detection] stubs: ${tsName} ← ${emitted.length} stub function(s)`);
      }
    }
    console.log(`[engine-detection] Stubs emitted: ${totalStubs} across ${sitesByFile.size} file(s).`);
    return 0;
  }
  // Re-translation choices (engine-required / engine-hotpath) — record the
  // intent in env-vars and print the suggested re-invoke. The actual engine
  // routing emitter is Phase 2's main work and is not yet wired; this CLI
  // path therefore prints the choice for the user to act on.
  console.log(`[engine-detection] User chose: ${choice}.`);
  console.log(`  Re-invoke: src2ts --input <...> --engine=${choice === "engine-required" ? "required" : "hotpath"}`);
  return 0;
}

// --- Compilation database helpers (RW5.1–5.4) ---

/**
 * Tokenize a command string with shell-like quote handling.
 * Supports double quotes, single quotes, and backslash-escapes outside quotes.
 */
function shellTokenize(cmd: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inSingle = false;
  let inDouble = false;
  let hasContent = false;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (inSingle) {
      if (c === "'") inSingle = false;
      else { cur += c; hasContent = true; }
    } else if (inDouble) {
      if (c === '"') inDouble = false;
      else if (c === "\\" && i + 1 < cmd.length && (cmd[i + 1] === '"' || cmd[i + 1] === "\\")) {
        cur += cmd[++i]; hasContent = true;
      } else { cur += c; hasContent = true; }
    } else {
      if (c === "'") { inSingle = true; hasContent = true; }
      else if (c === '"') { inDouble = true; hasContent = true; }
      else if (c === "\\" && i + 1 < cmd.length) { cur += cmd[++i]; hasContent = true; }
      else if (/\s/.test(c)) {
        if (hasContent) { out.push(cur); cur = ""; hasContent = false; }
      } else { cur += c; hasContent = true; }
    }
  }
  if (hasContent) out.push(cur);
  return out;
}

/**
 * Filter a tokenized argv to keep only translator-relevant flags:
 *   -I, -D, -isystem, -include, -std=, -W
 * Discards: -c, -o, output paths, the source file, and other compiler-private flags.
 * Handles both joined (`-Ifoo`) and separated (`-I foo`) forms; emits joined form.
 */
function filterCompileFlags(argv: string[], sourceFile: string, directory: string): string[] {
  const result: string[] = [];
  const sourceBase = basename(sourceFile);
  const norm = (p: string) => p.replace(/\\/g, "/");
  const sourceNorm = norm(sourceFile);
  // Resolve `-I path` / `-isystem path` against `directory` so relative includes
  // remain valid when invoked from a different cwd.
  const resolveRel = (p: string): string => {
    if (!p) return p;
    if (/^[A-Za-z]:/.test(p) || p.startsWith("/") || p.startsWith("\\")) return p;
    return join(directory, p);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    // Skip compiler binary (first token if not a flag and not the source file)
    if (i === 0 && !a.startsWith("-")) continue;
    // Skip -c
    if (a === "-c") continue;
    // Skip -o <path> and joined forms
    if (a === "-o") { i++; continue; }
    if (a.startsWith("-o") && a.length > 2) continue;
    // Skip the source file argument (match by full path or basename)
    if (a === sourceFile || norm(a) === sourceNorm || basename(a) === sourceBase) continue;
    // Separated forms: -I foo, -isystem foo, -include foo, -D NAME
    if (a === "-I" || a === "-isystem" || a === "-include" || a === "-D") {
      const next = argv[i + 1];
      if (next !== undefined) {
        const value = (a === "-I" || a === "-isystem" || a === "-include") ? resolveRel(next) : next;
        result.push(a + value);
        i++;
      }
      continue;
    }
    // Joined forms
    if (a.startsWith("-I") || a.startsWith("-D")) {
      // -I<path> or -D<name[=val]>
      if (a.startsWith("-I")) {
        const path = a.slice(2);
        result.push("-I" + resolveRel(path));
      } else {
        result.push(a);
      }
      continue;
    }
    if (a.startsWith("-isystem")) {
      // -isystem<path> joined
      const path = a.slice("-isystem".length);
      if (path.length > 0) result.push("-isystem" + resolveRel(path));
      continue;
    }
    if (a.startsWith("-include")) {
      const path = a.slice("-include".length);
      if (path.length > 0) result.push("-include" + resolveRel(path));
      continue;
    }
    if (a.startsWith("-std=")) { result.push(a); continue; }
    if (a.startsWith("-W")) { result.push(a); continue; }
    // Discard everything else (e.g. -O2, -g, -f*, -m*, -MMD, -MT, -pthread, etc.)
  }
  return result;
}

/**
 * Parse a compile_commands.json file and return a map of source file → flags array.
 * Honours the spec at https://clang.llvm.org/docs/JSONCompilationDatabase.html:
 * each entry has `directory`, `file`, and either `command` (string) or
 * `arguments` (string[]). `file` may be relative to `directory`.
 */
function parseCompileCommands(dbPath: string): Map<string, string[]> | null {
  try {
    const raw = JSON.parse(readFileSync(dbPath, 'utf-8'));
    if (!Array.isArray(raw)) return null;
    const result = new Map<string, string[]>();
    for (const entry of raw) {
      let file = entry.file as string | undefined;
      const directory = (entry.directory as string | undefined) ?? "";
      if (!file) continue;
      // Resolve relative file paths against the directory
      const isAbs = /^[A-Za-z]:/.test(file) || file.startsWith("/") || file.startsWith("\\");
      if (!isAbs && directory) file = join(directory, file);
      let argv: string[] = [];
      if (Array.isArray(entry.arguments)) {
        argv = entry.arguments as string[];
      } else if (typeof entry.command === 'string') {
        argv = shellTokenize(entry.command);
      }
      const flags = filterCompileFlags(argv, file, directory);
      result.set(file, flags);
    }
    return result.size > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Check if a command is available on the system.
 */
function commandAvailable(cmd: string): boolean {
  try {
    execSync(`${cmd} --version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to extract compile_commands.json from the project, generating it if needed.
 * Returns a Map<filename, flags[]> or null if unavailable.
 */
function tryExtractCompileCommands(projectDir: string, buildSystem: string): Map<string, string[]> | null {
  // Check common locations for existing compile_commands.json
  const candidatePaths = [
    join(projectDir, 'compile_commands.json'),
    join(projectDir, 'build', 'compile_commands.json'),
    join(projectDir, '_build', 'compile_commands.json'),
  ];
  for (const p of candidatePaths) {
    if (existsSync(p)) {
      console.log(`  Found existing compile_commands.json: ${p}`);
      const result = parseCompileCommands(p);
      if (result) return result;
    }
  }

  // RW5.1: CMake — generate compile_commands.json
  if (buildSystem === 'cmake') {
    if (commandAvailable('cmake')) {
      try {
        const buildDir = join(projectDir, '_build');
        console.log('  Running cmake to generate compile_commands.json...');
        execSync(`cmake -B "${buildDir}" -DCMAKE_EXPORT_COMPILE_COMMANDS=ON "${projectDir}"`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 60000,
        });
        const dbPath = join(buildDir, 'compile_commands.json');
        if (existsSync(dbPath)) {
          const result = parseCompileCommands(dbPath);
          if (result) {
            console.log(`  Generated compile_commands.json with ${result.size} entries`);
            return result;
          }
        }
      } catch (e: any) {
        console.log(`  cmake generation failed: ${(e.message ?? '').slice(0, 120)}`);
      }
    } else {
      console.log('  cmake not available, falling back to default flags');
    }
  }

  // RW5.3: Autotools — run ./configure first if no Makefile exists
  if (buildSystem === 'autotools') {
    if (!existsSync(join(projectDir, 'Makefile'))) {
      try {
        console.log('  Running ./configure for autotools project...');
        execSync('./configure', {
          cwd: projectDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 120000,
        });
      } catch (e: any) {
        console.log(`  ./configure failed: ${(e.message ?? '').slice(0, 120)}`);
      }
    }
    // After configure, treat as make
  }

  // RW5.2: Make (and autotools after configure) — try bear or compiledb
  if (buildSystem === 'make' || buildSystem === 'autotools') {
    // Try bear first
    if (commandAvailable('bear')) {
      try {
        console.log('  Running bear -- make -n to generate compile_commands.json...');
        execSync('bear -- make -n', {
          cwd: projectDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 60000,
        });
        const dbPath = join(projectDir, 'compile_commands.json');
        if (existsSync(dbPath)) {
          const result = parseCompileCommands(dbPath);
          if (result) {
            console.log(`  Generated compile_commands.json via bear with ${result.size} entries`);
            return result;
          }
        }
      } catch (e: any) {
        console.log(`  bear failed: ${(e.message ?? '').slice(0, 120)}`);
      }
    }
    // Try compiledb
    if (commandAvailable('compiledb')) {
      try {
        console.log('  Running compiledb make -n to generate compile_commands.json...');
        execSync('compiledb make -n', {
          cwd: projectDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 60000,
        });
        const dbPath = join(projectDir, 'compile_commands.json');
        if (existsSync(dbPath)) {
          const result = parseCompileCommands(dbPath);
          if (result) {
            console.log(`  Generated compile_commands.json via compiledb with ${result.size} entries`);
            return result;
          }
        }
      } catch (e: any) {
        console.log(`  compiledb failed: ${(e.message ?? '').slice(0, 120)}`);
      }
    }
    console.log('  No compile_commands.json tools available (bear/compiledb), falling back to default flags');
  }

  return null;
}

// --- Pipeline orchestrator ---

async function runProjectPipeline(projectDir: string, options: { verify: boolean; astOnly: boolean }): Promise<number> {
  console.log(`=== C/C++/Lua → TypeScript Pipeline ===`);
  console.log(`Project: ${projectDir}\n`);

  // Step 0: Verify Clang is available
  const clangBin = process.env.CLANG_PATH ?? "C:/Program Files/LLVM/bin/clang";
  try {
    execSync(`"${clangBin}" --version`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  } catch {
    console.error(`Error: Clang not found at '${clangBin}'.`);
    console.error("Install LLVM/Clang or set CLANG_PATH environment variable.");
    return 1;
  }

  // Step 1: Detect build system
  console.log('Step 1: Detecting build system...');
  let buildSystem = 'unknown';
  if (existsSync(join(projectDir, 'CMakeLists.txt'))) buildSystem = 'cmake';
  else if (existsSync(join(projectDir, 'Makefile'))) buildSystem = 'make';
  else if (existsSync(join(projectDir, 'meson.build'))) buildSystem = 'meson';
  else if (existsSync(join(projectDir, 'configure.ac'))) buildSystem = 'autotools';
  console.log(`  Build system: ${buildSystem}`);

  // Step 2: Collect compilation flags
  console.log('Step 2: Collecting compilation flags...');
  const flags: string[] = [];
  let compileDbFlags: Map<string, string[]> | null = null;

  // RW5.1–5.4: Try to extract per-file flags from compile_commands.json
  compileDbFlags = tryExtractCompileCommands(projectDir, buildSystem);

  if (!compileDbFlags) {
    // Fall back to comprehensive flags
    try {
      const { COMPREHENSIVE_CLANG_FLAGS } = require('./comprehensive-flags');
      flags.push(...COMPREHENSIVE_CLANG_FLAGS);
    } catch {}
  }
  try {
    const { parseConfigDefines } = require('./config-parser');
    flags.push(...parseConfigDefines(projectDir));
  } catch {}
  // Check known-project-flags
  try {
    const knownFlags = JSON.parse(readFileSync(join(__dirname, 'known-project-flags.json'), 'utf-8'));
    const projectName = basename(projectDir).toLowerCase();
    if (knownFlags[projectName]) flags.push(...knownFlags[projectName]);
  } catch {}

  // RW5.4: Fallback scan for include directories when build system is unknown
  if (!compileDbFlags && buildSystem === 'unknown') {
    const commonIncDirs = ['src', 'include', 'lib', 'inc', 'headers'];
    for (const d of commonIncDirs) {
      const full = join(projectDir, d);
      if (existsSync(full)) {
        try {
          if (statSync(full).isDirectory()) {
            flags.push(`-I${full}`);
          }
        } catch {}
      }
    }
    // Also add the project root as an include path
    flags.push(`-I${projectDir}`);
  }

  if (compileDbFlags) {
    console.log(`  Flags: compile_commands.json with ${compileDbFlags.size} file entries`);
  } else {
    console.log(`  Flags: ${flags.length} compilation flags collected`);
  }

  // Step 3: Detect features
  console.log('Step 3: Detecting project features...');
  try {
    const { detectFeatures } = require('./source-detector');
    const features = detectFeatures(projectDir);
    const detected = Object.entries(features).filter(([_k, v]) => v === true).map(([k]) => k);
    if (detected.length > 0) console.log(`  Features: ${detected.join(', ')}`);
    else console.log('  Features: none detected');
  } catch {
    console.log('  Features: detector not available');
  }

  // Step 3b: Thread classification + shared memory layout (F3.6b-2, F3.6c-1)
  // TODO: Wire thread-classifier.ts to classify threads and shared-memory-layout.ts
  // to compute SharedArrayBuffer layout. If setupCode is generated, prepend to main output.
  // Currently these modules exist but are not wired into the pipeline.

  // Step 4: Find source files
  console.log('Step 4: Finding source files...');
  const sourceFiles: string[] = [];
  function scanDir(dir: string) {
    try {
      for (const entry of readdirSync(dir)) {
        if (['.git', 'node_modules', 'build', 'dist', '_generated', '_ts_output'].includes(entry)) continue;
        const full = join(dir, entry);
        try {
          const st = statSync(full);
          if (st.isDirectory()) scanDir(full);
          else if (/\.(c|cpp|cc|cxx)$/.test(entry) && !entry.startsWith('test_')) {
            sourceFiles.push(full);
          }
        } catch {}
      }
    } catch {}
  }
  scanDir(projectDir);
  console.log(`  Found ${sourceFiles.length} source files`);

  if (sourceFiles.length === 0) {
    console.log('\nNo source files found. Nothing to translate.');
    return 0;
  }

  // Step 5: Create output directory
  const outputDir = join(projectDir, '_ts_output');
  mkdirSync(outputDir, { recursive: true });

  // Cross-cutting blocker #7: emit pre-translation plug-in registry preamble.
  const _projPluginPreamble = emitPluginRegistryPreamble(outputDir, _pluginSpecs);
  if (_projPluginPreamble !== null) {
    console.log(`  Plug-in registry preamble: ${_projPluginPreamble} (${_pluginSpecs.length} plug-in${_pluginSpecs.length === 1 ? "" : "s"})`);
  }

  // Step 6: Translate each file
  // Step 6: Translate + verify via oracle loop
  // Uses the self-modifying loop: translate → run C → run TS → compare → fix → repeat
  // This applies ALL fix rules (32 rules), injects ALL libc shims (~221 functions),
  // handles integer wrapping, struct copy, pointer boxing, RAII, operator overloading, etc.
  console.log(`Step 6: Translating + verifying ${sourceFiles.length} files (via oracle loop)...`);
  let translated = 0, pipelineFailed = 0, verified = 0;

  if (sourceFiles.length > 1 && !options.astOnly) {
    // Multi-file project: compile all C files together, translate each, compare
    try {
      const { translateAndVerifyMultiFile } = require('./self-modifying-loop');
      const result = translateAndVerifyMultiFile(sourceFiles, outputDir, 5);
      translated = sourceFiles.length;
      if (result.matches) {
        verified = sourceFiles.length;
        console.log(`  ✓ All ${sourceFiles.length} files translated and verified`);
      } else {
        console.log(`  ⚠ Translated ${sourceFiles.length} files, oracle verification: divergence detected`);
        console.log(`    C output: ${JSON.stringify(result.cppOutput?.slice(0, 100))}`);
        console.log(`    TS output: ${JSON.stringify(result.tsOutput?.slice(0, 100))}`);
      }
    } catch (e: any) {
      console.log(`  Multi-file translation failed: ${e.message?.slice(0, 200)}`);
      // Fallback: translate files individually
      for (const file of sourceFiles) {
        try {
          const { translateFile } = require('./self-modifying-loop');
          translateFile(file, outputDir, { libraryMode });
          translated++;
        } catch (e2: any) {
          console.log(`  FAIL: ${basename(file)}: ${e2.message?.slice(0, 200)}`);
          pipelineFailed++;
        }
      }
    }
  } else if (options.astOnly) {
    // AST-only mode: translate without verification
    for (const file of sourceFiles) {
      try {
        const { translateFile } = require('./self-modifying-loop');
        translateFile(file, outputDir, { libraryMode });
        console.log(`  OK: ${basename(file)} [unverified]`);
        translated++;
      } catch (e: any) {
        console.log(`  FAIL: ${basename(file)}: ${e.message?.slice(0, 200)}`);
        pipelineFailed++;
      }
    }
  } else {
    // Single file: full oracle loop with auto-fix
    try {
      const { translateAndVerify } = require('./self-modifying-loop');
      const result = translateAndVerify(sourceFiles[0], outputDir, [], 5);
      translated = 1;
      if (result.matches) {
        verified = 1;
        console.log(`  ✓ Translated and verified (${result.iterations} iterations, ${result.outputFixes.length} fixes applied)`);
      } else {
        console.log(`  ⚠ Translated, oracle divergence remains after ${result.iterations} iterations`);
      }
    } catch (e: any) {
      console.log(`  FAIL: ${e.message?.slice(0, 200)}`);
      pipelineFailed++;
    }
  }
  console.log(`  Result: ${translated} translated, ${verified} verified, ${pipelineFailed} failed`);

  // Step 6b: Resolve cross-file imports
  console.log('Step 6b: Resolving cross-file imports...');
  const outputFiles = readdirSync(outputDir).filter((f: string) => f.endsWith('.ts'));

  // Collect all exports from each file
  const fileExports = new Map<string, Set<string>>();
  for (const f of outputFiles) {
    const content = readFileSync(join(outputDir, f), 'utf-8');
    const exports = new Set<string>();
    const exportRegex = /export\s+(?:function|const|let|var|class)\s+(\w+)/g;
    let em;
    while ((em = exportRegex.exec(content)) !== null) {
      exports.add(em[1]);
    }
    fileExports.set(f, exports);
  }

  // For each file, find undefined references and add imports
  for (const f of outputFiles) {
    let content = readFileSync(join(outputDir, f), 'utf-8');

    // Find all identifier references in the file
    const usedNames = new Set<string>();
    const identRegex = /\b([A-Za-z_]\w*)\b/g;
    let im;
    while ((im = identRegex.exec(content)) !== null) {
      usedNames.add(im[1]);
    }

    // Find all locally defined names
    const localDefs = new Set<string>();
    const defRegex = /(?:function|const|let|var|class|type|interface|enum)\s+(\w+)/g;
    while ((im = defRegex.exec(content)) !== null) {
      localDefs.add(im[1]);
    }
    // Also add parameter names
    const paramRegex = /\(([^)]*)\)/g;
    while ((im = paramRegex.exec(content)) !== null) {
      for (const p of im[1].split(',')) {
        const name = p.trim().split(/[:\s]/)[0]?.replace(/[?.*&]/g, '');
        if (name) localDefs.add(name);
      }
    }

    // Common built-in names to skip
    const builtins = new Set(['console', 'process', 'require', 'module', 'exports', 'Buffer', 'Math', 'JSON', 'String', 'Number', 'Boolean', 'Array', 'Object', 'Map', 'Set', 'Date', 'Error', 'RegExp', 'Promise', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI', 'decodeURI', 'undefined', 'null', 'true', 'false', 'NaN', 'Infinity', 'globalThis', 'structuredClone', 'performance', 'TextEncoder', 'TextDecoder', 'Uint8Array', 'Int32Array', 'Float32Array', 'Float64Array', 'DataView', 'ArrayBuffer', 'SharedArrayBuffer', 'Atomics', 'Worker', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally', 'new', 'delete', 'typeof', 'instanceof', 'void', 'in', 'of', 'class', 'function', 'const', 'let', 'var', 'import', 'export', 'default', 'this', 'super', 'yield', 'await', 'async', 'static', 'get', 'set', 'from', 'as', 'type', 'interface', 'enum', 'extends', 'implements']);

    // Find needed imports
    const imports = new Map<string, string[]>(); // filename → [names]
    for (const name of usedNames) {
      if (localDefs.has(name) || builtins.has(name)) continue;
      if (name.length <= 1) continue; // skip single chars (loop vars etc)

      // Check if any other file exports this name
      for (const [otherFile, otherExports] of fileExports) {
        if (otherFile === f) continue;
        if (otherExports.has(name)) {
          if (!imports.has(otherFile)) imports.set(otherFile, []);
          imports.get(otherFile)!.push(name);
          break;
        }
      }
    }

    // Generate import statements
    if (imports.size > 0) {
      const importLines: string[] = [];
      for (const [fromFile, names] of imports) {
        const uniqueNames = [...new Set(names)].sort();
        const fromModule = './' + fromFile.replace('.ts', '.js');
        importLines.push(`import { ${uniqueNames.join(', ')} } from '${fromModule}';`);
      }

      // Prepend imports (after any existing imports)
      const existingImportEnd = content.lastIndexOf("import ");
      if (existingImportEnd >= 0) {
        const lineEnd = content.indexOf('\n', existingImportEnd);
        content = content.slice(0, lineEnd + 1) + importLines.join('\n') + '\n' + content.slice(lineEnd + 1);
      } else {
        content = importLines.join('\n') + '\n\n' + content;
      }

      writeFileSync(join(outputDir, f), content);
      console.log(`  ${f}: added ${imports.size} import(s) (${[...imports.values()].flat().length} symbols)`);
    }
  }

  // Steps 6c/6d removed — the self-modifying loop already handles:
  // - libc shim injection (all ~221 functions inlined)
  // - octal escape conversion
  // - duplicate let in switch cases
  // - runtime helpers (i32/u32 inlined)

  // Step 7: Generate package.json + tsconfig.json
  writeFileSync(join(outputDir, 'package.json'), JSON.stringify({
    name: basename(projectDir) + '-ts',
    version: '1.0.0',
    type: 'module',
    scripts: { start: 'npx tsx main.ts' },
    dependencies: {}
  }, null, 2));

  writeFileSync(join(outputDir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'node',
      strict: false,
      skipLibCheck: true,
      esModuleInterop: true,
      outDir: './dist'
    },
    include: ['*.ts']
  }, null, 2));

  // Step 8: Summary
  console.log(`\n=== Pipeline Complete ===`);
  console.log(`Output: ${outputDir}`);
  console.log(`Files: ${translated} translated, ${verified} oracle-verified, ${pipelineFailed} failed`);
  if (verified === translated && pipelineFailed === 0) {
    console.log(`✓ SUCCESS: C/C++ output === TypeScript output`);
  } else if (translated > 0 && pipelineFailed === 0) {
    console.log(`⚠ PARTIAL: Translated but oracle verification found divergences`);
  } else {
    console.log(`✗ ISSUES: Some files failed to translate`);
  }

  return pipelineFailed > 0 ? 1 : 0;
}

// --- compile_commands.json ingestion mode ---

/**
 * Translate every C/C++ TU listed in a compile_commands.json file, applying
 * each entry's per-file -I/-D/-isystem/-include/-std=/-W flags during the
 * Clang AST dump. Multi-TU runs go through libraryMode so cross-TU imports
 * are emitted; a single-TU file falls back to standalone translation.
 */
async function runCompileCommandsPipeline(dbPath: string, outDir: string): Promise<number> {
  console.log(`=== compile_commands.json ingestion ===`);
  console.log(`Database: ${dbPath}`);

  if (!existsSync(dbPath)) {
    console.error(`Error: compile_commands.json '${dbPath}' does not exist`);
    return 1;
  }

  // Step 0: Verify Clang
  const clangBin = process.env.CLANG_PATH ?? "C:/Program Files/LLVM/bin/clang";
  try {
    execSync(`"${clangBin}" --version`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  } catch {
    console.error(`Error: Clang not found at '${clangBin}'.`);
    console.error("Install LLVM/Clang or set CLANG_PATH environment variable.");
    return 1;
  }

  // Step 1: Parse the database
  const flagsByFile = parseCompileCommands(dbPath);
  if (!flagsByFile) {
    console.error(`Error: failed to parse compile_commands.json (not a JSON array, or empty)`);
    return 1;
  }

  // Step 2: Filter to translatable C/C++ source files
  const sourceExt = /\.(c|cc|cpp|cxx)$/i;
  const sourceFiles: string[] = [];
  const filteredFlags = new Map<string, string[]>();
  let skipped = 0;
  for (const [file, flags] of flagsByFile) {
    if (!sourceExt.test(file)) { skipped++; continue; }
    sourceFiles.push(file);
    filteredFlags.set(file, flags);
  }

  console.log(`Entries: ${flagsByFile.size} total, ${sourceFiles.length} translatable, ${skipped} skipped (.s/.o/etc.)`);
  if (sourceFiles.length === 0) {
    console.log("No translatable source files. Nothing to do.");
    return 0;
  }

  // Verify each source exists; entries pointing at vanished files are dropped
  const existingSources: string[] = [];
  for (const f of sourceFiles) {
    if (existsSync(f)) existingSources.push(f);
    else console.log(`  [missing] ${f}`);
  }
  if (existingSources.length === 0) {
    console.error("Error: none of the source files in the database exist on disk");
    return 1;
  }

  // Step 3: Create output directory
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Step 4: Translate
  console.log(`Translating ${existingSources.length} file(s) to ${outDir}...`);
  const { translateFiles, translateFile } = require("./self-modifying-loop.ts");

  let passed = 0, failed = 0;

  if (existingSources.length === 1) {
    // Single TU: standalone translation
    const onlyFile = existingSources[0]!;
    try {
      const tsFile = translateFile(onlyFile, outDir, {
        libraryMode: false,
        compileFlags: filteredFlags,
      });
      console.log(`  [pass] ${basename(onlyFile)} -> ${basename(tsFile)}`);
      passed++;
    } catch (e: any) {
      console.error(`  [fail] ${basename(onlyFile)}: ${e.message?.substring(0, 200) ?? "unknown error"}`);
      failed++;
    }
  } else {
    // Multi-TU: libraryMode so cross-TU imports get resolved
    try {
      const tsFiles = translateFiles(existingSources, outDir, {
        libraryMode: true,
        compileFlags: filteredFlags,
      });
      // translateFiles returns a tsFile per input on success; any failure throws.
      const okSet = new Set<string>();
      for (const ts of tsFiles) okSet.add(basename(ts));
      for (const src of existingSources) {
        const expectedName = basename(src).replace(/\.(c|cc|cpp|cxx)$/i, ".ts");
        if (okSet.has(expectedName)) {
          console.log(`  [pass] ${basename(src)} -> ${expectedName}`);
          passed++;
        } else {
          console.log(`  [fail] ${basename(src)} (no output produced)`);
          failed++;
        }
      }
    } catch (e: any) {
      console.error(`  [error] library translation: ${e.message?.substring(0, 200) ?? "unknown error"}`);
      failed = existingSources.length;
    }
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed out of ${existingSources.length}`);
  return failed > 0 ? 1 : 0;
}
