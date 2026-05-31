// Mirage POSIX <wordexp.h> — shell-style word expansion.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<wordexp.h>:
//       int wordexp(const char *words, wordexp_t *we, int flags);
//       void wordfree(wordexp_t *we);
//       struct wordexp_t { size_t we_wordc; char **we_wordv; size_t we_offs; };
//
// Behaviour
// ---------
//   * Performs (in order, per POSIX §2.6):
//       1. Tilde expansion (~ → $HOME, ~user left as-is).
//       2. Variable substitution ($VAR, ${VAR}).
//       3. Field splitting on $IFS (default " \t\n").
//       4. Pathname (glob) expansion on each field.
//       5. Quote removal.
//   * Single quotes 'foo' suppress all expansion within.
//   * Double quotes "foo $bar" allow $-expansion but no field-split / glob.
//   * Backslash escapes the next char outside quotes.
//   * WRDE_NOCMD is honored — `…` and $(…) are forbidden and yield WRDE_CMDSUB.
//
// BRIDGE: posix-wordexp — shell word expansion → JS string handling +
// glob.ts. Command substitution and arithmetic substitution are NOT
// implemented (they require a real shell); they raise WRDE_CMDSUB / are
// passed through.

import { glob, globfree, GLOB_NOCHECK, GLOB_APPEND, type glob_t } from "./glob.js";

// ---------------------------------------------------------------------------
// Flags + return codes.
// ---------------------------------------------------------------------------

export const WRDE_DOOFFS    = 1 << 0;
export const WRDE_APPEND    = 1 << 1;
export const WRDE_NOCMD     = 1 << 2;
export const WRDE_REUSE     = 1 << 3;
export const WRDE_SHOWERR   = 1 << 4;
export const WRDE_UNDEF     = 1 << 5;

export const WRDE_NOSPACE   = 1;
export const WRDE_BADCHAR   = 2;
export const WRDE_BADVAL    = 3;
export const WRDE_CMDSUB    = 4;
export const WRDE_SYNTAX    = 5;

export interface wordexp_t {
  we_wordc: number;
  we_wordv: string[];
  we_offs: number;
}

// ---------------------------------------------------------------------------
// Tokenize one shell word into expanded fields. Returns null on syntax err.
// `splittable[i]` records whether field-split + glob may apply to fields[i].
// ---------------------------------------------------------------------------

interface TokenResult {
  /** Concatenated raw text after $/~ expansion, before field splitting. */
  text: string;
  /** Per-character flag: true if char is a "split-eligible" position
   *  (i.e. came from outside quotes). Same length as text. */
  splittable: boolean[];
  /** Per-character flag: true if char is "glob-active" (outside any quotes
   *  and not the result of $VAR substitution into quoted context). */
  globActive: boolean[];
}

function _envLookup(name: string, undef: boolean): string | null {
  const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const v = env[name];
  if (v !== undefined) return v;
  if (undef) return null; // signal WRDE_BADVAL
  return "";
}

function _tokenize(words: string, flags: number): TokenResult | { err: number } {
  const nocmd = (flags & WRDE_NOCMD) !== 0;
  const undef = (flags & WRDE_UNDEF) !== 0;
  let text = "";
  const splittable: boolean[] = [];
  const globActive: boolean[] = [];
  let i = 0;
  let inSingle = false;
  let inDouble = false;

  const push = (s: string, split: boolean, glob: boolean) => {
    for (const ch of s) {
      text += ch;
      splittable.push(split);
      globActive.push(glob);
    }
  };

  while (i < words.length) {
    const c = words[i]!;
    if (inSingle) {
      if (c === "'") { inSingle = false; i++; continue; }
      push(c, false, false); i++; continue;
    }
    if (inDouble) {
      if (c === '"') { inDouble = false; i++; continue; }
      if (c === "\\" && i + 1 < words.length) {
        const n = words[i + 1]!;
        // Inside double quotes, backslash escapes only $, `, ", \, newline.
        if (n === "$" || n === "`" || n === '"' || n === "\\" || n === "\n") {
          push(n, false, false); i += 2; continue;
        }
        push(c, false, false); i++; continue;
      }
      if (c === "$") {
        const v = _readVar(words, i, undef);
        if (v === null) return { err: WRDE_BADVAL };
        push(v.value, false, false);
        i = v.next;
        continue;
      }
      if (c === "`") {
        if (nocmd) return { err: WRDE_CMDSUB };
        return { err: WRDE_CMDSUB }; // not implemented either way
      }
      push(c, false, false); i++; continue;
    }

    if (c === "'") { inSingle = true; i++; continue; }
    if (c === '"') { inDouble = true; i++; continue; }
    if (c === "\\") {
      if (i + 1 < words.length) { push(words[i + 1]!, false, false); i += 2; continue; }
      i++; continue;
    }
    if (c === "$") {
      // $(…) is command sub.
      if (words[i + 1] === "(") {
        return { err: WRDE_CMDSUB };
      }
      const v = _readVar(words, i, undef);
      if (v === null) return { err: WRDE_BADVAL };
      // Substituted value is split-eligible (outside quotes).
      push(v.value, true, false);
      i = v.next;
      continue;
    }
    if (c === "`") {
      return { err: WRDE_CMDSUB };
    }
    // Reject other unquoted special chars per POSIX: |&;<>(){}\n
    if (c === "|" || c === "&" || c === ";" || c === "<" || c === ">" || c === "(" || c === ")" || c === "{" || c === "}" || c === "\n") {
      return { err: WRDE_BADCHAR };
    }
    push(c, true, true);
    i++;
  }
  if (inSingle || inDouble) return { err: WRDE_SYNTAX };
  return { text, splittable, globActive };
}

function _readVar(words: string, i: number, undef: boolean): { value: string; next: number } | null {
  // i points at '$'.
  let j = i + 1;
  if (j >= words.length) return { value: "$", next: j };
  let name: string;
  if (words[j] === "{") {
    const close = words.indexOf("}", j + 1);
    if (close < 0) return { value: "$" + words.slice(j), next: words.length };
    name = words.slice(j + 1, close);
    j = close + 1;
  } else {
    let k = j;
    while (k < words.length && /[A-Za-z0-9_]/.test(words[k]!)) k++;
    if (k === j) return { value: "$", next: j };
    name = words.slice(j, k);
    j = k;
  }
  const v = _envLookup(name, undef);
  if (v === null) return null;
  return { value: v, next: j };
}

// ---------------------------------------------------------------------------
// Split TokenResult into IFS-delimited fields.
// ---------------------------------------------------------------------------

function _split(tok: TokenResult): { fields: string[]; globMask: boolean[][] } {
  const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const ifs = env.IFS ?? " \t\n";
  const isSep = (ch: string): boolean => ifs.indexOf(ch) >= 0;

  const fields: string[] = [];
  const masks: boolean[][] = [];
  let cur = "";
  let curMask: boolean[] = [];
  let started = false;

  for (let i = 0; i < tok.text.length; i++) {
    const ch = tok.text[i]!;
    const split = tok.splittable[i]!;
    if (split && isSep(ch)) {
      if (started) {
        fields.push(cur);
        masks.push(curMask);
        cur = "";
        curMask = [];
        started = false;
      }
      continue;
    }
    cur += ch;
    curMask.push(tok.globActive[i]!);
    started = true;
  }
  if (started) {
    fields.push(cur);
    masks.push(curMask);
  }
  return { fields, globMask: masks };
}

/**
 * POSIX wordexp() — IEEE Std 1003.1-2017 §wordexp.
 * Performs tilde+var+split+glob+quote-removal expansion of `words`.
 */
export function wordexp(words: string, we: wordexp_t, flags: number): number {
  if ((flags & WRDE_REUSE) !== 0) wordfree(we);
  if ((flags & WRDE_APPEND) === 0) {
    we.we_wordc = 0;
    we.we_wordv = [];
    if ((flags & WRDE_DOOFFS) === 0) we.we_offs = 0;
  }

  // Tilde expansion (POSIX §2.6.1) — only at start of word or right after
  // an unquoted ':' (PATH-style). We do the first form.
  let work = words;
  if (work.length > 0 && work[0] === "~") {
    let j = 1;
    while (j < work.length && /[^/:]/.test(work[j]!)) j++;
    const head = work.slice(0, j);
    const rest = work.slice(j);
    if (head === "~") {
      const env = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env ?? {};
      const home = env.HOME ?? env.USERPROFILE ?? "/";
      work = home + rest;
    }
  }

  const tok = _tokenize(work, flags);
  if ("err" in tok) return tok.err;

  const split = _split(tok);

  // Pathname expansion per field.
  const out: string[] = [];
  for (let fi = 0; fi < split.fields.length; fi++) {
    const f = split.fields[fi]!;
    const mask = split.globMask[fi]!;
    const hasMagic = mask.some((g, k) => g && (f[k] === "*" || f[k] === "?" || f[k] === "["));
    if (!hasMagic) {
      out.push(f);
      continue;
    }
    const pg: glob_t = { gl_pathc: 0, gl_pathv: [], gl_offs: 0 };
    const r = glob(f, GLOB_NOCHECK, null, pg);
    if (r === 0) {
      for (const m of pg.gl_pathv) out.push(m);
    } else {
      out.push(f);
    }
    globfree(pg);
  }

  if ((flags & WRDE_APPEND) === 0) {
    if ((flags & WRDE_DOOFFS) !== 0) {
      we.we_wordv = [];
      for (let i = 0; i < (we.we_offs | 0); i++) we.we_wordv.push("");
    } else {
      we.we_wordv = [];
    }
  }
  for (const w of out) we.we_wordv.push(w);
  we.we_wordc += out.length;
  return 0;
}

/** POSIX wordfree() — release a wordexp_t. */
export function wordfree(we: wordexp_t): void {
  we.we_wordc = 0;
  we.we_wordv = [];
  we.we_offs = 0;
}
