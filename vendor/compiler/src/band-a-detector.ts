/**
 * Band-A necessity detection.
 *
 * Scans a Clang JSON AST for syntactic/semantic patterns whose semantics are
 * NOT faithfully reproducible in idiomatic TypeScript and therefore require
 * the Rust/Wasm engine for fidelity. This is a read-only, side-effect-free
 * detector: it walks the AST and returns a list of `BandASite` records.
 *
 * Companion to `compiler/plans/band-a-necessity-detection.md`.
 *
 * Scope of THIS module (atoms D1, D2, D3, D4):
 *   - D1: module skeleton + exported types + dispatcher
 *   - D2: pattern P7 (decimal-adjust opcodes — aaa/aad/aam/aas/daa/das)
 *   - D3: pattern P3 (mprotect/mmap/VirtualAlloc/VirtualProtect with PROT_EXEC)
 *   - D4: pattern P5 (MMIO hardcoded address — int-to-pointer cast in MMIO range)
 *
 * Patterns P1, P2, P4, P6, P8 are stubbed (return [] from their detectors)
 * pending future "care" atoms that decompose them properly.
 *
 * Per-dispatch constraint (recorded against the prior agent that stalled with
 * 26 regressions): this module is detection-only. It does NOT touch
 * `cli.ts`, `emitter.ts`, or `scripts/check.ts`. Integration is a separate
 * dispatch.
 */

// ── Public types ─────────────────────────────────────────────────────────

export interface BandASite {
  pattern: string;          // "P1".."P8"
  identifier: string;       // band-a-eflags-precise-asm etc.
  file: string;
  line: number;
  column: number;
  function: string | null;
  evidence: string;
  confidence: "high" | "medium" | "low";
  remediation: string;
}

export interface DetectionResult {
  sites: BandASite[];
}

// ── Internal AST shape (loose; we operate on Clang JSON post-parse) ──────

interface AnyNode {
  kind?: string;
  inner?: AnyNode[];
  loc?: { file?: string; line?: number; col?: number; offset?: number; presumedFile?: string };
  range?: { begin?: { file?: string; line?: number; col?: number; offset?: number; presumedFile?: string };
            end?:   { file?: string; line?: number; col?: number; offset?: number; presumedFile?: string }; };
  // commonly-present optional fields we consult below
  name?: string;
  value?: any;
  string?: any;
  AsmString?: any;
  type?: { qualType?: string; desugaredQualType?: string };
  opcode?: string;
  castKind?: string;
  referencedDecl?: { kind?: string; name?: string };
  // p4 etc. – placeholders
  [k: string]: any;
}

// ── Walk helper ──────────────────────────────────────────────────────────

/**
 * Pre-order walk of the AST. The visitor callback receives each node and the
 * enclosing function name (or null at TU scope). The walker propagates the
 * enclosing FunctionDecl (or method/ctor/dtor) name as it descends.
 */
function walk(
  node: AnyNode | undefined,
  cb: (n: AnyNode, fn: string | null) => void,
  enclosingFn: string | null = null,
): void {
  if (!node || typeof node !== "object") return;
  let nextFn = enclosingFn;
  if (
    node.kind === "FunctionDecl" ||
    node.kind === "CXXMethodDecl" ||
    node.kind === "CXXConstructorDecl" ||
    node.kind === "CXXDestructorDecl"
  ) {
    if (typeof node.name === "string" && node.name.length > 0) {
      nextFn = node.name;
    }
  }
  cb(node, nextFn);
  if (Array.isArray(node.inner)) {
    for (const child of node.inner) {
      walk(child, cb, nextFn);
    }
  }
}

/**
 * Track the most recent loc.file/line as we descend (Clang omits these on
 * inner nodes when they are the same as the previous sibling/parent). This
 * mirrors how the emitter resolves source locations.
 */
function bestLoc(node: AnyNode, lastFile: string | undefined, lastLine: number | undefined):
  { file: string; line: number; column: number } {
  const file =
    node.loc?.file ?? node.loc?.presumedFile ??
    node.range?.begin?.file ?? node.range?.begin?.presumedFile ??
    lastFile ?? "<unknown>";
  const line =
    node.loc?.line ??
    node.range?.begin?.line ??
    lastLine ?? 0;
  const column =
    node.loc?.col ??
    node.range?.begin?.col ?? 0;
  return { file, line, column };
}

/**
 * Walk that also threads the most recent file+line forward (Clang elides
 * loc.file when it matches the previous node).
 */
function walkLoc(
  node: AnyNode | undefined,
  cb: (n: AnyNode, fn: string | null, loc: { file: string; line: number; column: number }) => void,
  enclosingFn: string | null = null,
  lastFile: string | undefined = undefined,
  lastLine: number | undefined = undefined,
): void {
  if (!node || typeof node !== "object") return;
  // Update lastFile/lastLine from this node's loc (if present).
  const f =
    node.loc?.file ?? node.loc?.presumedFile ??
    node.range?.begin?.file ?? node.range?.begin?.presumedFile ?? lastFile;
  const l =
    node.loc?.line ?? node.range?.begin?.line ?? lastLine;

  let nextFn = enclosingFn;
  if (
    node.kind === "FunctionDecl" ||
    node.kind === "CXXMethodDecl" ||
    node.kind === "CXXConstructorDecl" ||
    node.kind === "CXXDestructorDecl"
  ) {
    if (typeof node.name === "string" && node.name.length > 0) nextFn = node.name;
  }

  const loc = bestLoc(node, f, l);
  cb(node, nextFn, loc);
  if (Array.isArray(node.inner)) {
    for (const child of node.inner) {
      walkLoc(child, cb, nextFn, f, l);
    }
  }
}

// ── Pattern P7: decimal-adjust opcodes ───────────────────────────────────

const DECIMAL_ADJUST_RE = /\b(aa[adms]|da[as])\b/i;
const DECIMAL_ADJUST_BUILTIN_RE = /^__builtin_ia32_(aa[adms]|da[as])$/;

/**
 * Extract the asm-template string from a GCCAsmStmt node.
 *
 * Clang's JSON AST does NOT expose the asm template as a child for
 * GCCAsmStmt — the node only carries a source `range`. The emitter falls
 * back to slicing the asm body out of the source file using the node's
 * range; we do the same here when source content is available.
 *
 * Slot precedence:
 *   1. node.string / node.AsmString (some Clang versions/wrappers do attach)
 *   2. inner[0].value if it's a StringLiteral
 *   3. source-content slice from `range.begin.offset` (the canonical path)
 *
 * Returns "" if the template cannot be recovered.
 */
function extractAsmTemplate(n: AnyNode, sources?: Map<string, string>, fileHint?: string): string {
  if (typeof n.string === "string") return n.string;
  if (typeof n.AsmString === "string") return n.AsmString;
  const inner0: any = Array.isArray(n.inner) && n.inner.length > 0 ? n.inner[0] : null;
  if (inner0 && typeof inner0.value === "string" && inner0.kind === "StringLiteral") {
    return inner0.value;
  }
  if (Array.isArray(n.inner)) {
    for (const c of n.inner) {
      if ((c as any)?.kind === "StringLiteral" && typeof (c as any).value === "string") {
        return (c as any).value;
      }
    }
  }
  // Source-content fallback. Recover the originating file from range.begin.file
  // (Clang only emits this on the first node in a file; for nested asm we
  // rely on the caller to maintain a "current file" context, but for asm
  // statements at function scope the begin.file is reliably present on the
  // enclosing FunctionDecl — we try a few common locations).
  if (!sources) return "";
  const file =
    n.range?.begin?.file ?? n.range?.begin?.presumedFile ??
    n.loc?.file ?? n.loc?.presumedFile ?? fileHint;
  if (!file) return "";
  const src = sources.get(file);
  if (!src) return "";
  const begin = n.range?.begin?.offset;
  if (typeof begin !== "number") return "";
  const end = n.range?.end?.offset ?? begin;
  // Slice generously: the asm template may extend well past `end.offset`
  // (which sometimes points to the closing token of just the template, not
  // the whole statement). 1 KiB ahead is enough for any realistic template.
  const sliceEnd = Math.max(end + 8, begin + 1024);
  const slice = src.slice(begin, sliceEnd);
  // Concatenate ALL adjacent string-literal tokens that follow the opening
  // `(`. C string-literal concatenation means a multi-line asm template
  // typically appears as several `"..."` tokens; we need them all to spot
  // mnemonics that span lines.
  // Greedy: find the opening `(` and then collect every "..." until the
  // first non-whitespace, non-string, non-comma token (`:`, `)`, etc.).
  const parenIdx = slice.indexOf("(");
  if (parenIdx < 0) return "";
  let i = parenIdx + 1;
  const parts: string[] = [];
  while (i < slice.length) {
    // Skip whitespace and C/C++ comments.
    while (i < slice.length && /\s/.test(slice[i])) i++;
    if (i + 1 < slice.length && slice[i] === "/" && slice[i + 1] === "/") {
      while (i < slice.length && slice[i] !== "\n") i++;
      continue;
    }
    if (i + 1 < slice.length && slice[i] === "/" && slice[i + 1] === "*") {
      i += 2;
      while (i + 1 < slice.length && !(slice[i] === "*" && slice[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (slice[i] !== '"') break;
    // Consume one string literal.
    i++;
    let s = "";
    while (i < slice.length && slice[i] !== '"') {
      if (slice[i] === "\\" && i + 1 < slice.length) {
        s += slice[i] + slice[i + 1];
        i += 2;
      } else {
        s += slice[i];
        i++;
      }
    }
    i++; // closing "
    parts.push(s);
  }
  return parts.join(" ");
}

function detectP7(astRoot: AnyNode, sources?: Map<string, string>): BandASite[] {
  const sites: BandASite[] = [];
  walkLoc(astRoot, (n, fn, loc) => {
    if (n.kind === "GCCAsmStmt" || n.kind === "MSAsmStmt") {
      const tmpl = extractAsmTemplate(n, sources, loc.file);
      if (tmpl && DECIMAL_ADJUST_RE.test(tmpl)) {
        const evidenceSnippet = tmpl.replace(/\s+/g, " ").slice(0, 120);
        sites.push({
          pattern: "P7",
          identifier: "band-a-decimal-adjust-opcode",
          file: loc.file,
          line: loc.line,
          column: loc.column,
          function: fn,
          evidence: `inline asm contains decimal-adjust opcode: ${evidenceSnippet}`,
          confidence: "high",
          remediation: "use --engine=required, or annotate enclosing function with #pragma c2ts engine",
        });
      }
    } else if (n.kind === "CallExpr") {
      // Callee identifier name: first inner child is typically the callee.
      const callee = calleeName(n);
      if (callee && DECIMAL_ADJUST_BUILTIN_RE.test(callee)) {
        sites.push({
          pattern: "P7",
          identifier: "band-a-decimal-adjust-opcode",
          file: loc.file,
          line: loc.line,
          column: loc.column,
          function: fn,
          evidence: `call to decimal-adjust builtin: ${callee}`,
          confidence: "high",
          remediation: "use --engine=required, or annotate enclosing function with #pragma c2ts engine",
        });
      }
    }
  });
  return sites;
}

// ── Pattern P3: mprotect / mmap / VirtualAlloc / VirtualProtect with PROT_EXEC ──

const EXEC_FLAG_RE = /^(PROT_EXEC|PAGE_EXECUTE(_READ|_READWRITE|_WRITECOPY)?)$/;
const EXEC_FN_RE = /^(mprotect|mmap|VirtualAlloc|VirtualProtect)$/;

/**
 * Strip ImplicitCastExpr / ParenExpr layers to reach the underlying expression
 * before inspecting for DeclRef / BinaryOperator structure.
 */
function unwrap(n: AnyNode | undefined): AnyNode | undefined {
  let cur: AnyNode | undefined = n;
  while (cur && (cur.kind === "ImplicitCastExpr" || cur.kind === "ParenExpr" || cur.kind === "CStyleCastExpr")) {
    cur = Array.isArray(cur.inner) && cur.inner.length > 0 ? cur.inner[0] : undefined;
  }
  return cur;
}

/**
 * Recursively check whether an expression's leaves include a DeclRefExpr to
 * one of the EXEC flag names. Walks through `|`/`+` BinaryOperators, parens,
 * and implicit casts. Returns the matching name (e.g. "PROT_EXEC") or null.
 */
function findExecFlagInExpr(n: AnyNode | undefined): string | null {
  if (!n) return null;
  const u = unwrap(n);
  if (!u) return null;
  if (u.kind === "DeclRefExpr") {
    const name = u.referencedDecl?.name ?? (u as any).name;
    if (typeof name === "string" && EXEC_FLAG_RE.test(name)) return name;
    return null;
  }
  if (u.kind === "BinaryOperator" || u.kind === "ParenExpr") {
    if (Array.isArray(u.inner)) {
      for (const c of u.inner) {
        const hit = findExecFlagInExpr(c);
        if (hit) return hit;
      }
    }
  }
  // For UnaryOperator or other wrapper expressions, descend defensively.
  if (Array.isArray(u.inner)) {
    for (const c of u.inner) {
      const hit = findExecFlagInExpr(c);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Resolve the textual name of a CallExpr's callee. Clang typically nests an
 * ImplicitCastExpr → DeclRefExpr as the first inner child of CallExpr.
 */
function calleeName(callExpr: AnyNode): string | null {
  if (!Array.isArray(callExpr.inner) || callExpr.inner.length === 0) return null;
  const first = callExpr.inner[0];
  const dre = unwrap(first);
  if (!dre) return null;
  if (dre.kind === "DeclRefExpr") {
    return dre.referencedDecl?.name ?? (dre as any).name ?? null;
  }
  // For CXXMemberCallExpr / member-style routing not relevant here.
  return null;
}

function detectP3(astRoot: AnyNode): BandASite[] {
  const sites: BandASite[] = [];
  walkLoc(astRoot, (n, fn, loc) => {
    if (n.kind !== "CallExpr") return;
    const name = calleeName(n);
    if (!name || !EXEC_FN_RE.test(name)) return;
    // Args are inner[1..]. Search each for a PROT_EXEC / PAGE_EXECUTE_* flag
    // appearing at any depth (covers `PROT_READ | PROT_WRITE | PROT_EXEC`).
    const args = (n.inner ?? []).slice(1);
    let flag: string | null = null;
    for (const a of args) {
      flag = findExecFlagInExpr(a);
      if (flag) break;
    }
    if (!flag) return;
    sites.push({
      pattern: "P3",
      identifier: "band-a-mprotect-exec",
      file: loc.file,
      line: loc.line,
      column: loc.column,
      function: fn,
      evidence: `${name}(...) called with ${flag} flag`,
      confidence: "high",
      remediation: "use --engine=required, or annotate enclosing function with #pragma c2ts engine",
    });
  });
  return sites;
}

// ── Pattern P5: MMIO hardcoded address ───────────────────────────────────

/** Known MMIO ranges → "high" confidence regardless of address-alignment heuristic. */
function isKnownMmioRange(addr: number): boolean {
  // LAPIC default base
  if (addr >= 0xfee00000 && addr < 0xfee01000) return true;
  // IO-APIC default base
  if (addr >= 0xfec00000 && addr < 0xfec01000) return true;
  // BIOS framebuffer (text-mode + EGA/VGA region)
  if (addr >= 0xb8000 && addr < 0xc0000) return true;
  // Anything in the high MMIO window (≥ 0xf0000000) on x86 is conventionally
  // memory-mapped device space.
  if (addr >= 0xf0000000) return true;
  return false;
}

/**
 * Decide the address-alignment confidence band:
 *   - "high"   if isKnownMmioRange
 *   - "medium" if address ≥ 0x1000 AND aligned to 0x100 or 0x1000
 *   - "low"    otherwise
 */
function addrConfidence(addr: number): "high" | "medium" | "low" {
  if (isKnownMmioRange(addr)) return "high";
  if (addr >= 0x1000 && (addr % 0x1000 === 0 || addr % 0x100 === 0)) return "medium";
  return "low";
}

/** Bump confidence one level (low→medium→high; high stays high). */
function bumpConfidence(c: "high" | "medium" | "low"): "high" | "medium" | "low" {
  if (c === "low") return "medium";
  if (c === "medium") return "high";
  return "high";
}

/**
 * Parse an IntegerLiteral node's value to a JavaScript number. Clang's JSON
 * AST emits the value as a string for large integers; we accept decimal,
 * hex (0x...), and octal (0...) literals.
 */
function intLitValue(n: AnyNode): number | null {
  const v: any = n.value;
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;
  // Try Number() first; it handles 0x..., decimal, and floats.
  const parsed = Number(v);
  if (Number.isFinite(parsed)) return parsed;
  return null;
}

/** Heuristic: does the type string carry `*` and a `volatile` qualifier on the pointee? */
function pointeeIsVolatile(qualType: string | undefined): boolean {
  if (!qualType) return false;
  // "volatile T *" or "T volatile *" — pointee-side volatile.
  // Strip a trailing "*" group and inspect the rest.
  const m = qualType.match(/^(.*?)\s*\*+\s*(?:const)?\s*$/);
  if (!m) return false;
  const pointee = m[1];
  return /\bvolatile\b/.test(pointee);
}

/** Is the qualType a pointer type? */
function isPointerType(qualType: string | undefined): boolean {
  if (!qualType) return false;
  return /\*\s*(?:const)?\s*$/.test(qualType);
}

function detectP5(astRoot: AnyNode): BandASite[] {
  const sites: BandASite[] = [];
  walkLoc(astRoot, (n, fn, loc) => {
    if (n.kind !== "CStyleCastExpr") return;
    const targetType = n.type?.qualType;
    if (!isPointerType(targetType)) return;
    // Source operand: inner[0] (after stripping any nested ImplicitCast layers
    // that Clang sometimes inserts between CStyleCastExpr and IntegerLiteral).
    const src0 = Array.isArray(n.inner) && n.inner.length > 0 ? n.inner[0] : undefined;
    let src: AnyNode | undefined = src0;
    while (src && (src.kind === "ImplicitCastExpr" || src.kind === "ParenExpr")) {
      src = Array.isArray(src.inner) && src.inner.length > 0 ? src.inner[0] : undefined;
    }
    if (!src || src.kind !== "IntegerLiteral") return;
    const addr = intLitValue(src);
    if (addr === null) return;
    let conf = addrConfidence(addr);
    if (conf === "low") return; // skip low-confidence per spec
    // Volatile bump: if the pointee carries `volatile`, bump one level.
    if (pointeeIsVolatile(targetType)) conf = bumpConfidence(conf);
    const hex = "0x" + addr.toString(16);
    sites.push({
      pattern: "P5",
      identifier: "band-a-mmio-hardcoded-address",
      file: loc.file,
      line: loc.line,
      column: loc.column,
      function: fn,
      evidence: `integer-to-pointer cast: (${targetType ?? "T*"})${hex}`,
      confidence: conf,
      remediation: "use --engine=required, or annotate enclosing function with #pragma c2ts engine",
    });
  });
  return sites;
}

// ── Stubbed patterns (for future "care" atoms) ────────────────────────────

function detectP1(_astRoot: AnyNode): BandASite[] { return []; } // EFLAGS-precise asm
function detectP2(_astRoot: AnyNode): BandASite[] { return []; } // JIT byte-write codegen
function detectP4(_astRoot: AnyNode): BandASite[] { return []; } // rdtsc control-flow
function detectP6(_astRoot: AnyNode): BandASite[] { return []; } // x87 80-bit
function detectP8(_astRoot: AnyNode): BandASite[] { return []; } // sub-ms scheduling

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Optional source-content map: key = absolute path of a file present in the
 * AST's loc/range entries; value = the file's textual contents. The detector
 * uses this to recover Pattern P7's inline-asm template (Clang does not
 * expose the asm template in the JSON AST, so the template is sliced from
 * the source file's contents using the GCCAsmStmt's source range — the same
 * technique the emitter uses).
 *
 * If `sources` is omitted, P7 still detects builtin-call use of
 * `__builtin_ia32_aa[adms]` / `da[as]`, but inline-asm templates containing
 * `aaa`/`aad`/etc. will be missed.
 */
export interface DetectOptions {
  sources?: Map<string, string>;
}

/**
 * Walk the AST once per pattern and aggregate the detected sites. Detection
 * is read-only and side-effect-free; the caller decides what to do with the
 * result (CLI prompt, log, fail-the-build, etc.).
 *
 * Currently active detectors: P3, P5, P7. Patterns P1, P2, P4, P6, P8 are
 * stubs returning [].
 */
export function detectBandA(astRoot: any, opts?: DetectOptions): DetectionResult {
  if (!astRoot || typeof astRoot !== "object") {
    return { sites: [] };
  }
  const sources = opts?.sources;
  const sites: BandASite[] = [];
  sites.push(...detectP1(astRoot));
  sites.push(...detectP2(astRoot));
  sites.push(...detectP3(astRoot));
  sites.push(...detectP4(astRoot));
  sites.push(...detectP5(astRoot));
  sites.push(...detectP6(astRoot));
  sites.push(...detectP7(astRoot, sources));
  sites.push(...detectP8(astRoot));
  return { sites };
}
