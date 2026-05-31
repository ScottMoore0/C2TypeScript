/**
 * Band-A stub emission (Engine Phase 2 atom D12).
 *
 * Given the list of `BandASite` records produced by `band-a-detector.ts` and
 * the path to a translated `.ts` file, prepends — at the top of that file —
 * a set of `__cpu_<descriptive>` stub functions that throw at runtime with a
 * remediation message. The stubs preserve a generic signature so the rest of
 * the codebase compiles, but calling any stub aborts immediately.
 *
 * The emitted shape (per `band-a-necessity-detection.md` §4 and
 * `rust-wasm-engine-roadmap.md` §13.4):
 *
 *   // BRIDGE: band-a-stub-<id> — Band-A primitive (<description>) under
 *   // --engine=off. Re-run translator with --engine=required to enable
 *   // engine routing.
 *   function __cpu_<name>(...args: any[]): any {
 *     throw new Error("Band-A primitive '<description>' not supported under --engine=off. Re-translate with --engine=required, or annotate this function with #pragma c2ts engine.");
 *   }
 *
 * One stub per UNIQUE site identifier (deduped — two sites with the same
 * pattern share one stub function). The names are mangled from the
 * `BandASite.identifier` so that downstream code can call e.g.
 * `__cpu_band_a_mprotect_exec(...)` and immediately fail.
 *
 * NB: this does NOT modify `emitter.ts`. It is a post-translation overlay
 * applied by `cli.ts` when `--on-band-a=stubs` is selected.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { BandASite } from "./band-a-detector.js";

/** Human-readable description for each Band-A pattern identifier. */
const PATTERN_DESCRIPTIONS: Record<string, string> = {
  "band-a-eflags-precise-asm":      "EFLAGS-precise inline asm",
  "band-a-jit-codegen-bytes":       "JIT codegen via byte-write + function-pointer cast",
  "band-a-mprotect-exec":           "executable-page allocation (mprotect/mmap PROT_EXEC)",
  "band-a-rdtsc-control-flow":      "cycle-precise rdtsc loop",
  "band-a-mmio-hardcoded-address":  "memory-mapped I/O at hardcoded address",
  "band-a-x87-extended-precision":  "x87 80-bit extended-precision arithmetic",
  "band-a-decimal-adjust-opcode":   "decimal-adjust opcode (AAA/AAD/AAM/AAS/DAA/DAS)",
  "band-a-submillisecond-scheduling": "sub-millisecond cycle-precise scheduling",
};

function describe(identifier: string): string {
  return PATTERN_DESCRIPTIONS[identifier] ?? identifier;
}

/**
 * Convert a kebab-case identifier (`band-a-mprotect-exec`) to a snake_case
 * stub-function suffix (`band_a_mprotect_exec`).
 */
function stubName(identifier: string): string {
  return identifier.replace(/[^A-Za-z0-9]/g, "_");
}

/**
 * Build the TypeScript source for one stub function, including the
 * `// BRIDGE:` marker as mandated by the Charter (every Category-2 boundary
 * is a one-line marked bridge).
 */
export function renderStub(identifier: string): string {
  const description = describe(identifier);
  const fn = `__cpu_${stubName(identifier)}`;
  // The signature is intentionally generic (`...args: any[]) => any`) so any
  // call site type-checks. The body throws immediately, so no shape mismatch
  // is observable at runtime — the program halts at the boundary.
  const lines: string[] = [];
  lines.push(`// BRIDGE: band-a-stub-${identifier} — Band-A primitive (${description}) under`);
  lines.push(`// --engine=off. Re-run translator with --engine=required to enable engine routing.`);
  lines.push(`function ${fn}(..._args: any[]): any {`);
  lines.push(`  throw new Error("Band-A primitive '${description}' not supported under --engine=off. Re-translate with --engine=required, or annotate this function with #pragma c2ts engine.");`);
  lines.push(`}`);
  return lines.join("\n");
}

/**
 * Emit one stub per unique BandA site identifier and prepend the resulting
 * block to the translated `.ts` file at `tsFile`. Returns the list of stub
 * function names emitted (e.g. `["__cpu_band_a_mprotect_exec"]`).
 *
 * Idempotent: if a stub with the same name is already present in the file
 * (from a previous run), it is not duplicated. This makes the post-process
 * safe to re-invoke during iterative translation.
 */
export function emitStubsForFile(tsFile: string, sites: BandASite[]): string[] {
  if (!existsSync(tsFile) || sites.length === 0) return [];
  const uniqueIds = Array.from(new Set(sites.map(s => s.identifier)));
  const existing = readFileSync(tsFile, "utf-8");
  const block: string[] = [];
  block.push(`// ─── Band-A stubs (--engine=off + --on-band-a=stubs) ───────────────────`);
  block.push(`// Each stub throws at runtime with a remediation message.`);
  block.push(`// Sites detected:`);
  for (const s of sites) {
    block.push(`//   ${s.file}:${s.line}  ${s.identifier}  (${s.confidence})`);
  }
  const emittedNames: string[] = [];
  for (const id of uniqueIds) {
    const fn = `__cpu_${stubName(id)}`;
    if (existing.includes(`function ${fn}(`)) continue;
    block.push(renderStub(id));
    block.push("");
    emittedNames.push(fn);
  }
  if (emittedNames.length === 0) return [];
  const newContent = block.join("\n") + "\n\n" + existing;
  writeFileSync(tsFile, newContent, "utf-8");
  return emittedNames;
}
