// Mirage POSIX <fnmatch.h> — filename pattern matching.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<fnmatch.h>:
//       int fnmatch(const char *pattern, const char *string, int flags);
//   * IEEE Std 1003.1-2017 §2.13 Pattern Matching Notation:
//       '?'   — match any single char (except '/' if FNM_PATHNAME)
//       '*'   — match zero or more chars (except '/' if FNM_PATHNAME)
//       '['…']' — bracket expression with optional '!' or '^' negation,
//                 ranges (a-z), and POSIX character classes ([:alpha:]).
//       '\\x' — literal x (suppressed by FNM_NOESCAPE)
//
// Flags (POSIX + GNU extensions):
//   FNM_PATHNAME — '/' must match '/' explicitly; '*' / '?' / '[…]' don't.
//   FNM_NOESCAPE — backslash is literal, not escape.
//   FNM_PERIOD   — leading '.' must match literal '.'.
//   FNM_LEADING_DIR (GNU) — pattern matches initial path segment if rest
//                            is "/…".
//   FNM_CASEFOLD (GNU) — case-insensitive match.
//
// Return: 0 on match, FNM_NOMATCH on no match.
//
// BRIDGE: posix-fnmatch — pure-state-machine pattern matcher; no Node dep.

export const FNM_NOMATCH      = 1;
export const FNM_PATHNAME     = 1 << 0;
export const FNM_NOESCAPE     = 1 << 1;
export const FNM_PERIOD       = 1 << 2;
export const FNM_LEADING_DIR  = 1 << 3;
export const FNM_CASEFOLD     = 1 << 4;

interface CharClass {
  test: (c: string) => boolean;
}

const POSIX_CLASSES: Record<string, CharClass> = {
  alnum: { test: (c) => /^[A-Za-z0-9]$/.test(c) },
  alpha: { test: (c) => /^[A-Za-z]$/.test(c) },
  blank: { test: (c) => c === " " || c === "\t" },
  cntrl: { test: (c) => { const k = c.charCodeAt(0); return (k >= 0 && k < 32) || k === 127; } },
  digit: { test: (c) => /^[0-9]$/.test(c) },
  graph: { test: (c) => { const k = c.charCodeAt(0); return k > 32 && k < 127; } },
  lower: { test: (c) => /^[a-z]$/.test(c) },
  print: { test: (c) => { const k = c.charCodeAt(0); return k >= 32 && k < 127; } },
  punct: { test: (c) => /^[!-/:-@[-`{-~]$/.test(c) },
  space: { test: (c) => /^[\t\n\v\f\r ]$/.test(c) },
  upper: { test: (c) => /^[A-Z]$/.test(c) },
  xdigit: { test: (c) => /^[0-9A-Fa-f]$/.test(c) },
};

/**
 * Match `string` against shell pattern `pattern`. Returns 0 on match,
 * FNM_NOMATCH otherwise. Implements POSIX §2.13 plus GNU extensions.
 */
export function fnmatch(pattern: string, string: string, flags: number = 0): number {
  const pathname = (flags & FNM_PATHNAME) !== 0;
  const noescape = (flags & FNM_NOESCAPE) !== 0;
  const period   = (flags & FNM_PERIOD) !== 0;
  const leading  = (flags & FNM_LEADING_DIR) !== 0;
  const fold     = (flags & FNM_CASEFOLD) !== 0;

  const eq = (a: string, b: string): boolean => fold ? a.toLowerCase() === b.toLowerCase() : a === b;

  // Recursive match with memoization to keep `*` polynomial.
  // Because `*` can be unbounded we use indexed recursion.
  const M = pattern.length;
  const N = string.length;

  // For FNM_PERIOD: a leading dot in `string` (or just after '/' if PATHNAME)
  // requires a literal '.' in pattern.
  function isPeriodAnchor(si: number): boolean {
    if (!period) return false;
    if (si === 0) return string[0] === ".";
    if (pathname && string[si - 1] === "/" && string[si] === ".") return true;
    return false;
  }

  function match(pi: number, si: number): boolean {
    while (pi < M) {
      const pc = pattern[pi]!;

      if (pc === "?") {
        if (si >= N) return false;
        if (pathname && string[si] === "/") return false;
        if (isPeriodAnchor(si)) return false;
        pi++; si++;
        continue;
      }

      if (pc === "*") {
        // POSIX §2.13: '*' cannot match a leading-dot if FNM_PERIOD is set.
        if (isPeriodAnchor(si)) return false;
        // Collapse runs of '*'.
        while (pi < M && pattern[pi] === "*") pi++;
        if (pi === M) {
          if (pathname) {
            // Tail must not contain '/' (unless leading_dir allows).
            for (let k = si; k < N; k++) {
              if (string[k] === "/") {
                if (leading) return true;
                return false;
              }
            }
            return true;
          }
          return true;
        }
        // Try every match position for the suffix.
        for (let k = si; k <= N; k++) {
          if (k > si && pathname && string[k - 1] === "/") return false;
          if (match(pi, k)) return true;
        }
        return false;
      }

      if (pc === "[") {
        if (si >= N) return false;
        if (pathname && string[si] === "/") return false;
        if (isPeriodAnchor(si)) return false;
        const r = matchBracket(pi, string[si]!);
        if (r === null) {
          // Malformed bracket → treat '[' as literal.
          if (!eq(string[si]!, "[")) return false;
          pi++; si++;
          continue;
        }
        if (!r.match) return false;
        pi = r.next;
        si++;
        continue;
      }

      if (pc === "\\" && !noescape && pi + 1 < M) {
        if (si >= N || !eq(string[si]!, pattern[pi + 1]!)) return false;
        pi += 2; si++;
        continue;
      }

      // Literal.
      if (si >= N) return false;
      if (pathname && pc === "/" && string[si] !== "/") return false;
      if (!eq(string[si]!, pc)) return false;
      pi++; si++;
    }

    if (si === N) return true;
    if (leading && string[si] === "/") return true;
    return false;
  }

  function matchBracket(pi: number, ch: string): { match: boolean; next: number } | null {
    // pattern[pi] === '['. Find closing ']' (allowing leading ']').
    let i = pi + 1;
    let negate = false;
    if (i < M && (pattern[i] === "!" || pattern[i] === "^")) { negate = true; i++; }
    const start = i;
    let matched = false;

    while (i < M) {
      const c = pattern[i]!;
      if (c === "]" && i !== start) {
        return { match: matched !== negate ? true : false, next: i + 1 };
      }
      // POSIX character class [:name:].
      if (c === "[" && i + 1 < M && pattern[i + 1] === ":") {
        const close = pattern.indexOf(":]", i + 2);
        if (close > 0) {
          const name = pattern.slice(i + 2, close);
          const cls = POSIX_CLASSES[name];
          if (cls && cls.test(ch)) matched = true;
          i = close + 2;
          continue;
        }
      }
      // Escape inside bracket.
      if (c === "\\" && !noescape && i + 1 < M) {
        if (eq(pattern[i + 1]!, ch)) matched = true;
        i += 2;
        continue;
      }
      // Range a-b.
      if (i + 2 < M && pattern[i + 1] === "-" && pattern[i + 2] !== "]") {
        const lo = c.charCodeAt(0);
        const hi = pattern[i + 2]!.charCodeAt(0);
        const k = ch.charCodeAt(0);
        const kf = fold ? ch.toLowerCase().charCodeAt(0) : k;
        const loF = fold ? c.toLowerCase().charCodeAt(0) : lo;
        const hiF = fold ? pattern[i + 2]!.toLowerCase().charCodeAt(0) : hi;
        if ((k >= lo && k <= hi) || (kf >= loF && kf <= hiF)) matched = true;
        i += 3;
        continue;
      }
      if (eq(c, ch)) matched = true;
      i++;
    }
    return null; // unterminated
  }

  return match(0, 0) ? 0 : FNM_NOMATCH;
}
