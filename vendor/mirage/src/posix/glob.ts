// Mirage POSIX <glob.h> — pathname pattern expansion.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<glob.h>:
//       int glob(const char *pattern, int flags,
//                int (*errfunc)(const char *epath, int eerrno),
//                glob_t *pglob);
//       void globfree(glob_t *pglob);
//       struct glob_t { size_t gl_pathc; char **gl_pathv; size_t gl_offs; };
//
// Behaviour
// ---------
//   * Splits `pattern` on '/' into segments. Each segment is expanded by
//     listing the parent directory (via Node fs.readdirSync) and matching
//     entries with fnmatch(FNM_PATHNAME). Hidden entries (leading '.') are
//     skipped unless GLOB_PERIOD is set or the pattern segment starts with
//     a literal '.'.
//   * Results are sorted alphabetically (POSIX requires sort unless
//     GLOB_NOSORT). On no match the call returns GLOB_NOMATCH (3) unless
//     GLOB_NOCHECK is set, in which case the literal pattern is returned.
//   * GLOB_APPEND lets a caller accumulate into an existing glob_t.
//   * GLOB_DOOFFS skips gl_offs leading slots in the result vector.
//   * GLOB_MARK appends '/' to directory matches.
//
// BRIDGE: posix-glob — POSIX glob → Node fs directory walk + fnmatch.

import { createRequire } from "node:module";
import { fnmatch, FNM_PATHNAME, FNM_PERIOD } from "./fnmatch.js";

// ---------------------------------------------------------------------------
// Flags + return codes.
// ---------------------------------------------------------------------------

export const GLOB_ERR        = 1 << 0;  // return on read error
export const GLOB_MARK       = 1 << 1;  // append '/' to dir matches
export const GLOB_NOSORT     = 1 << 2;  // don't sort
export const GLOB_DOOFFS     = 1 << 3;  // honor gl_offs
export const GLOB_NOCHECK    = 1 << 4;  // return pattern itself if no match
export const GLOB_APPEND     = 1 << 5;  // append to existing glob_t
export const GLOB_NOESCAPE   = 1 << 6;  // backslash is literal
export const GLOB_PERIOD     = 1 << 7;  // GNU: leading '.' may match by '*'
export const GLOB_MAGCHAR    = 1 << 8;  // (output) pattern had wildcards
export const GLOB_BRACE      = 1 << 10; // GNU: brace expansion
export const GLOB_TILDE      = 1 << 12; // GNU: tilde expansion
export const GLOB_ONLYDIR    = 1 << 13; // GNU: only match directories

export const GLOB_NOSPACE = 1;  // out of memory
export const GLOB_ABORTED = 2;  // read error, GLOB_ERR set or errfunc returned
export const GLOB_NOMATCH = 3;  // no match, GLOB_NOCHECK not set

/** POSIX glob_t. */
export interface glob_t {
  gl_pathc: number;
  gl_pathv: string[];
  gl_offs: number;
}

interface NodeFs {
  readdirSync: (p: string) => string[];
  statSync: (p: string) => { isDirectory: () => boolean };
}
let _fsCached: NodeFs | null = null;
function _fs(): NodeFs | null {
  if (_fsCached) return _fsCached;
  try {
    const req = createRequire(import.meta.url);
    _fsCached = req("node:fs") as NodeFs;
    return _fsCached;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Brace expansion (GNU): "a{b,c}d" → ["abd","acd"]. Nested supported.
// ---------------------------------------------------------------------------

function _expandBraces(pattern: string): string[] {
  const open = pattern.indexOf("{");
  if (open < 0) return [pattern];
  // Find matching close.
  let depth = 1;
  let i = open + 1;
  while (i < pattern.length && depth > 0) {
    if (pattern[i] === "{") depth++;
    else if (pattern[i] === "}") depth--;
    if (depth === 0) break;
    i++;
  }
  if (depth !== 0) return [pattern]; // unmatched
  const head = pattern.slice(0, open);
  const tail = pattern.slice(i + 1);
  // Split body by commas at depth 1.
  const body = pattern.slice(open + 1, i);
  const parts: string[] = [];
  let d = 0, start = 0;
  for (let k = 0; k < body.length; k++) {
    const c = body[k];
    if (c === "{") d++;
    else if (c === "}") d--;
    else if (c === "," && d === 0) { parts.push(body.slice(start, k)); start = k + 1; }
  }
  parts.push(body.slice(start));
  if (parts.length === 1) {
    // No commas → not a brace expansion; keep braces literal.
    return _expandBraces(head + "{" + body + "}" + tail);
  }
  const out: string[] = [];
  for (const p of parts) {
    for (const sub of _expandBraces(head + p + tail)) out.push(sub);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tilde expansion (GNU): "~/foo" → "$HOME/foo".
// ---------------------------------------------------------------------------

function _expandTilde(pattern: string): string {
  if (pattern.length === 0 || pattern[0] !== "~") return pattern;
  const slash = pattern.indexOf("/");
  const head = slash < 0 ? pattern : pattern.slice(0, slash);
  const rest = slash < 0 ? "" : pattern.slice(slash);
  if (head === "~") {
    const home = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env?.HOME
      ?? (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env?.USERPROFILE
      ?? "/";
    return home + rest;
  }
  // ~user — best-effort; we don't have getpwnam, so leave as-is.
  return pattern;
}

// ---------------------------------------------------------------------------
// Single-pattern glob.
// ---------------------------------------------------------------------------

function _hasMagic(seg: string, noescape: boolean): boolean {
  let escaped = false;
  for (let i = 0; i < seg.length; i++) {
    const c = seg[i];
    if (escaped) { escaped = false; continue; }
    if (!noescape && c === "\\") { escaped = true; continue; }
    if (c === "*" || c === "?" || c === "[") return true;
  }
  return false;
}

function _stripEscapes(seg: string, noescape: boolean): string {
  if (noescape) return seg;
  let out = "";
  for (let i = 0; i < seg.length; i++) {
    if (seg[i] === "\\" && i + 1 < seg.length) { out += seg[i + 1]; i++; }
    else out += seg[i];
  }
  return out;
}

function _expandOnePattern(pattern: string, flags: number): string[] {
  const fs = _fs();
  if (!fs) return [];

  const noescape = (flags & GLOB_NOESCAPE) !== 0;
  const period   = (flags & GLOB_PERIOD) === 0; // FNM_PERIOD active iff GLOB_PERIOD NOT set
  const onlydir  = (flags & GLOB_ONLYDIR) !== 0;

  // Normalize Windows backslashes to forward slashes for splitting. The
  // returned paths will use '/' too, which Node's fs accepts on Windows.
  // Drive-letter prefix "C:" is preserved as a leading segment.
  const norm = pattern.replace(/\\/g, "/");

  // Detect "C:/..." Windows drive paths.
  const driveMatch = /^([A-Za-z]:)\/(.*)$/.exec(norm);
  let drivePrefix = "";
  let body = norm;
  if (driveMatch) {
    drivePrefix = driveMatch[1]! + "/";
    body = driveMatch[2]!;
  }

  // Split into segments.
  const absolute = !drivePrefix && body.startsWith("/");
  const segs = (absolute ? body.slice(1) : body).split("/").filter((s, i, arr) => !(s === "" && i < arr.length - 1));

  let candidates: string[] = drivePrefix ? [drivePrefix] : (absolute ? ["/"] : ["."]);
  let resultMustBeDir = false;
  // Trailing slash → mark as dir-only.
  const trailingSlash = norm.endsWith("/") && norm !== "/";
  if (trailingSlash) resultMustBeDir = true;

  for (let idx = 0; idx < segs.length; idx++) {
    const seg = segs[idx]!;
    if (seg === "" && idx === segs.length - 1) {
      // Trailing slash already handled.
      break;
    }
    const fnflags = FNM_PATHNAME | (period ? FNM_PERIOD : 0);
    const segHasMagic = _hasMagic(seg, noescape);
    const next: string[] = [];
    for (const base of candidates) {
      if (!segHasMagic) {
        // Literal segment: just append.
        const child = _join(base, _stripEscapes(seg, noescape));
        try {
          if (idx < segs.length - 1) {
            const st = fs.statSync(child);
            if (st.isDirectory()) next.push(child);
          } else {
            // Last segment: must exist (or pass through).
            fs.statSync(child);
            next.push(child);
          }
        } catch { /* skip */ }
        continue;
      }
      let entries: string[];
      try { entries = fs.readdirSync(base); } catch { continue; }
      for (const e of entries) {
        // Hidden filter: leading '.' requires literal '.' in pattern when FNM_PERIOD active.
        if (fnmatch(seg, e, fnflags) === 0) {
          const child = _join(base, e);
          if (idx < segs.length - 1) {
            try {
              const st = fs.statSync(child);
              if (st.isDirectory()) next.push(child);
            } catch { /* skip */ }
          } else {
            next.push(child);
          }
        }
      }
    }
    candidates = next;
    if (candidates.length === 0) break;
  }

  // Apply ONLYDIR / trailing-slash filter on final results.
  if (onlydir || resultMustBeDir) {
    candidates = candidates.filter((p) => {
      try { return fs.statSync(p).isDirectory(); } catch { return false; }
    });
  }

  // GLOB_MARK: append '/' to directories.
  if ((flags & GLOB_MARK) !== 0) {
    candidates = candidates.map((p) => {
      if (p.endsWith("/")) return p;
      try { return fs.statSync(p).isDirectory() ? p + "/" : p; } catch { return p; }
    });
  }

  // Strip the leading "./" added for relative roots.
  candidates = candidates.map((p) => p.startsWith("./") ? p.slice(2) : p);

  return candidates;
}

function _join(a: string, b: string): string {
  if (a === "." ) return b;
  if (a === "/") return "/" + b;
  if (a.endsWith("/") || a.endsWith("\\")) return a + b;
  return a + "/" + b;
}

// ---------------------------------------------------------------------------
// Public glob() / globfree().
// ---------------------------------------------------------------------------

/**
 * POSIX glob() — IEEE Std 1003.1-2017 §glob.
 * Returns 0 on success, GLOB_NOMATCH on no match (unless GLOB_NOCHECK set),
 * GLOB_NOSPACE / GLOB_ABORTED on error.
 */
export function glob(
  pattern: string,
  flags: number,
  errfunc: ((epath: string, eerrno: number) => number) | null,
  pglob: glob_t,
): number {
  // Initialise pglob unless GLOB_APPEND.
  if ((flags & GLOB_APPEND) === 0) {
    pglob.gl_pathc = 0;
    pglob.gl_pathv = [];
    if ((flags & GLOB_DOOFFS) === 0) pglob.gl_offs = 0;
  }

  let work = pattern;
  if ((flags & GLOB_TILDE) !== 0) work = _expandTilde(work);

  const patterns = (flags & GLOB_BRACE) !== 0 ? _expandBraces(work) : [work];

  const all: string[] = [];
  for (const p of patterns) {
    let matches: string[];
    try {
      matches = _expandOnePattern(p, flags);
    } catch (e) {
      if (errfunc) {
        try { if (errfunc(p, 0) !== 0) return GLOB_ABORTED; } catch { return GLOB_ABORTED; }
      }
      if ((flags & GLOB_ERR) !== 0) return GLOB_ABORTED;
      matches = [];
    }
    if (matches.length === 0 && (flags & GLOB_NOCHECK) !== 0) {
      all.push(p);
    } else {
      for (const m of matches) all.push(m);
    }
  }

  if (all.length === 0 && (flags & GLOB_NOCHECK) === 0) return GLOB_NOMATCH;

  if ((flags & GLOB_NOSORT) === 0) all.sort();

  // Honor DOOFFS: pad gl_pathv with gl_offs leading nulls.
  if ((flags & GLOB_APPEND) === 0) {
    if ((flags & GLOB_DOOFFS) !== 0) {
      pglob.gl_pathv = [];
      for (let i = 0; i < (pglob.gl_offs | 0); i++) pglob.gl_pathv.push("");
    } else {
      pglob.gl_pathv = [];
    }
    pglob.gl_pathc = 0;
  }
  for (const m of all) pglob.gl_pathv.push(m);
  pglob.gl_pathc += all.length;
  return 0;
}

/** POSIX globfree() — release a glob_t. */
export function globfree(pglob: glob_t): void {
  pglob.gl_pathc = 0;
  pglob.gl_pathv = [];
  pglob.gl_offs = 0;
}
