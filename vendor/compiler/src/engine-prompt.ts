/**
 * Engine-routing CLI prompt + flag-resolution (Engine Phase 2 atom D11).
 *
 * Implements the four-choice prompt described in
 * `compiler/plans/rust-wasm-engine-roadmap.md` §13.4 and
 * `compiler/plans/band-a-necessity-detection.md` §4.
 *
 * Behaviour:
 *   - When `--engine=off` (the default) AND `bandASites.length > 0` AND
 *     stdin is a TTY, prompt the user with the four options. Use
 *     `process.stdin.setRawMode` for keypress-style input where supported,
 *     otherwise fall back to readline.
 *   - When stdin is NOT a TTY (CI, scripted invocation), default to "abort"
 *     unless the user explicitly passed `--on-band-a={engine-required|
 *     engine-hotpath|stubs|fail}`.
 *
 * Returned `BandAChoice` values:
 *   "engine-required"  → option [1] — re-translate with --engine=required
 *   "engine-hotpath"   → option [2] — re-translate with --engine=hotpath
 *   "stubs"            → option [3] — emit stubs at Band-A sites
 *   "fail"             → option [4] — abort with non-zero exit
 */

import type { BandASite } from "./band-a-detector.js";

export type EngineMode = "off" | "hotpath" | "required";
export type BandAChoice = "engine-required" | "engine-hotpath" | "stubs" | "fail";

// ── Argv parsing ─────────────────────────────────────────────────────────

/**
 * Extract `--engine=<mode>` from argv, defaulting to `"off"`. Accepts both
 * `--engine=off` and `--engine off` forms.
 */
export function parseEngineMode(argv: string[]): EngineMode {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--engine=")) {
      const val = a.slice("--engine=".length);
      if (val === "off" || val === "hotpath" || val === "required") return val;
    } else if (a === "--engine" && i + 1 < argv.length) {
      const val = argv[i + 1]!;
      if (val === "off" || val === "hotpath" || val === "required") return val;
    }
  }
  return "off";
}

/**
 * Extract `--on-band-a=<choice>` from argv. Returns undefined if not present.
 * Accepts both `--on-band-a=stubs` and `--on-band-a stubs` forms.
 */
export function parseOnBandA(argv: string[]): BandAChoice | undefined {
  const normalize = (v: string): BandAChoice | undefined => {
    if (v === "engine-required" || v === "engine-hotpath" ||
        v === "stubs" || v === "fail") return v;
    return undefined;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--on-band-a=")) {
      return normalize(a.slice("--on-band-a=".length));
    }
    if (a === "--on-band-a" && i + 1 < argv.length) {
      return normalize(argv[i + 1]!);
    }
  }
  return undefined;
}

// ── Prompt rendering ─────────────────────────────────────────────────────

/**
 * Render the prompt text exactly as specified in
 * `band-a-necessity-detection.md` §4 — the human-facing 4-choice menu.
 */
export function renderPrompt(sites: BandASite[]): string {
  const lines: string[] = [];
  lines.push(`[engine-detection] Band-A primitives detected (${sites.length} site${sites.length === 1 ? "" : "s"}):`);
  lines.push("");
  for (const s of sites) {
    const desc = describeIdentifier(s.identifier);
    lines.push(`  ${s.file}:${s.line}\t${desc} (${s.confidence} confidence)`);
  }
  lines.push("");
  lines.push("These are not faithfully reproducible in idiomatic TypeScript. Pick:");
  lines.push("");
  lines.push("  [1] Re-translate with --engine=required");
  lines.push("      → Translates this codebase as engine-bound for Band-A sites; the rest");
  lines.push("        stays pure TS. Recommended for v86/qemu/JIT/RTOS codebases.");
  lines.push("  [2] Re-translate with --engine=hotpath");
  lines.push("      → Engine-bound for Band-A AND any function carrying __attribute__((hot)).");
  lines.push("        You may need to annotate specific kernels you want promoted.");
  lines.push("  [3] Continue with --engine=off and emit STUBS at Band-A sites");
  lines.push("      → Each stub throws at runtime with a clear remediation message.");
  lines.push("        The non-Band-A parts of the program still run normally.");
  lines.push("        Pick this if you only need the non-Band-A parts.");
  lines.push("  [4] Abort.");
  lines.push("");
  lines.push("[1/2/3/4]?");
  return lines.join("\n");
}

const DESCRIPTIONS: Record<string, string> = {
  "band-a-eflags-precise-asm":      "EFLAGS-precise inline asm",
  "band-a-jit-codegen-bytes":       "JIT codegen via byte-write + function-pointer cast",
  "band-a-mprotect-exec":           "executable-page allocation",
  "band-a-rdtsc-control-flow":      "cycle-precise rdtsc loop",
  "band-a-mmio-hardcoded-address":  "MMIO at hardcoded address",
  "band-a-x87-extended-precision":  "x87 80-bit extended precision",
  "band-a-decimal-adjust-opcode":   "decimal-adjust opcode",
  "band-a-submillisecond-scheduling": "sub-millisecond cycle-precise scheduling",
};
function describeIdentifier(id: string): string {
  return DESCRIPTIONS[id] ?? id;
}

// ── Choice resolution ────────────────────────────────────────────────────

/**
 * Map a single keypress / typed answer to a BandAChoice. Returns null on
 * unrecognised input so the caller can re-prompt.
 */
export function parseChoiceInput(input: string): BandAChoice | null {
  const t = input.trim();
  if (t === "1") return "engine-required";
  if (t === "2") return "engine-hotpath";
  if (t === "3") return "stubs";
  if (t === "4") return "fail";
  return null;
}

/**
 * Determine whether stdin is a TTY (interactive). Centralised so tests can
 * inject; production reads from `process.stdin.isTTY`.
 */
export function isInteractive(): boolean {
  // process.stdin.isTTY is undefined when piped/redirected.
  return Boolean((process.stdin as any).isTTY);
}

// ── Interactive prompt loop ──────────────────────────────────────────────

/**
 * Show the prompt and read a 1/2/3/4 keypress. Uses `setRawMode` if
 * available (single-keypress mode), otherwise reads a line.
 *
 * Returns a Promise that resolves with the user's BandAChoice. Re-prompts
 * on unrecognised input (max 5 retries to avoid pathological loops; after
 * that, defaults to "fail").
 */
export function promptInteractive(sites: BandASite[]): Promise<BandAChoice> {
  return new Promise<BandAChoice>((resolve) => {
    const promptText = renderPrompt(sites);
    process.stdout.write(promptText + "\n");
    const stdin: any = process.stdin;
    let retries = 0;
    const MAX_RETRIES = 5;

    // Prefer raw-mode keypress where supported. Falls back to line-buffered
    // readline if setRawMode is unavailable (Windows ConPTY without TTY,
    // some test harnesses).
    const canRaw = typeof stdin.setRawMode === "function" && stdin.isTTY;

    const cleanup = () => {
      try { if (canRaw) stdin.setRawMode(false); } catch {}
      try { stdin.pause(); } catch {}
    };

    const onData = (buf: Buffer | string) => {
      const s = typeof buf === "string" ? buf : buf.toString("utf-8");
      // Ctrl-C / Ctrl-D — abort.
      if (s.includes("\x03") || s.includes("\x04")) {
        cleanup();
        resolve("fail");
        return;
      }
      // In raw mode we get one keystroke; in cooked mode we get a line.
      const choice = parseChoiceInput(s);
      if (choice) {
        cleanup();
        resolve(choice);
        return;
      }
      retries++;
      if (retries >= MAX_RETRIES) {
        cleanup();
        resolve("fail");
        return;
      }
      process.stdout.write("Please answer 1, 2, 3, or 4: ");
    };

    try {
      if (canRaw) stdin.setRawMode(true);
      stdin.resume();
      stdin.on("data", onData);
    } catch {
      // If setRawMode throws, fall back to a one-shot read.
      try {
        stdin.once("data", onData);
        stdin.resume();
      } catch {
        resolve("fail");
      }
    }
  });
}

// ── Top-level resolver — what cli.ts calls ───────────────────────────────

export interface ResolveOptions {
  /** Resolved global mode after parsing argv. */
  mode: EngineMode;
  /** Explicit `--on-band-a=` value, if any. */
  explicitChoice: BandAChoice | undefined;
  /** Detected Band-A sites. */
  sites: BandASite[];
  /** Override TTY detection (tests). */
  isTTYOverride?: boolean;
}

/**
 * Decide what to do given the parsed flags + detected sites.
 *
 * Returns:
 *   - `"none"`      — no Band-A sites OR the global mode is not `off`. The
 *                     caller proceeds with normal translation.
 *   - a BandAChoice — the user (or non-interactive default) picked one of
 *                     the four options.
 *
 * If interactive prompting is required, returns a Promise; otherwise the
 * decision is synchronous (wrapped in an already-resolved Promise for a
 * uniform API).
 */
export async function resolveBandAChoice(opts: ResolveOptions): Promise<BandAChoice | "none"> {
  if (opts.sites.length === 0) return "none";
  if (opts.mode !== "off") return "none";
  if (opts.explicitChoice) return opts.explicitChoice;
  const tty = opts.isTTYOverride ?? isInteractive();
  if (!tty) {
    // Non-interactive default per §4: abort.
    process.stderr.write(renderPrompt(opts.sites) + "\n");
    process.stderr.write(
      "Non-interactive context — defaulting to abort. " +
      "Pass --on-band-a={engine-required|engine-hotpath|stubs|fail} to choose.\n",
    );
    return "fail";
  }
  return await promptInteractive(opts.sites);
}
