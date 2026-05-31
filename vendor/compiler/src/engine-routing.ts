/**
 * Engine-routing metadata (Engine Phase 2 atoms D13 + D14).
 *
 * Per `compiler/plans/band-a-necessity-detection.md` §5 (D13 + D14) and
 * `compiler/plans/rust-wasm-engine-roadmap.md` §13.3 — this module establishes
 * the per-function engine-routing metadata that the future engine-routing
 * emitter consults. The metadata has three sources, in precedence order:
 *
 *   1. `#pragma c2ts engine`     — pragma above a function definition
 *      `#pragma c2ts no_engine`  — explicit opt-out
 *      Pragma always wins over the global `--engine` mode (D13).
 *   2. `__attribute__((hot))`      — engine-route under `--engine=hotpath`
 *      `__attribute__((cold))`     — never engine-route (overrides promotion)
 *      Attribute is consulted when no pragma is set (D14).
 *   3. The global `--engine={off|hotpath|required}` mode plus Band-A
 *      detection from `band-a-detector.ts`.
 *
 * The metadata is plain TypeScript here; the routing emitter (Engine Phase 2
 * "main work" per the roadmap §13.8 step 5) will read this map keyed on the
 * function's name. We deliberately do not touch `emitter.ts`'s
 * visitFunctionDecl in this dispatch — only register the metadata.
 *
 * Threading model: a single per-process map. Translation runs are sequential
 * within one CLI invocation, and the matrix runner spawns one process per TU,
 * so collisions on the same function name across TUs are not a concern.
 */

// ── Public types ─────────────────────────────────────────────────────────

export type EngineRoutingDecision =
  | "pragma-engine"     // #pragma c2ts engine — always engine-route
  | "pragma-no-engine"  // #pragma c2ts no_engine — never engine-route
  | "attr-hot"          // __attribute__((hot)) — engine-route under --engine=hotpath
  | "attr-cold"         // __attribute__((cold)) — never engine-route
  | "default";          // no annotation; falls through to global mode

export interface EngineRoutingEntry {
  function: string;
  decision: EngineRoutingDecision;
  /** Source location where the annotation was found, for diagnostics. */
  file?: string;
  line?: number;
}

// ── Metadata store ───────────────────────────────────────────────────────

const routingByFunction = new Map<string, EngineRoutingEntry>();

/**
 * Register a routing decision for a named function. Precedence (highest first):
 *   pragma-engine / pragma-no-engine > attr-hot / attr-cold > default
 *
 * If a higher-precedence entry already exists, this call is a no-op. This
 * lets D13 (pragma scan) run before D14 (attribute walk) and have its
 * decision stick even if both are present.
 */
export function registerEngineRouting(entry: EngineRoutingEntry): void {
  if (!entry.function) return;
  const existing = routingByFunction.get(entry.function);
  if (existing && precedence(existing.decision) >= precedence(entry.decision)) {
    return;
  }
  routingByFunction.set(entry.function, entry);
}

function precedence(d: EngineRoutingDecision): number {
  switch (d) {
    case "pragma-engine":
    case "pragma-no-engine":
      return 3;
    case "attr-hot":
    case "attr-cold":
      return 2;
    case "default":
      return 1;
  }
}

/** Lookup the engine-routing decision for a function. */
export function getEngineRouting(functionName: string): EngineRoutingEntry | undefined {
  return routingByFunction.get(functionName);
}

/**
 * Resolve the final engine-routing answer given the global mode + per-function
 * metadata + whether the function contains a Band-A site. Returns `true` if
 * the function should be engine-routed, `false` otherwise.
 *
 * Precedence (highest first), per band-a-necessity-detection.md §5 (D13/D14):
 *   1. Pragma always wins:  pragma-engine ⇒ true; pragma-no-engine ⇒ false
 *   2. attr-cold ⇒ false (never route, even if otherwise promoted)
 *   3. Band-A site present in this function ⇒ true (under any mode except
 *      `engine=off` with the user choosing to translate anyway via stubs)
 *   4. attr-hot ⇒ true under `engine=hotpath` or `engine=required`; else false
 *   5. global `engine=required` ⇒ true; otherwise false
 */
export function resolveEngineRouting(
  functionName: string,
  globalMode: "off" | "hotpath" | "required",
  hasBandASite: boolean,
): boolean {
  const entry = routingByFunction.get(functionName);
  if (entry) {
    if (entry.decision === "pragma-engine") return true;
    if (entry.decision === "pragma-no-engine") return false;
    if (entry.decision === "attr-cold") return false;
    if (entry.decision === "attr-hot") {
      return globalMode === "hotpath" || globalMode === "required";
    }
  }
  if (hasBandASite && globalMode !== "off") return true;
  if (globalMode === "required") return true;
  return false;
}

/** Clear all metadata. Used by tests to start with a clean slate. */
export function resetEngineRouting(): void {
  routingByFunction.clear();
}

/** Iterate over all registered routing entries (diagnostics + tests). */
export function listEngineRouting(): EngineRoutingEntry[] {
  return Array.from(routingByFunction.values());
}

// ── D13: pragma source-text scanner ──────────────────────────────────────

/**
 * Scan source-text for `#pragma c2ts engine` / `#pragma c2ts no_engine`
 * directly above a function definition, and register the resulting routing
 * decision for that function.
 *
 * The scanner is preprocessor-friendly:
 *   - blank lines and C/C++ comments between the pragma and the function head
 *     are tolerated;
 *   - other pragmas / attributes / `static` / `inline` / `extern` qualifiers
 *     between the pragma and the function head are tolerated;
 *   - the pragma binds to the FIRST function definition that follows it.
 *
 * We deliberately use a regex/line-scan rather than a real preprocessor — this
 * matches how `c23-feature` detection works in `self-modifying-loop.ts` (the
 * existing precedent at L1311-1338 — a pre-Clang source-text scan).
 *
 * Returns the count of pragmas registered, for tests.
 */
export function scanPragmasInSource(source: string, file?: string): number {
  // Strip block comments first so a `/* #pragma c2ts engine */` doesn't fire.
  const stripped = stripComments(source);
  // Match `#pragma c2ts engine` or `#pragma c2ts no_engine` at start-of-line
  // (allowing leading whitespace). Capture which kind, and the byte offset so we
  // can recover the line number for diagnostics.
  const re = /^[ \t]*#[ \t]*pragma[ \t]+c2ts[ \t]+(no_engine|engine)\b/gm;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const kind = m[1];
    const pragmaEnd = m.index + m[0].length;
    const fnName = findNextFunctionName(stripped, pragmaEnd);
    if (!fnName) continue;
    const line = lineNumberAt(stripped, m.index);
    registerEngineRouting({
      function: fnName,
      decision: kind === "engine" ? "pragma-engine" : "pragma-no-engine",
      file,
      line,
    });
    count++;
  }
  return count;
}

/** Strip C/C++ comments while preserving newlines (so line numbers stay aligned). */
function stripComments(s: string): string {
  let out = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const n = s[i + 1];
    if (c === "/" && n === "/") {
      // line comment — skip to newline (preserve the newline)
      while (i < s.length && s[i] !== "\n") i++;
    } else if (c === "/" && n === "*") {
      // block comment — preserve newlines inside it
      i += 2;
      while (i + 1 < s.length && !(s[i] === "*" && s[i + 1] === "/")) {
        if (s[i] === "\n") out += "\n";
        i++;
      }
      i += 2;
    } else if (c === '"' || c === "'") {
      // skip string/char literal as-is
      out += s[i++]!;
      while (i < s.length && s[i] !== c) {
        if (s[i] === "\\" && i + 1 < s.length) { out += s[i++]!; }
        out += s[i++]!;
      }
      if (i < s.length) out += s[i++]!;
    } else {
      out += s[i++]!;
    }
  }
  return out;
}

/** 1-based line number for a 0-based byte offset. */
function lineNumberAt(s: string, offset: number): number {
  let n = 1;
  for (let i = 0; i < offset && i < s.length; i++) {
    if (s[i] === "\n") n++;
  }
  return n;
}

/**
 * Starting at `start` in `source`, skip over whitespace, comments, attribute
 * specifications, storage-class keywords, and other pragmas, then attempt to
 * recognise a function definition head and return its name. Returns null if
 * no function definition follows before another `#pragma c2ts (no_)?engine`
 * directive.
 */
function findNextFunctionName(source: string, start: number): string | null {
  // We accept anything between the pragma and the function head as long as
  // we find a pattern of: `<type-tokens> <name>(<args>)` followed by `{` or
  // `;` (we want only definitions, not declarations — bind to `{`).
  //
  // The full C grammar is unnecessary here; we use a simple regex that finds
  // the first `<ident>(...)<ws>{` after `start`, where the `<ident>` is the
  // function name. Type-qualifier prefixes (static/inline/extern/__attribute__)
  // are absorbed by the leading-tokens segment; they don't affect the name
  // capture.
  //
  // Stop scanning if we hit another `#pragma c2ts (no_)?engine` directive
  // before finding a function — pragmas should not bind across other pragmas.
  const tail = source.slice(start);
  // Bound the search: don't cross another c2ts-engine pragma directive.
  const nextPragmaRe = /^[ \t]*#[ \t]*pragma[ \t]+c2ts[ \t]+(no_engine|engine)\b/m;
  const nextPragmaMatch = nextPragmaRe.exec(tail);
  const searchEnd = nextPragmaMatch ? nextPragmaMatch.index : tail.length;
  const region = tail.slice(0, searchEnd);
  // Function definition recognizer: <return-type-tokens> <ident> ( <args> )
  // <opt asm/attr> { ... — we capture the identifier immediately preceding
  // the parameter list. To avoid catching control-flow constructs (if, while,
  // for, switch, sizeof, return), we restrict to identifiers not in the
  // C-keyword set.
  const KEYWORDS = new Set([
    "if", "while", "for", "switch", "sizeof", "return", "do", "else",
    "case", "default", "break", "continue", "goto", "typedef", "struct",
    "union", "enum", "const", "volatile", "restrict", "static", "inline",
    "extern", "register", "auto", "_Atomic", "_Alignas", "_Alignof",
    "_Generic", "_Static_assert", "_Thread_local", "alignas", "alignof",
    "_Noreturn", "_BitInt", "void", "char", "short", "int", "long", "float",
    "double", "signed", "unsigned", "_Bool", "_Complex", "_Imaginary",
    "_Decimal32", "_Decimal64", "_Decimal128",
  ]);
  // Pattern: identifier ( ... ) ws { — the simplest function-definition shape
  // We allow nested parens in the parameter list via a small bounded scan.
  const fnHeadRe = /\b([A-Za-z_]\w*)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = fnHeadRe.exec(region)) !== null) {
    const name = m[1]!;
    if (KEYWORDS.has(name)) continue;
    // Match-position for the opening `(`
    const openParen = m.index + m[0].length - 1;
    // Find the matching `)` with a paren counter.
    let depth = 1;
    let i = openParen + 1;
    while (i < region.length && depth > 0) {
      const c = region[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      i++;
    }
    if (depth !== 0) continue;
    // After the closing `)`, look for an opening `{` (definition) or `;`
    // (mere declaration — skip and keep searching). Allow whitespace,
    // attribute specifications, and `__asm__("...")` declarators between.
    let j = i;
    while (j < region.length) {
      const ch = region[j];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") { j++; continue; }
      if (ch === "{") return name;
      if (ch === ";") break; // declaration, not definition
      // Skip a balanced (...) block (e.g. `__attribute__((...))`) or skip
      // forward one char and keep scanning.
      if (ch === "(") {
        let d = 1; j++;
        while (j < region.length && d > 0) {
          if (region[j] === "(") d++;
          else if (region[j] === ")") d--;
          j++;
        }
        continue;
      }
      j++;
    }
    // If we got here we found a declaration; keep searching.
  }
  return null;
}

// ── D14: AST-based attribute scanner ─────────────────────────────────────

/**
 * Walk a Clang JSON AST and, for every FunctionDecl carrying a HotAttr or
 * ColdAttr child, register the corresponding routing decision. This is
 * purely metadata-population; the routing emitter consults it later.
 *
 * `attr-cold` always disables routing (overrides everything except a pragma),
 * while `attr-hot` enables routing under `--engine=hotpath` or `=required`.
 */
export function scanAttributesInAST(astRoot: any): number {
  let count = 0;
  walk(astRoot, (n) => {
    if (n?.kind !== "FunctionDecl" || !n.name) return;
    const attrs = (n.inner ?? []) as any[];
    let hot = false;
    let cold = false;
    for (const a of attrs) {
      if (a?.kind === "HotAttr") hot = true;
      else if (a?.kind === "ColdAttr") cold = true;
    }
    if (cold) {
      registerEngineRouting({
        function: n.name,
        decision: "attr-cold",
        file: n.loc?.file,
        line: n.loc?.line,
      });
      count++;
    } else if (hot) {
      registerEngineRouting({
        function: n.name,
        decision: "attr-hot",
        file: n.loc?.file,
        line: n.loc?.line,
      });
      count++;
    }
  });
  return count;
}

function walk(node: any, cb: (n: any) => void): void {
  if (!node || typeof node !== "object") return;
  cb(node);
  if (Array.isArray(node.inner)) {
    for (const c of node.inner) walk(c, cb);
  }
}
