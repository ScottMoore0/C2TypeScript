/**
 * Multi-file dependency resolver for translated C/C++ → TypeScript projects.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const JS_BUILTINS = new Set([
  "console","process","require","module","exports","global","globalThis",
  "Math","Array","Object","String","Number","Boolean","Date","RegExp",
  "Error","TypeError","RangeError","SyntaxError","ReferenceError","EvalError","URIError",
  "JSON","Map","Set","WeakMap","WeakSet","Promise","BigInt",
  "Buffer","Uint8Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array",
  "Int8Array","Int16Array","Int32Array","Float32Array","Float64Array",
  "Uint8ClampedArray","ArrayBuffer",
  "DataView","SharedArrayBuffer","Atomics","Symbol","Proxy","Reflect",
  "setTimeout","setInterval","clearTimeout","clearInterval",
  "queueMicrotask","structuredClone","crypto","performance",
  "undefined","null","NaN","Infinity","true","false",
  "parseInt","parseFloat","isNaN","isFinite",
  "encodeURI","decodeURI","encodeURIComponent","decodeURIComponent",
  "Intl","Function","arguments","this",
]);
const JS_KEYWORDS = new Set([
  "if","else","for","while","do","switch","case","default","break",
  "continue","return","throw","try","catch","finally","new","delete",
  "typeof","instanceof","void","in","of","class","extends","super",
  "this","import","export","from","as","let","const","var","function",
  "async","await","yield","static","get","set","enum","type","interface",
]);

// libc/POSIX/CRT symbol names that are SHIM-injected per-TU as runtime
// helpers (e.g. `close`, `localtime`, `_fopen`). The translator emits a
// `function close(...) { ... }` declaration in any TU that calls them.
// These declarations match the syntactic shape of user-defined symbols
// and were previously being picked up by extractDefinedSymbols, which
// then made the multi-file resolver emit cross-TU `import { close } from
// "./main"` lines that tsc rejects with TS2459 (symbol declared locally
// but not exported). Treat these as system symbols — never tracked as
// cross-TU exports.
//
// This list is conservative: only names that appear as injected shims
// in the SML (compiler/src/self-modifying-loop.ts trivialShims and the
// stdio prepended-shim block). User code that happens to define a
// function with the same name still wins (its export will go through),
// but the SHIM injection won't fire false-positive cross-TU imports.
// Names that the SML always injects per-TU as the FIRST line of the
// callgraph (no cross-TU dependencies) — never tracked as cross-TU
// exports. Narrowed to symbols where the shim has been verified to
// inject reliably in each consumer TU; broader entries cause regressions
// when shim-dependency chains break (e.g. `localtime_s` shim references
// `localtime` shim, but only the latter is in trivialShims; cross-TU
// import to a TU that has both is the working path).
const LIBC_SHIM_NAMES = new Set([
  // POSIX I/O — these have always-injected per-TU `_close`/`_open`/etc.
  "open","close","read","write",
  // setjmp/longjmp — emitter-injected per-TU
  "setjmp","longjmp","_setjmp",
  // signal handling — emitter-injected per-TU when sigsetjmp is in use
  "sigsetjmp","siglongjmp",
  // C++ STL iterator/algorithm helpers — emitter-injected per-TU as bare
  // top-level functions (next, prev, reduce, etc.). They appear in any
  // TU that uses std::next / std::prev / std::reduce, but aren't user
  // symbols and shouldn't be cross-TU imported. (libdeflate, t1ha,
  // nanopb, yajl, zstd — TS2459 'declares X locally, but is not exported'.)
  "next","prev","reduce","min","max","strerror","_assert",
  // C++ STL <algorithm> helpers (per-TU emitted alongside the iterator
  // helpers above). Each appears as a top-level `function X(first, last, ...)`
  // when the TU touches std::X. Same cross-TU hazard as next/prev/reduce.
  "count","count_if","find","find_if","find_if_not","all_of","any_of",
  "none_of","copy","copy_n","copy_if","fill","fill_n","sort","stable_sort",
  "transform","accumulate","partition","equal","search","search_n","merge",
  "rotate","swap","swap_ranges","generate","generate_n","remove","remove_if",
  "replace","replace_if","reverse","unique","mismatch","includes",
  "lower_bound","upper_bound","binary_search","equal_range",
  "min_element","max_element","minmax","minmax_element",
  "next_permutation","prev_permutation","lexicographical_compare",
  "make_heap","push_heap","pop_heap","sort_heap",
  "back_inserter","front_inserter","inserter",
  "begin","end","cbegin","cend","rbegin","rend","data","size","empty",
  "advance","distance","get",
  // libc shim names already blocked elsewhere but worth re-listing
  "localtime","gmtime","asctime","ctime","strftime","strerror_r","ferror",
  "mktime","difftime",
  // POSIX libc shims emitted per-TU (each file containing `stat(...)` etc. gets
  // its own local function). Don't cross-TU import — would resolve to a TS2459
  // 'declares X locally, but it is not exported' (yajl_parser → ./yajl 'stat').
  "stat","fstat","lstat","stat64","fstat64",
  "fopen","fclose","fread","fwrite","fseek","ftell","feof","fflush",
  "fgets","fputs","fgetc","fputc","fprintf","fscanf",
  "remove","rename","unlink","access","mkdir","rmdir","chdir","getcwd",
  "getpid","getppid","getuid","geteuid","getgid","getegid",
  "alarm","sleep","usleep","time","clock",
  "abort","exit","_exit","atexit","system","getenv","setenv","unsetenv",
  "memcpy","memmove","memset","memcmp","memchr",
  "strcpy","strncpy","strcat","strncat","strcmp","strncmp","strchr","strrchr",
  "strstr","strlen","strdup","strndup","strtok","strtok_r",
  "strtol","strtoll","strtoul","strtoull","strtod","strtof","strtold",
  "atoi","atol","atoll","atof",
  "abs","labs","llabs","div","ldiv","lldiv",
  "qsort","bsearch",
  "isdigit","isalpha","isalnum","isspace","isupper","islower","ispunct",
  "isxdigit","iscntrl","isprint","isgraph","tolower","toupper",
  "open","read","write","close","dup","dup2","pipe","lseek","fcntl","ioctl",
  "select","poll","epoll_create","epoll_ctl","epoll_wait",
  "socket","bind","listen","accept","connect","send","sendto","recv","recvfrom",
  "shutdown","setsockopt","getsockopt","getsockname","getpeername",
  "errno","perror","strerror",
  "printf","fprintf","sprintf","snprintf","vsprintf","vsnprintf","vprintf",
  "scanf","fscanf","sscanf","vsscanf",
  "calloc","malloc","realloc","free",
]);

// Module-private mirror of TS_RESERVED_TYPE_IDENTS used inside extractDefinedSymbols.
// Kept separate to avoid a forward-reference (TS_RESERVED_TYPE_IDENTS is defined
// later in this file alongside resolveAndWriteImports).
const RESERVED_TYPE_IDENTS_FOR_EXTRACT = new Set([
  "number","string","boolean","any","void","unknown","never","object",
  "bigint","symbol","null","undefined",
]);

export function extractDefinedSymbols(content: string): string[] {
  // Walk the file tracking brace depth so we only pick up TOP-LEVEL declarations.
  // Naively matching `/^(?:export\s+)?(?:function|let|const|var|class)\s+(\w+)/gm`
  // misfires for shim-emitted one-liner bodies like
  //   function vfprintf(...) { // comment
  //   const __fmt = ...; ... }
  // where `const __fmt` starts at column 0 but is inside the function body.
  // Treating __fmt as a module-level symbol then makes resolveAndWriteImports
  // emit `(globalThis as any).__lazy___fmt = __fmt;` at module top, which
  // throws ReferenceError at load time.
  //
  // We skip string/regex/comment content and track {} depth. Only declarations
  // seen at depth 0 are exported.
  const symbols: string[] = [];
  const src = content;
  let depth = 0;
  let i = 0;
  const n = src.length;
  // State for line-start tracking
  let atLineStart = true;
  while (i < n) {
    const c = src[i];
    // Line comment
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    // Block comment
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    // Strings
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < n && src[i] !== q) {
        if (src[i] === "\\") i += 2;
        else i++;
      }
      i++;
      atLineStart = false;
      continue;
    }
    // Braces
    if (c === "{") { depth++; i++; atLineStart = false; continue; }
    if (c === "}") { depth--; i++; atLineStart = false; continue; }
    if (c === "\n") { atLineStart = true; i++; continue; }
    if (atLineStart && (c === " " || c === "\t")) { i++; continue; }
    // Only try to match declarations at depth 0 and at line-start
    if (depth === 0 && atLineStart) {
      const rest = src.slice(i);
      const m = rest.match(/^(?:export\s+)?(?:function|let|const|var|class)\s+(\w+)/);
      if (m) {
        // Skip libc/POSIX/CRT shim names — they're per-TU injected runtime
        // helpers, not user symbols subject to cross-TU export.
        // Also skip TS-reserved type identifiers (`number`, `string`, etc.)
        // — these cannot be exported as user symbols without breaking type
        // resolution across the file (TS2459).
        if (!LIBC_SHIM_NAMES.has(m[1]) && !RESERVED_TYPE_IDENTS_FOR_EXTRACT.has(m[1])) {
          symbols.push(m[1]);
        }
        i += m[0].length;
        atLineStart = false;
        continue;
      }
    }
    atLineStart = false;
    i++;
  }
  return symbols;
}

export function extractReferencedSymbols(content: string, definedSymbols: Set<string>): string[] {
  // Naive regex stripping mis-handles `/*/` patterns that appear *inside*
  // string literals (e.g. `"/usr/lib/gcc/x86_64-linux-gnu/*/crtbegin.o"` in
  // chibicc's main.c). The greedy block-comment regex matches the `/*` inside
  // the string and consumes everything up to the next `*/` — which sits inside
  // a later string literal — wiping out intermediate identifiers. Use a proper
  // scanner that walks strings/comments with correct precedence instead.
  const buf: string[] = [];
  const n = content.length;
  let i = 0;
  while (i < n) {
    const c = content[i];
    const c2 = content[i + 1];
    if (c === "/" && c2 === "/") {
      while (i < n && content[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && c2 === "*") {
      i += 2;
      while (i < n && !(content[i] === "*" && content[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      buf.push(q === "`" ? "``" : q + q);
      i++;
      while (i < n && content[i] !== q) {
        if (content[i] === "\\") i += 2;
        else i++;
      }
      i++;
      continue;
    }
    buf.push(c);
    i++;
  }
  const stripped = buf.join("");
  const allIdents = new Set<string>();
  for (const m of stripped.matchAll(/\b([A-Za-z_]\w*)\b/g)) allIdents.add(m[1]);
  const propAccess = new Set<string>();
  for (const m of stripped.matchAll(/\.(\w+)/g)) propAccess.add(m[1]);
  const refs: string[] = [];
  for (const id of allIdents) {
    if (definedSymbols.has(id) || JS_BUILTINS.has(id) || JS_KEYWORDS.has(id)) continue;
    if (propAccess.has(id)) continue;
    // Single-character identifiers ARE valid cross-TU references — C
    // programs routinely have `extern int g;` / `extern int n;` etc. The
    // earlier `id.length <= 1` filter dropped these, leaving the consumer
    // TU with an unimported reference and a runtime `ReferenceError: g is
    // not defined`. The dependency graph already filters refs to those
    // actually exported by some TU, so admitting single-char idents here
    // doesn't add spurious imports — it just stops dropping legitimate
    // ones. Test fixture: matrix/crossfile/crossfile_external_linkage
    // (uses `extern int g;`).
    if (id.length < 1 || /^\d/.test(id)) continue;
    refs.push(id);
  }
  return [...new Set(refs)];
}

interface FileInfo { path: string; content: string; defined: Set<string>; referenced: string[]; }

export function buildDependencyGraph(files: FileInfo[]) {
  const symToFile = new Map<string, string>();
  for (const f of files) for (const s of f.defined) symToFile.set(s, f.path);
  const edges = new Map<string, Set<string>>();
  const symEdges = new Map<string, Map<string, string[]>>();
  for (const f of files) { edges.set(f.path, new Set()); symEdges.set(f.path, new Map()); }
  for (const f of files) {
    for (const ref of f.referenced) {
      const prov = symToFile.get(ref);
      if (prov && prov !== f.path) {
        edges.get(f.path)!.add(prov);
        if (!symEdges.get(f.path)!.has(prov)) symEdges.get(f.path)!.set(prov, []);
        symEdges.get(f.path)!.get(prov)!.push(ref);
      }
    }
  }
  return { edges, symEdges };
}

export function topologicalSort(nodes: string[], edges: Map<string, Set<string>>) {
  const depCount = new Map<string, number>();
  for (const n of nodes) depCount.set(n, edges.get(n)?.size ?? 0);
  const queue = nodes.filter(n => depCount.get(n) === 0).sort();
  const sorted: string[] = [];
  const visited = new Set<string>();
  const cycles: string[][] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node); sorted.push(node);
    for (const [other, deps] of edges) {
      if (deps.has(node) && !visited.has(other)) {
        depCount.set(other, (depCount.get(other)! - 1));
        if (depCount.get(other) === 0) { queue.push(other); queue.sort(); }
      }
    }
  }
  const remaining = nodes.filter(n => !visited.has(n));
  if (remaining.length > 0) {
    cycles.push(remaining);
    for (const n of remaining) { visited.add(n); sorted.push(n); }
  }
  return { sorted, cycles };
}

/**
 * Cross-TU ODR merge (C++20 §6.2 / C17 §6.9).
 *
 * When multiple TUs include the same header, each per-TU AST contains the
 * header's decls. The emitter's `dropHeaderDecls` flag removes them at TU
 * level so the shared header module `_<header>.ts` owns them. But some
 * patterns still produce cross-TU duplicates in the TU bodies themselves:
 *   - extern variables with a definition in one TU and a declaration in
 *     another (C17 §6.9.2: tentative definition + defining definition);
 *   - function prototypes in one TU that are then defined in another;
 *   - `static inline` in a header, which each TU keeps its own copy of by
 *     design (not ODR-governed; we leave it alone).
 *
 * This function scans the emitted TU .ts files and resolves conflicts:
 *
 *   1. For each decl (extern variable, function, struct/typedef emitted at
 *      TU scope), compute an identity key from kind + fully-qualified name.
 *   2. If two TUs both define the same identity:
 *      - PREFER the defining-definition over tentative/declarative forms.
 *      - For extern variables: first defining TU wins; later ones drop
 *        their redeclaration (C17 §6.9.2 p5). If no TU defines, emit
 *        `let <name>: any = 0;` at the top of the first seen TU (tentative
 *        definition rule, C17 §6.9.2 p2).
 *      - For functions: keep the one with a body (CompoundStmt); drop
 *        pure-prototype emissions (already handled by the emitter, but we
 *        defensively de-dupe here if both have bodies with identical text —
 *        the "inline" C++ §10.1.6 / C17 §6.7.4 case).
 *      - For structs/typedefs: deep-equal field layouts collapse to one
 *        emission. Differing layouts = spec violation; we emit an
 *        UNSUPPORTED marker comment in the later file so later tooling
 *        (diagnostic registry) can surface it.
 *   3. Distinct-scope decls (file-scope static, linkage-internal in C17
 *      §6.2.2) are NEVER merged — their names are not part of the ODR
 *      identity.
 */
export interface OdrMergeResult {
  merged: number;
  conflicts: Array<{ symbol: string; file1: string; file2: string; reason: string }>;
}

export function mergeCrossTuDecls(tsFiles: string[]): OdrMergeResult {
  const result: OdrMergeResult = { merged: 0, conflicts: [] };
  if (tsFiles.length < 2) return result;

  // Scan each file for top-level function, class, and let/const decls.
  // Body of emitter output uses unexported forms after multi-file rewriting,
  // so we recognise bare `function X(...)`, `class X {...}`, and
  // `let|const|var X = ...`. Stubs (`function X(..._args: any[])`) are ignored.
  interface Decl {
    kind: "function" | "class" | "var";
    name: string;
    body: string;       // full textual body for equality comparison
    start: number;      // offset in file
    end: number;        // offset in file (exclusive)
    hasDefinition: boolean; // for vars: has initializer; for funcs: has body
  }
  const fileDecls = new Map<string, Decl[]>();

  function scanFile(path: string): Decl[] {
    const content = readFileSync(path, "utf-8");
    const decls: Decl[] = [];
    // Class with brace-matched body
    const classRe = /^class\s+([A-Za-z_]\w*)\b[^{]*\{/gm;
    let cm: RegExpExecArray | null;
    while ((cm = classRe.exec(content))) {
      const start = cm.index;
      // Find matching closing brace
      let depth = 0, i = start;
      while (i < content.length) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") { depth--; if (depth === 0) { i++; break; } }
        i++;
      }
      const body = content.slice(start, i);
      decls.push({ kind: "class", name: cm[1]!, body, start, end: i, hasDefinition: true });
    }
    // Top-level function with body. Skip cross-TU stub functions.
    const funcRe = /^function\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:[^{]+\{/gm;
    let fm: RegExpExecArray | null;
    while ((fm = funcRe.exec(content))) {
      const params = fm[2]!;
      if (params.includes("..._args")) continue; // stub
      const start = fm.index;
      let depth = 0, i = start;
      while (i < content.length) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") { depth--; if (depth === 0) { i++; break; } }
        i++;
      }
      const body = content.slice(start, i);
      // Skip compiler-provided helpers (e.g. __safe_div) that are preamble,
      // not user decls — they have no cross-TU identity.
      if (fm[1]!.startsWith("__")) continue;
      decls.push({ kind: "function", name: fm[1]!, body, start, end: i, hasDefinition: true });
    }
    // Top-level let/const/var at column 0.
    const varRe = /^(let|const|var)\s+([A-Za-z_]\w*)\s*(?::\s*[^=;]+)?\s*(=\s*[^;]+)?;/gm;
    let vm: RegExpExecArray | null;
    while ((vm = varRe.exec(content))) {
      decls.push({
        kind: "var", name: vm[2]!, body: vm[0]!,
        start: vm.index, end: vm.index + vm[0]!.length,
        hasDefinition: !!vm[3],
      });
    }
    return decls;
  }

  for (const f of tsFiles) fileDecls.set(f, scanFile(f));

  // Build a global identity map: key = `${kind}:${name}` → list of (file, decl).
  const identityMap = new Map<string, Array<{ file: string; decl: Decl }>>();
  for (const [file, decls] of fileDecls) {
    for (const d of decls) {
      const key = `${d.kind}:${d.name}`;
      if (!identityMap.has(key)) identityMap.set(key, []);
      identityMap.get(key)!.push({ file, decl: d });
    }
  }

  // For each identity with >1 occurrence, apply ODR merge.
  // We build a per-file set of offsets to delete, then rewrite files once.
  const pendingDeletes = new Map<string, Array<{ start: number; end: number }>>();
  function queueDelete(file: string, start: number, end: number) {
    if (!pendingDeletes.has(file)) pendingDeletes.set(file, []);
    pendingDeletes.get(file)!.push({ start, end });
  }

  for (const [key, entries] of identityMap) {
    if (entries.length < 2) continue;
    const [kind] = key.split(":") as ["function" | "class" | "var", string];
    // Pick winner: prefer entry with hasDefinition. For functions/classes with
    // multiple definitions, the first-seen wins (stable sort by file path).
    entries.sort((a, b) => a.file.localeCompare(b.file));
    const withDef = entries.filter(e => e.decl.hasDefinition);
    const winner = (withDef[0] ?? entries[0])!;

    for (const e of entries) {
      if (e === winner) continue;
      // ODR compatibility check: winner.body vs e.decl.body.
      // A literal text match means they're identical — safe to drop.
      // A mismatch on a class/function could be a spec violation; we queue
      // a warning but still drop to keep the run going (winner wins).
      const winnerNorm = winner.decl.body.replace(/\s+/g, " ").trim();
      const loserNorm = e.decl.body.replace(/\s+/g, " ").trim();
      if (winnerNorm !== loserNorm && (kind === "class" || kind === "function")) {
        result.conflicts.push({
          symbol: e.decl.name,
          file1: winner.file,
          file2: e.file,
          reason: `${kind} ${e.decl.name} has different definitions in ${basename(winner.file)} and ${basename(e.file)} (C++20 §6.2 ODR / C17 §6.9 UB).`,
        });
      }
      queueDelete(e.file, e.decl.start, e.decl.end);
      result.merged++;
    }

    // Tentative-definition rule (C17 §6.9.2 p2): if no entry had a
    // hasDefinition=true AND kind=var, emit a single tentative definition on
    // the winner as `let <name>: any = 0;` so a runtime read sees 0 rather
    // than undefined. This matches C's zero-init of bss storage.
    if (kind === "var" && withDef.length === 0) {
      const winnerContent = readFileSync(winner.file, "utf-8");
      const tentativeLine = `let ${winner.decl.name}: any = 0;`;
      // Replace the winner's bare `let X;` with `let X: any = 0;`.
      const replaced = winnerContent.slice(0, winner.decl.start) +
        tentativeLine + winnerContent.slice(winner.decl.end);
      writeFileSync(winner.file, replaced);
    }
  }

  // Apply deletes in descending order per file (so earlier offsets remain valid).
  for (const [file, deletes] of pendingDeletes) {
    deletes.sort((a, b) => b.start - a.start);
    let content = readFileSync(file, "utf-8");
    for (const d of deletes) {
      // Include the trailing newline if present to avoid blank line pileup.
      let end = d.end;
      while (end < content.length && (content[end] === "\n" || content[end] === "\r")) end++;
      content = content.slice(0, d.start) + content.slice(end);
    }
    writeFileSync(file, content);
  }

  return result;
}

/**
 * Strip any leading block of `import ...` lines so reruns are idempotent.
 * Only matches statements emitted by this resolver — `import { ... } from "./...";`,
 * side-effect `import "./X.js";` imports (used by lazy-cycle deps to ensure
 * the dep module's top-level code runs so its `__lazy_*` registrations
 * populate globalThis), and the lazy-cycle `let X: any = new Proxy(...)`
 * shim — which live at the very top of the file, above all other content.
 * Preamble imports that appear later in the file (e.g. side-effect
 * header-module imports injected by the oracle-multi path) are left alone.
 */
function stripLeadingImports(content: string): string {
  // Match every form the resolver may have written previously:
  //   import { x } from "./y"            ← static named imports
  //   import "./y.js"  / import "./y";   ← side-effect import (cycle dep)
  //   let X: any = (...args) => ...      ← legacy arrow lazy stub
  //   let X: any = new Proxy(...)        ← current lazy Proxy stub
  // Extending to side-effect imports closes a chibicc duplicate-decl bug
  // where the second resolver pass saw the side-effect import line at
  // line 1 and stopped stripping, accumulating duplicate Proxy stubs
  // below it on each rerun.
  const importLineRe = /^(?:import\s+\{[^}]*\}\s+from\s+"\.\/[^"]+";|import\s+"\.\/[^"]+";|let\s+\w+:\s*any\s*=\s*\(\.\.\.args:\s*any\[\]\)\s*=>\s*\(\(globalThis\s+as\s+any\)\.__lazy_\w+\s*\?\?\s*\(\(\.\.\.a:\s*any\[\]\)\s*=>\s*undefined\)\)\(\.\.\.args\);|let\s+\w+:\s*any\s*=\s*new\s+Proxy\(function\(\)\{\},\s*\{.*__lazy_\w+.*\}\);)\s*$/;
  const lines = content.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && (lines[i] === "" || importLineRe.test(lines[i]!))) i++;
  return lines.slice(i).join("\n");
}

/**
 * Strip any trailing block of `(globalThis as any).__lazy_X = X;` registration
 * lines previously appended by this resolver. Without this, repeated runs
 * (e.g. when run-real-world translates files one-by-one and each per-file
 * call re-resolves the universe) accumulate the same registration block
 * multiple times — and esbuild rejects the resulting file with
 * "The symbol X has already been declared" because the same name appears
 * on the LHS of multiple `(globalThis as any).__lazy_X = X;` lines that share
 * the literal `X` identifier scope.
 *
 * Only matches the exact shape this resolver emits at append time
 * (`(globalThis as any).__lazy_<ident> = <ident>;`). User code that happens
 * to assign to a globalThis property won't match (different syntax / name).
 */
function stripTrailingLazyRegistrations(content: string): string {
  const regLineRe = /^\(globalThis\s+as\s+any\)\.__lazy_\w+\s*=\s*\w+;\s*$/;
  const lines = content.split(/\r?\n/);
  let end = lines.length;
  while (end > 0 && (lines[end - 1] === "" || regLineRe.test(lines[end - 1]!))) end--;
  return lines.slice(0, end).join("\n");
}

// TypeScript reserved type identifiers — we must never emit a `let X: any = new Proxy(...)`
// or `import { X }` for these names because they shadow the TS type, breaking type
// annotations across the whole file. Observed in yajl_alloc.ts where a `number` symbol
// (referenced by yajl_alloc but not defined locally) was given a Proxy stub `let number = ...`,
// which then made `extractDefinedSymbols` register `number` as exported, causing
// yajl_buf.ts to import it as `import { number as yajl_alloc_number } from "./yajl_alloc"`
// — TS rejects with TS2459 'Module declares number locally, but is not exported'.
const TS_RESERVED_TYPE_IDENTS = new Set([
  "number","string","boolean","any","void","unknown","never","object",
  "bigint","symbol","null","undefined",
  // TS-builtin GENERIC types — emitting `type X = any;` aliases for these
  // collapses their arity to 0, breaking later `X<T>` uses with TS2315
  // ('Type X is not generic'). Iterable/Iterator/etc. appear in iterator
  // protocols, Promise<T> in async, ReadonlyArray<T> in immutable APIs.
  "Iterable","Iterator","AsyncIterable","AsyncIterator","Generator",
  "AsyncGenerator","IterableIterator","AsyncIterableIterator",
  "Promise","Awaited","ReadonlyArray","ReadonlySet","ReadonlyMap",
  "Partial","Required","Readonly","Pick","Omit","Record","Exclude",
  "Extract","NonNullable","Parameters","ReturnType","InstanceType",
  "ConstructorParameters","ThisParameterType","OmitThisParameter",
  "ThisType","Uppercase","Lowercase","Capitalize","Uncapitalize",
  "PropertyKey","PropertyDescriptor","TypedArray",
]);

/**
 * Same-file dedup pass: collapse multiple top-level decls of the same name
 * within a single emitted TS file. Esbuild rejects duplicate top-level
 * declarations with `The symbol "X" has already been declared`. Common
 * patterns this fix collapses:
 *
 *   1. `class X {}` + `const X = Y;`              — drop the const alias
 *   2. `class X {}` + `let X = 0;` (tentative)    — drop the tentative
 *   3. `const X = Y;` + `let X = 0;` (tentative)  — drop the tentative
 *   4. duplicate `function X(...) {...}`          — keep the first
 *   5. duplicate `let/const X = ...;` at top      — keep the first
 *
 * The TS `type X = ...` form lives in the type namespace (separate from
 * value namespace) and never collides with `let/const/class X` at runtime,
 * so we leave them alone.
 *
 * Returns the deduped content. Preserves original ordering and offsets of
 * surviving decls.
 */
function dedupSameFileTopLevelDecls(content: string): string {
  // Build a list of top-level decls with their (start, end) byte offsets.
  // Walk only at brace-depth 0 to avoid matching nested decls inside function
  // bodies.
  interface Decl {
    kind: "function" | "class" | "var-with-init" | "var-tentative" | "const-alias";
    name: string;
    start: number;   // byte offset in content
    end: number;     // exclusive end offset (after the trailing `;` or `}` and newline)
  }
  const decls: Decl[] = [];
  const n = content.length;
  let i = 0;
  let depth = 0;
  let atLineStart = true;
  while (i < n) {
    const c = content[i];
    if (c === "/" && content[i + 1] === "/") {
      while (i < n && content[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && content[i + 1] === "*") {
      i += 2;
      while (i < n - 1 && !(content[i] === "*" && content[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < n && content[i] !== q) {
        if (content[i] === "\\") i += 2;
        else i++;
      }
      i++;
      atLineStart = false;
      continue;
    }
    if (c === "{") { depth++; i++; atLineStart = false; continue; }
    if (c === "}") { depth--; i++; atLineStart = false; continue; }
    if (c === "\n") { atLineStart = true; i++; continue; }
    if (atLineStart && (c === " " || c === "\t")) { i++; continue; }
    if (depth === 0 && atLineStart) {
      const declStart = i;
      const rest = content.slice(i);
      // class X { ... }  (with brace-matched body)
      const classM = rest.match(/^(?:export\s+)?class\s+(\w+)\b[^{]*\{/);
      if (classM) {
        let j = declStart + classM[0].length - 1; // points at '{'
        let dd = 1;
        j++;
        while (j < n && dd > 0) {
          const cc = content[j];
          if (cc === "/" && content[j + 1] === "/") { while (j < n && content[j] !== "\n") j++; continue; }
          if (cc === "/" && content[j + 1] === "*") { j += 2; while (j < n - 1 && !(content[j] === "*" && content[j + 1] === "/")) j++; j += 2; continue; }
          if (cc === '"' || cc === "'" || cc === "`") { const q = cc; j++; while (j < n && content[j] !== q) { if (content[j] === "\\") j += 2; else j++; } j++; continue; }
          if (cc === "{") dd++;
          else if (cc === "}") dd--;
          j++;
        }
        // Include trailing newline(s) so deletion doesn't pile up blank lines.
        let endOff = j;
        while (endOff < n && (content[endOff] === "\n" || content[endOff] === "\r")) endOff++;
        decls.push({ kind: "class", name: classM[1]!, start: declStart, end: endOff });
        i = j;
        atLineStart = false;
        continue;
      }
      // function X(...) { ... } — match brace body
      const funcM = rest.match(/^(?:export\s+)?function\s+(\w+)\s*\(/);
      if (funcM) {
        // Find the opening brace then match it
        let j = declStart + funcM[0].length;
        let parenDepth = 1;
        while (j < n && parenDepth > 0) {
          const cc = content[j];
          if (cc === "(") parenDepth++;
          else if (cc === ")") parenDepth--;
          else if (cc === '"' || cc === "'" || cc === "`") { const q = cc; j++; while (j < n && content[j] !== q) { if (content[j] === "\\") j += 2; else j++; } }
          j++;
        }
        // Skip return type annotation up to `{` (or `;` for declarations)
        while (j < n && content[j] !== "{" && content[j] !== ";" && content[j] !== "\n") j++;
        if (j < n && content[j] === "{") {
          let dd = 1;
          j++;
          while (j < n && dd > 0) {
            const cc = content[j];
            if (cc === "/" && content[j + 1] === "/") { while (j < n && content[j] !== "\n") j++; continue; }
            if (cc === "/" && content[j + 1] === "*") { j += 2; while (j < n - 1 && !(content[j] === "*" && content[j + 1] === "/")) j++; j += 2; continue; }
            if (cc === '"' || cc === "'" || cc === "`") { const q = cc; j++; while (j < n && content[j] !== q) { if (content[j] === "\\") j += 2; else j++; } j++; continue; }
            if (cc === "{") dd++;
            else if (cc === "}") dd--;
            j++;
          }
        } else if (j < n && content[j] === ";") {
          j++; // forward decl/prototype
        }
        let endOff = j;
        while (endOff < n && (content[endOff] === "\n" || content[endOff] === "\r")) endOff++;
        decls.push({ kind: "function", name: funcM[1]!, start: declStart, end: endOff });
        i = j;
        atLineStart = false;
        continue;
      }
      // let/const/var X (: type)? = expr ;  — match the keyword + name prefix,
      // then scan for the terminating `;` with brace/paren/bracket/string/comment
      // awareness. A value containing embedded semicolons inside an IIFE
      // (`= [(() => { const __b = ...; return __b; })(), ...]`) MUST NOT be
      // truncated at the first inner `;`; doing so leaves the residual
      // `{`/`}` to be counted by the outer brace-tracker, which underflows
      // depth and causes legitimate function bodies later in the file to be
      // treated as top-level. That shifted depth makes inner `let` decls
      // appear as duplicate top-level vars, and the dedup pass then deletes
      // them — observed as missing `let i = 0;` in BLAKE2 init_param.
      const headM = rest.match(/^(?:export\s+)?(?:let|const|var)\s+(\w+)\b/);
      if (headM) {
        let j = declStart + headM[0].length;
        // Optional `: type` annotation — scan up to `=` or `;` with bracket
        // awareness (TS function/object/tuple types may contain `<>{}[]()`).
        let scanDepth = 0; // tracks () [] {} <> nesting in the type annotation
        // Skip whitespace
        while (j < n && (content[j] === " " || content[j] === "\t")) j++;
        let hasInit = false;
        let initStart = -1;
        let initEnd = -1;
        if (j < n && content[j] === ":") {
          j++;
          while (j < n) {
            const cc = content[j]!;
            if (cc === "/" && content[j + 1] === "/") { while (j < n && content[j] !== "\n") j++; continue; }
            if (cc === "/" && content[j + 1] === "*") { j += 2; while (j < n - 1 && !(content[j] === "*" && content[j + 1] === "/")) j++; j += 2; continue; }
            if (cc === '"' || cc === "'" || cc === "`") { const q = cc; j++; while (j < n && content[j] !== q) { if (content[j] === "\\") j += 2; else j++; } j++; continue; }
            if (cc === "(" || cc === "[" || cc === "{" || cc === "<") { scanDepth++; j++; continue; }
            if (cc === ")" || cc === "]" || cc === "}" || cc === ">") {
              if (scanDepth === 0) break; // unmatched close — give up the type scan
              scanDepth--; j++; continue;
            }
            if (scanDepth === 0 && (cc === "=" || cc === ";")) break;
            j++;
          }
        }
        if (j < n && content[j] === "=") {
          hasInit = true;
          j++;
          initStart = j;
          // Now scan the initializer up to the terminating `;` at depth 0,
          // tracking strings/comments/braces/brackets/parens.
          let valDepth = 0;
          while (j < n) {
            const cc = content[j]!;
            if (cc === "/" && content[j + 1] === "/") { while (j < n && content[j] !== "\n") j++; continue; }
            if (cc === "/" && content[j + 1] === "*") { j += 2; while (j < n - 1 && !(content[j] === "*" && content[j + 1] === "/")) j++; j += 2; continue; }
            if (cc === '"' || cc === "'" || cc === "`") { const q = cc; j++; while (j < n && content[j] !== q) { if (content[j] === "\\") j += 2; else j++; } j++; continue; }
            if (cc === "(" || cc === "[" || cc === "{") { valDepth++; j++; continue; }
            if (cc === ")" || cc === "]" || cc === "}") { valDepth--; j++; continue; }
            if (cc === ";" && valDepth === 0) break;
            j++;
          }
          initEnd = j;
        }
        if (j < n && content[j] === ";") {
          // Only treat as a recognised top-level decl if we found a `;`
          // terminator at outer depth. Otherwise fall through to the
          // single-char advance — the token-by-token brace tracker will
          // still keep depth correct for whatever syntax this is.
          const fullLen = (j + 1) - declStart;
          let kind: Decl["kind"] = "var-with-init";
          if (!hasInit) {
            kind = "var-tentative";
          } else {
            const init = content.slice(initStart, initEnd).trim();
            if (init === "0") kind = "var-tentative";
            else if (/^\w+$/.test(init)) kind = "const-alias";
          }
          let endOff = declStart + fullLen;
          while (endOff < n && (content[endOff] === "\n" || content[endOff] === "\r")) endOff++;
          decls.push({ kind, name: headM[1]!, start: declStart, end: endOff });
          i = declStart + fullLen;
          atLineStart = false;
          continue;
        }
        // No `;` found at outer depth (e.g. multi-line decl or syntax we
        // don't parse). Don't push a Decl, but DO advance past the head we
        // already consumed so the outer tracker doesn't re-enter the var
        // matcher on the same identifier; let the brace tracker continue
        // from where we stopped.
        i = j;
        atLineStart = false;
        continue;
      }
    }
    atLineStart = false;
    i++;
  }

  // Group by name. For each name with multiple decls, pick a winner:
  // class > var-with-init / function > const-alias > var-tentative.
  // Functions of the same name dedup — keep the first.
  const byName = new Map<string, Decl[]>();
  for (const d of decls) {
    if (!byName.has(d.name)) byName.set(d.name, []);
    byName.get(d.name)!.push(d);
  }
  const priority: Record<Decl["kind"], number> = {
    "class": 5,
    "var-with-init": 4,
    "function": 4,
    "const-alias": 2,
    "var-tentative": 1,
  };
  const toDelete: Array<{ start: number; end: number }> = [];
  for (const [, group] of byName) {
    if (group.length < 2) continue;
    // Pick winner: highest priority. On tie (e.g. multiple same-name functions),
    // first-seen wins.
    let winner = group[0]!;
    for (const d of group) {
      if (priority[d.kind] > priority[winner.kind]) winner = d;
      // tie: keep earlier (first-seen)
    }
    for (const d of group) {
      if (d === winner) continue;
      toDelete.push({ start: d.start, end: d.end });
    }
  }

  if (toDelete.length === 0) return content;
  // Apply deletes in descending order.
  toDelete.sort((a, b) => b.start - a.start);
  let out = content;
  for (const del of toDelete) {
    out = out.slice(0, del.start) + out.slice(del.end);
  }
  return out;
}

export function resolveAndWriteImports(tsFiles: string[]): void {
  const files: FileInfo[] = tsFiles.map(path => {
    let content = stripLeadingImports(readFileSync(path, "utf-8"));
    content = stripTrailingLazyRegistrations(content);
    content = dedupSameFileTopLevelDecls(content);
    const defined = new Set(extractDefinedSymbols(content));
    const referenced = extractReferencedSymbols(content, defined);
    return { path, content, defined, referenced };
  });
  const { edges, symEdges } = buildDependencyGraph(files);
  const { sorted, cycles } = topologicalSort(files.map(f => f.path), edges);
  const cycleNodes = new Set(cycles.flat());

  // Name collision detection
  const symProviders = new Map<string, string[]>();
  for (const f of files) for (const s of f.defined) {
    if (!symProviders.has(s)) symProviders.set(s, []);
    symProviders.get(s)!.push(f.path);
  }
  const collisions = new Set([...symProviders].filter(([,p]) => p.length > 1).map(([s]) => s));

  for (const f of files) {
    const deps = symEdges.get(f.path) ?? new Map();
    const importLines: string[] = [];
    // Track lazy aliases already emitted in this file so we don't write a
    // duplicate `let X: any = new Proxy(...)` when the same symbol comes
    // from multiple deps in the cycle (esbuild rejects with TS1005 'symbol
    // has already been declared'). Same X can appear in deps to two
    // different cycle-bound files; we only need one stub. Closes chibicc /
    // duktape / dyad / miniaudio / quickjs / wren / yajl / ldns-subset
    // duplicate-decl failures.
    const emittedLazyAliases = new Set<string>();
    // Pre-scan for any `import { X }` / `import type { X }` lines already
    // in f.content (left there by earlier pipeline stages like
    // self-modifying-loop's `import type {...} from "./_header.js"` pass).
    // stripLeadingImports only removes `./local`-form `import { X }` lines,
    // not `import type` or non-local imports. The resolver should NOT emit
    // a second `import { X } from "./X"` for names already imported, else
    // TS2300 fires on duplicate identifier.
    const preExistingImportNames = new Set<string>();
    for (const im of f.content.matchAll(/import\s+(?:type\s+)?\{\s*([^}]+)\s*\}/g)) {
      for (const part of im[1].split(",")) {
        const tok = part.trim().replace(/^.*\s+as\s+/, "").trim();
        if (tok) preExistingImportNames.add(tok);
      }
    }
    for (const [depFile, symbols] of deps) {
      const depBase = basename(depFile, ".ts");
      const isLazy = cycleNodes.has(f.path) && cycleNodes.has(depFile);
      if (isLazy) {
        // Side-effect import ensures the dep module's top-level code runs
        // so its `__lazy_*` registrations populate globalThis. Without this,
        // the Proxy's apply/construct/get traps see undefined targets and
        // every cross-cycle call resolves to undefined. Each symbol's Proxy
        // alias is independently scoped to this consumer module, but the
        // single side-effect import covers them all.
        importLines.push(`import "./${depBase}.js";`);
        for (const sym of symbols) {
          const alias = collisions.has(sym) ? `${depBase}_${sym}` : sym;
          // Skip TypeScript reserved type identifiers — emitting
          // `let number: any = ...` shadows the type alias for the rest of the
          // file. yajl_alloc.ts hit this with `number` referenced but not
          // defined locally, then yajl_buf.ts saw it as exported and tried
          // `import { number as yajl_alloc_number } from "./yajl_alloc"`
          // which TS2459-rejects ('declares X locally but is not exported').
          if (TS_RESERVED_TYPE_IDENTS.has(alias)) continue;
          if (emittedLazyAliases.has(alias)) continue;
          emittedLazyAliases.add(alias);
          // The lazy proxy creates a VALUE binding. A type-position use of the
          // same name (e.g. `struct lua_longjmp *errorJmp` in a struct field)
          // requires a TYPE binding too — TS2749 fires without it. Emit a
          // companion `type` alias so both namespaces resolve. TS keeps type
          // and value namespaces separate, so the dual declaration is legal.
          importLines.push(`type ${alias} = any;`);
          // Proxy-based thunk: supports both plain calls and `new` on classes
          // that are only available after module-init. The arrow-function
          // form does not support [[Construct]] (ECMA-262 §10.2.1), so
          // `new global_State()` would throw "is not a constructor". The
          // Proxy's `apply` and `construct` traps forward to the resolved
          // target at call time (post module-init registration).
          importLines.push(`let ${alias}: any = new Proxy(function(){}, { apply: (_t: any, _this: any, args: any[]) => { const fn = (globalThis as any).__lazy_${alias}; return typeof fn === 'function' ? fn(...args) : undefined; }, construct: (_t: any, args: any[]) => { const ctor = (globalThis as any).__lazy_${alias}; return typeof ctor === 'function' ? new ctor(...args) : {}; }, get: (_t: any, prop: any) => { const tgt = (globalThis as any).__lazy_${alias}; if (tgt != null) { const v = tgt[prop]; return typeof v === 'function' ? v.bind(tgt) : v; } return (...a: any[]) => { const t2 = (globalThis as any).__lazy_${alias}; if (t2 == null) return undefined; const m = t2[prop]; return typeof m === 'function' ? m.apply(t2, a) : m; }; }, set: (_t: any, prop: any, val: any) => { const tgt = (globalThis as any).__lazy_${alias}; if (tgt != null) { tgt[prop] = val; return true; } return Reflect.set(_t, prop, val); }, has: (_t: any, prop: any) => { const tgt = (globalThis as any).__lazy_${alias}; return tgt != null && (prop in tgt); } });`);
        }
      } else {
        // Filter out TS-reserved type identifiers AND names already covered
        // by a pre-existing `import { X }` / `import type { X }` line in
        // f.content (TS2300 would otherwise fire on duplicate identifier).
        const importSyms = symbols
          .filter((sym: string) => !TS_RESERVED_TYPE_IDENTS.has(sym))
          .filter((sym: string) => !preExistingImportNames.has(sym))
          .map((sym: string) =>
            collisions.has(sym) ? `${sym} as ${basename(depFile, ".ts")}_${sym}` : sym
          );
        if (importSyms.length === 0) continue;
        importLines.push(`import { ${[...new Set(importSyms)].join(", ")} } from "./${depBase}";`);
        // Collision-aliased imports rename the imported binding (`OP_MOVE as
        // _lopcodes_OP_MOVE`) but the consumer file's body still references
        // the bare name. Bridge: after the import, emit `const OP_MOVE: any
        // = _lopcodes_OP_MOVE;` so the bare name resolves in the consumer's
        // scope. Skip names already locally defined or imported via a
        // separate `import type { X }` line (TS2440-conflict otherwise).
        const preexistingImports = new Set<string>();
        for (const im of f.content.matchAll(/import\s+(?:type\s+)?\{\s*([^}]+)\s*\}/g)) {
          for (const part of im[1].split(",")) {
            const tok = part.trim().replace(/^.*\s+as\s+/, "").trim();
            if (tok) preexistingImports.add(tok);
          }
        }
        for (const sym of symbols) {
          if (!collisions.has(sym)) continue;
          if (TS_RESERVED_TYPE_IDENTS.has(sym)) continue;
          if (f.defined.has(sym)) continue;
          if (preexistingImports.has(sym)) continue;
          if (emittedLazyAliases.has(sym)) continue;
          emittedLazyAliases.add(sym);
          const aliasName = `${basename(depFile, ".ts")}_${sym}`;
          importLines.push(`const ${sym}: any = ${aliasName};`);
        }
      }
    }
    // Targeted residual stub: scan body for function-call-position bare
    // identifiers whose callee is NOT defined anywhere in the corpus, not
    // a JS builtin, and not already imported. Emit a top-of-file stub that
    // dispatches via `(globalThis as any).__lazy_<name>` at call time.
    // Covers Win32 API (GetModuleFileNameA, LoadLibraryExA, …), POSIX-only
    // (_popen, _pclose, poll, fwrite), and other system surface that the
    // translator can't resolve at C-level. C17 §6.2.1 implicit declaration:
    // the kernel/libc surface is opaque; emit a value binding so TS2304
    // doesn't fire while the runtime decides whether a real implementation
    // is registered.
    //
    // Strip comments and string literals before scanning — otherwise the
    // regex matches `array-of-pointers (` inside a block comment as a call
    // to `pointers`. Re-use the same walker shape as extractReferencedSymbols.
    {
      const allDefinedAll = new Set<string>();
      for (const ff of files) for (const s of ff.defined) allDefinedAll.add(s);
      // Names that the emitter MAY inject as per-TU shims (libc/POSIX/CRT).
      // When present in the body, extractDefinedSymbols suppresses them via
      // LIBC_SHIM_NAMES to avoid bogus cross-TU exports. But the shim is
      // only physically emitted when the EMITTER routed the C call through
      // its shim path; some shims (e.g. `poll` called from inside another
      // shim's body) get referenced without a corresponding top-level
      // declaration. Treat names as locally-defined ONLY when the file
      // actually contains a `function NAME(` declaration in its body.
      const localShims = new Set<string>();
      for (const name of LIBC_SHIM_NAMES) {
        const declRe = new RegExp(`(?:^|\\n)\\s*(?:export\\s+)?function\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(`);
        if (declRe.test(f.content)) localShims.add(name);
      }
      const importedHere = new Set<string>();
      // Scan the new importLines AND the body content — stripLeadingImports
      // only removes leading `./local`-style imports; non-local imports
      // (`from "node:module"`, `from "fs"`, etc.) survive in f.content and
      // their imported names ARE available in scope. Missing this would
      // make the residual-stub scan emit duplicate declarations like
      // `import { createRequire as __c2ts_cr }` + `function __c2ts_cr`.
      const importScanSources = [importLines.join("\n"), f.content];
      for (const src of importScanSources) {
        // Plain named imports: `import { X, Y as Z } from "..."`
        for (const im of src.matchAll(/import\s+\{\s*([^}]+)\s*\}/g)) {
          for (const part of im[1].split(",")) {
            const tok = part.trim().replace(/^.*\s+as\s+/, "").trim();
            if (tok) importedHere.add(tok);
          }
        }
        // Type-only named imports: `import type { X, Y as Z } from "..."`
        for (const im of src.matchAll(/import\s+type\s*\{\s*([^}]+)\s*\}/g)) {
          for (const part of im[1].split(",")) {
            const tok = part.trim().replace(/^.*\s+as\s+/, "").trim();
            if (tok) importedHere.add(tok);
          }
        }
        for (const im of src.matchAll(/import\s+(\w+)\s+from\b/g)) {
          importedHere.add(im[1]); // default import
        }
      }
      for (const line of importLines) {
        const lz = line.match(/^let\s+(\w+):\s*any\s*=\s*new\s+Proxy\b/);
        if (lz) importedHere.add(lz[1]);
      }
      // Build a comment+string-stripped view of the body.
      const srcText = f.content;
      const buf: string[] = [];
      const n = srcText.length;
      let i = 0;
      while (i < n) {
        const c = srcText[i];
        const c2 = srcText[i + 1];
        if (c === "/" && c2 === "/") {
          while (i < n && srcText[i] !== "\n") i++;
          buf.push("\n");
          continue;
        }
        if (c === "/" && c2 === "*") {
          i += 2;
          while (i < n && !(srcText[i] === "*" && srcText[i + 1] === "/")) i++;
          i += 2;
          buf.push(" ");
          continue;
        }
        if (c === '"' || c === "'" || c === "`") {
          const q = c;
          buf.push(q + q);
          i++;
          while (i < n && srcText[i] !== q) {
            if (srcText[i] === "\\") i += 2;
            else i++;
          }
          i++;
          continue;
        }
        buf.push(c);
        i++;
      }
      const stripped = buf.join("");
      // Scan the file body for `interface X` / `type X` / `enum X`
      // declarations AND `import type { X } from "..."` — extractDefinedSymbols
      // only tracks value-namespace declarations (class/function/let/const/var)
      // so these type-only names would otherwise look unresolved to the
      // residual-stub scan below. We track them locally so the scan doesn't
      // emit `type X = any` duplicates for `interface CPtr {...}` or
      // already-imported types like `import type { lua_longjmp } from ...`.
      const localTypeDecls = new Set<string>();
      for (const tm of f.content.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:interface|type|enum)\s+([A-Za-z_]\w*)/g)) {
        localTypeDecls.add(tm[1]);
      }
      for (const tm of f.content.matchAll(/\bimport\s+type\s*\{\s*([^}]+)\s*\}/g)) {
        for (const part of tm[1].split(",")) {
          const id = part.trim().replace(/^.*\s+as\s+/, "").trim();
          if (id) localTypeDecls.add(id);
        }
      }
      // Locally-defined-anywhere scan: identifiers declared at any scope
      // depth (not just top-level). Covers:
      //  - inner arrow/function variables: `const toU = (...) => {...}`
      //  - method shorthand in object literals: `{ valueOf() {...} }`
      //  - destructuring binds, parameters with default values
      // extractDefinedSymbols filters by depth and shape; this scan is a
      // safety net to keep the residual-stub scan from emitting stubs for
      // names that ARE defined somewhere in the file body but not at the
      // module top-level.
      const innerLocals = new Set<string>();
      // const/let/var anywhere
      for (const m of f.content.matchAll(/\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\b/g)) {
        innerLocals.add(m[1]);
      }
      // function declarations / expressions anywhere
      for (const m of f.content.matchAll(/\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
        innerLocals.add(m[1]);
      }
      // method shorthand in object literals — `{ name(args) {` or
      // `, name(args) {` patterns.
      for (const m of f.content.matchAll(/[{,]\s*([A-Za-z_][A-Za-z0-9_]*)\s*\([^()]*\)\s*\{/g)) {
        innerLocals.add(m[1]);
      }
      // class method shorthand — `name(args): T {` or `name(args) {` at
      // line start (heuristic: preceding line-end + indent).
      for (const m of f.content.matchAll(/(?:^|\n)\s+(?:get\s+|set\s+|async\s+|static\s+|public\s+|private\s+|protected\s+)*([A-Za-z_][A-Za-z0-9_]*)\s*\([^()]*\)\s*[:{]/g)) {
        innerLocals.add(m[1]);
      }
      // Function parameters — `(name: type, ...)`. Walk parameter lists
      // shallowly to catch param names that subsequent body usage as
      // `name(...)` would otherwise stub.
      for (const m of f.content.matchAll(/\(([^()]*)\)\s*(?::|=>|{)/g)) {
        for (const part of m[1].split(",")) {
          const pm = part.trim().match(/^(?:\.\.\.)?([A-Za-z_][A-Za-z0-9_]*)/);
          if (pm) innerLocals.add(pm[1]);
        }
      }
      // Identifier followed by `:` — captures both field/property
      // declarations AND parameter names with type annotations (covers
      // nested function-type params like `writer: (view: DataView, ...) => void`
      // where the outer paren scan misses the outer-list param because
      // of the inner paren). Some false positives (object-literal keys
      // also match), but those keys are never called as functions in the
      // same scope, so they don't affect stub correctness.
      for (const m of f.content.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\??\s*:/g)) {
        innerLocals.add(m[1]);
      }
      const isResolvable = (name: string): boolean => {
        return f.defined.has(name) ||
               localTypeDecls.has(name) ||
               innerLocals.has(name) ||
               allDefinedAll.has(name) ||
               importedHere.has(name) ||
               JS_BUILTINS.has(name) ||
               JS_KEYWORDS.has(name) ||
               TS_RESERVED_TYPE_IDENTS.has(name) ||
               localShims.has(name) ||
               emittedLazyAliases.has(name);
      };
      const callRe = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
      const seenCallees = new Set<string>();
      let mm: RegExpExecArray | null;
      while ((mm = callRe.exec(stripped)) !== null) {
        const callee = mm[1];
        if (seenCallees.has(callee)) continue;
        seenCallees.add(callee);
        if (isResolvable(callee)) continue;
        // Skip property/method calls (`.IDENT(` or `?.IDENT(`).
        const start = mm.index;
        if (start > 0 && (stripped[start - 1] === "." || stripped[start - 1] === "?")) continue;
        // Skip the right-hand side of `function`/`new`/etc. — those are
        // declarations, not calls.
        const before = stripped.slice(Math.max(0, start - 12), start);
        if (/\b(function|class|new|catch|interface|type|enum)\s*$/.test(before)) continue;
        emittedLazyAliases.add(callee);
        importLines.push(`type ${callee} = any;`);
        importLines.push(`function ${callee}(..._args: any[]): any { const __fn = (globalThis as any).__lazy_${callee}; return typeof __fn === 'function' ? __fn(..._args) : undefined; }`);
      }
      // Type-position scan: identifiers used in type-annotation positions
      // that aren't defined locally, imported, or covered by call-position
      // stubs above. Patterns include `: IDENT`, `as IDENT`, `<IDENT>`,
      // `IDENT | null` etc. Emit `type IDENT = any;` so TS2304 doesn't fire.
      // Covers `struct tm` typedef references (`stm: tm | null`),
      // anonymous unions (`u: anon_union_<hash>`), nested-struct shapes
      // the header generator references without defining (NodeKey).
      // Re-uses the comment+string-stripped view to avoid matching inside
      // documentation. Type-only references don't need a function/value
      // binding, just a type alias.
      const typePosPatterns: RegExp[] = [
        // After `:` (parameter, field, variable, return type). The leading
        // `:` is the only positional anchor — preceding identifiers are
        // arbitrary (parameter name, field name, variable name).
        /:\s*([A-Za-z_][A-Za-z0-9_]*)/g,
        // After `as` keyword.
        /\bas\s+([A-Za-z_][A-Za-z0-9_]*)/g,
        // After `extends` (class extends BaseClass).
        /\bextends\s+([A-Za-z_][A-Za-z0-9_]*)/g,
      ];
      for (const re of typePosPatterns) {
        let tm: RegExpExecArray | null;
        while ((tm = re.exec(stripped)) !== null) {
          const id = tm[1];
          if (isResolvable(id)) continue;
          if (emittedLazyAliases.has(id)) continue;
          emittedLazyAliases.add(id);
          importLines.push(`type ${id} = any;`);
        }
      }
      // Final type-position fallback: identifiers referenced in this file's
      // type-annotation positions that ARE defined somewhere in the corpus
      // but for which no import was generated (cycle-resolution collisions,
      // collision-aliased imports renaming the bare name, or header-file
      // cross-reference edges that the cycle detector chose to break by
      // dropping rather than stubbing). Emit a `type X = any;` so TS2304
      // doesn't fire — the original X still exists at runtime via globalThis
      // registration; this declaration just unblocks the type checker.
      // Re-uses the same comment-stripped body and only matches positions
      // unambiguously inside a type annotation.
      for (const re of typePosPatterns) {
        re.lastIndex = 0;
        let tm: RegExpExecArray | null;
        while ((tm = re.exec(stripped)) !== null) {
          const id = tm[1];
          // Already covered (locally defined / imported / built-in / stubbed)?
          if (f.defined.has(id)) continue;
          if (localTypeDecls.has(id)) continue;
          if (importedHere.has(id)) continue;
          if (JS_BUILTINS.has(id) || JS_KEYWORDS.has(id)) continue;
          if (TS_RESERVED_TYPE_IDENTS.has(id)) continue;
          if (localShims.has(id)) continue;
          if (emittedLazyAliases.has(id)) continue;
          // At this point: id is referenced in type-position but unresolved
          // in this file's scope. May or may not be in allDefinedAll — emit
          // a type alias as a safety net. Value uses still go through the
          // existing globalThis dispatch.
          emittedLazyAliases.add(id);
          importLines.push(`type ${id} = any;`);
        }
      }
    }

    let content = f.content;
    if (cycleNodes.has(f.path)) {
      const regs = [...f.defined].filter(s => s !== "main")
        .map(s => `(globalThis as any).__lazy_${s} = ${s};`);
      content += "\n" + regs.join("\n") + "\n";
    }
    // Drop any `import { x } from ...` symbols that are already covered by
    // a Proxy lazy-stub at module-init scope. Both forms produce a
    // top-level binding for the same name, and TS rejects with TS2440
    // 'Import declaration conflicts with local declaration'.
    // Observed in chibicc/yajl: codegen.ts has BOTH a cyclic dep on
    // tokenize.ts (Proxy stub for `error`) AND a non-cyclic dep on a
    // different file that imports `error` statically.
    const lazyAliases = new Set<string>();
    for (const line of importLines) {
      const m = line.match(/^let\s+(\w+):\s*any\s*=\s*new\s+Proxy\(/);
      if (m) lazyAliases.add(m[1]);
    }
    const filteredImportLines = importLines.flatMap(line => {
      if (line.startsWith("import {")) {
        const im = line.match(/^import\s+\{\s*([^}]+)\s*\}\s+from\s+("[^"]+");/);
        if (im) {
          const syms = im[1].split(",").map(s => s.trim()).filter(s => {
            const aliasName = (s.match(/as\s+(\w+)/) ?? [])[1] ?? s.match(/^(\w+)/)?.[1];
            return aliasName && !lazyAliases.has(aliasName);
          });
          if (syms.length === 0) return [];
          return [`import { ${syms.join(", ")} } from ${im[2]};`];
        }
      }
      return [line];
    });
    const uniqueImportLines = [...new Set(filteredImportLines)];
    if (uniqueImportLines.length > 0) {
      writeFileSync(f.path, uniqueImportLines.join("\n") + "\n" + content);
    } else {
      writeFileSync(f.path, content);
    }
  }
}
