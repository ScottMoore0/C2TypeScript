// Mirage POSIX <unistd.h> getopt + GNU <getopt.h> getopt_long.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §getopt — short-option parsing.
//   * GNU getopt(3) / glibc <getopt.h> — getopt_long, getopt_long_only.
//
// API surface implemented:
//   int getopt(int argc, char *const argv[], const char *optstring);
//   int getopt_long (int argc, char *const argv[], const char *optstring,
//                    const struct option *longopts, int *longindex);
//   int getopt_long_only(...) — same but accepts -opt as well as --opt.
//
// External state (POSIX-mandated globals; mutable module-level here):
//   extern char *optarg;     — pointer to current option's argument
//   extern int   optind;     — index of next argv element to process
//   extern int   opterr;     — if non-zero, print "unrecognized option"
//   extern int   optopt;     — last unrecognized option character
//   extern int   optreset;   — BSD reset flag (== 1 → reset state)
//
// optstring grammar:
//   * leading "-"  → return non-option args as option \1 (GNU extension)
//   * leading "+"  → POSIXLY_CORRECT (stop at first non-option)
//   * leading ":"  → distinguish missing-arg (':') from unknown ('?')
//   * "x"          → option -x with no argument
//   * "x:"         → option -x with required argument
//   * "x::"        → option -x with optional argument (GNU extension)
//
// BRIDGE: posix-getopt — pure-state-machine port of glibc getopt; no Node
// dependency. State lives in module-level mutables to match POSIX spec.

// ---------------------------------------------------------------------------
// Mutable POSIX-mandated globals.
// ---------------------------------------------------------------------------

/** POSIX optarg — argument string of the most recent option (or null). */
export let optarg: string | null = null;

/** POSIX optind — index of next argv element. Starts at 1 (skips argv[0]). */
export let optind: number = 1;

/** POSIX opterr — if non-zero, getopt prints diagnostic on unknown option. */
export let opterr: number = 1;

/** POSIX optopt — character of last unrecognized option. */
export let optopt: number = 0;

/** BSD optreset — set to 1 to restart parsing of a new argv. */
export let optreset: number = 0;

// Internal: index *within* the current short-option cluster (e.g. "-abc").
let _nextChar: number = 0;

/** Test-only: reset state. */
export function _resetGetopt(): void {
  optarg = null;
  optind = 1;
  opterr = 1;
  optopt = 0;
  optreset = 0;
  _nextChar = 0;
}

/** POSIX-writable setters — ES module bindings are read-only across the
 *  module boundary, so external callers (translated C, tests) need explicit
 *  setters to mutate the optstate. */
export function _setOpterr(v: number): void { opterr = v | 0; }
export function _setOptind(v: number): void { optind = v | 0; }
export function _setOptreset(v: number): void { optreset = v | 0; }

/** GNU `struct option` — IEEE-style long-option descriptor. */
export interface option {
  /** Long option name (without leading "--"). */
  name: string;
  /** 0 = no_argument, 1 = required_argument, 2 = optional_argument. */
  has_arg: number;
  /** If non-null, *flag = val on match and getopt_long returns 0. */
  flag: { value: number } | null;
  /** Short-option char or sentinel int returned when matched. */
  val: number;
}

export const no_argument       = 0;
export const required_argument = 1;
export const optional_argument = 2;

// ---------------------------------------------------------------------------
// Internal helpers.
// ---------------------------------------------------------------------------

/**
 * Look up option char `c` in optstring; return 0/1/2 for none/required/
 * optional argument, or -1 if not present.
 */
function _shortLookup(optstring: string, c: string): number {
  // Skip leading "+", "-", ":" mode flags.
  let i = 0;
  while (i < optstring.length && (optstring[i] === "+" || optstring[i] === "-" || optstring[i] === ":")) i++;
  while (i < optstring.length) {
    if (optstring[i] === c) {
      let n = 0;
      if (i + 1 < optstring.length && optstring[i + 1] === ":") {
        n = 1;
        if (i + 2 < optstring.length && optstring[i + 2] === ":") n = 2;
      }
      return n;
    }
    i++;
  }
  return -1;
}

/** Returns mode from optstring leading char: '+', '-', ':' or '\0'. */
function _modeOf(optstring: string): string {
  if (optstring.length === 0) return "\0";
  const c = optstring[0]!;
  if (c === "+" || c === "-" || c === ":") return c;
  return "\0";
}

/** Whether colon-mode is active (':' as first char). */
function _colonMode(optstring: string): boolean {
  let i = 0;
  while (i < optstring.length && (optstring[i] === "+" || optstring[i] === "-")) i++;
  return optstring[i] === ":";
}

// ---------------------------------------------------------------------------
// getopt — POSIX §getopt.
// ---------------------------------------------------------------------------

/**
 * Parse one short option from argv. Returns the option char (as a code-point
 * number), -1 at end of options, '?' on unknown, ':' on missing required arg
 * (only when optstring starts with ':').
 */
export function getopt(argc: number, argv: string[], optstring: string): number {
  if (optreset) {
    optind = 1;
    _nextChar = 0;
    optreset = 0;
  }
  optarg = null;

  const mode = _modeOf(optstring);
  const colon = _colonMode(optstring);

  // Permute / scan loop. POSIX permutes non-options to the end unless mode
  // is '+' (POSIXLY_CORRECT — stop at first non-option) or '-' (treat
  // non-options as option \1 with optarg = the argv element).
  while (true) {
    if (_nextChar === 0) {
      // Starting fresh on argv[optind].
      if (optind >= argc) return -1;
      const cur = argv[optind];
      if (cur === undefined) return -1;
      if (cur === "--") { optind++; return -1; }
      if (cur.length === 0 || cur[0] !== "-" || cur === "-") {
        if (mode === "-") {
          optarg = cur;
          optind++;
          return 1; // \1 — non-option
        }
        if (mode === "+") return -1;
        // POSIX permute: scan ahead for an option element.
        let j = optind + 1;
        while (j < argc) {
          const a = argv[j]!;
          if (a.length > 0 && a[0] === "-" && a !== "-") break;
          j++;
        }
        if (j >= argc) return -1;
        // Move argv[j] into optind position; shift the run of non-options
        // right by one. Mutating argv is permitted by POSIX.
        const opt = argv[j]!;
        for (let k = j; k > optind; k--) argv[k] = argv[k - 1]!;
        argv[optind] = opt;
        // continue with optind unchanged
      }
      _nextChar = 1; // skip leading '-'
    }

    const cur = argv[optind]!;
    const c = cur[_nextChar];
    if (c === undefined) {
      _nextChar = 0;
      optind++;
      continue;
    }
    _nextChar++;

    const need = _shortLookup(optstring, c);
    if (need < 0) {
      optopt = c.charCodeAt(0);
      if (opterr && !colon) {
        try { console.error(`${argv[0] ?? "prog"}: invalid option -- '${c}'`); } catch { /* ignore */ }
      }
      // Advance past the cluster element if exhausted.
      if (_nextChar >= cur.length) { _nextChar = 0; optind++; }
      return "?".charCodeAt(0);
    }

    if (need === 0) {
      if (_nextChar >= cur.length) { _nextChar = 0; optind++; }
      return c.charCodeAt(0);
    }

    // need === 1 (required) or need === 2 (optional)
    if (_nextChar < cur.length) {
      // Argument is rest of current element (e.g. "-fX").
      optarg = cur.slice(_nextChar);
      _nextChar = 0;
      optind++;
      return c.charCodeAt(0);
    }
    if (need === 2) {
      // Optional and not glued: no argument.
      optarg = null;
      _nextChar = 0;
      optind++;
      return c.charCodeAt(0);
    }
    // Required: take next argv element.
    if (optind + 1 >= argc) {
      optopt = c.charCodeAt(0);
      _nextChar = 0;
      optind++;
      if (opterr && !colon) {
        try { console.error(`${argv[0] ?? "prog"}: option requires an argument -- '${c}'`); } catch { /* ignore */ }
      }
      return colon ? ":".charCodeAt(0) : "?".charCodeAt(0);
    }
    optarg = argv[optind + 1]!;
    _nextChar = 0;
    optind += 2;
    return c.charCodeAt(0);
  }
}

// ---------------------------------------------------------------------------
// getopt_long — GNU extension.
// ---------------------------------------------------------------------------

function _matchLong(name: string, longopts: option[]): { idx: number; opt: option } | null {
  // Exact match wins; otherwise unique prefix match.
  let prefix: { idx: number; opt: option } | null = null;
  let prefixCount = 0;
  for (let i = 0; i < longopts.length; i++) {
    const o = longopts[i]!;
    if (o.name === name) return { idx: i, opt: o };
    if (o.name.startsWith(name)) {
      prefix = { idx: i, opt: o };
      prefixCount++;
    }
  }
  return prefixCount === 1 ? prefix : null;
}

/**
 * GNU getopt_long. Scans for "--longopt[=value]" or short options. Returns
 * 0 when a long option with `flag != null` matched (its `val` was stored
 * into *flag), or the option's `val` otherwise. Same -1/'?'/':' semantics
 * as getopt() for non-matches.
 */
export function getopt_long(
  argc: number,
  argv: string[],
  optstring: string,
  longopts: option[],
  longindex: { value: number } | null,
): number {
  return _getoptLongInternal(argc, argv, optstring, longopts, longindex, /*long_only*/ false);
}

/** GNU getopt_long_only — accepts "-name" as well as "--name" for long opts. */
export function getopt_long_only(
  argc: number,
  argv: string[],
  optstring: string,
  longopts: option[],
  longindex: { value: number } | null,
): number {
  return _getoptLongInternal(argc, argv, optstring, longopts, longindex, /*long_only*/ true);
}

function _getoptLongInternal(
  argc: number,
  argv: string[],
  optstring: string,
  longopts: option[],
  longindex: { value: number } | null,
  long_only: boolean,
): number {
  if (optreset) { optind = 1; _nextChar = 0; optreset = 0; }
  // If we're mid-cluster, finish via short getopt.
  if (_nextChar !== 0) return getopt(argc, argv, optstring);

  if (optind >= argc) return -1;
  const cur = argv[optind]!;
  if (cur === undefined) return -1;
  if (cur === "--") { optind++; return -1; }
  if (cur.length < 2 || cur[0] !== "-") return getopt(argc, argv, optstring);

  // Detect long form.
  let isLong = false;
  let body = "";
  if (cur.startsWith("--")) {
    isLong = true;
    body = cur.slice(2);
  } else if (long_only && cur.length > 1) {
    // -name with name >1 char or -name= → try long first.
    const candidate = cur.slice(1);
    const eq = candidate.indexOf("=");
    const head = eq < 0 ? candidate : candidate.slice(0, eq);
    if (head.length >= 1 && _matchLong(head, longopts) !== null) {
      isLong = true;
      body = candidate;
    }
  }

  if (!isLong) return getopt(argc, argv, optstring);

  const eq = body.indexOf("=");
  const name = eq < 0 ? body : body.slice(0, eq);
  const inline = eq < 0 ? null : body.slice(eq + 1);

  const colon = _colonMode(optstring);
  const m = _matchLong(name, longopts);
  if (m === null) {
    optopt = 0;
    if (opterr && !colon) {
      try { console.error(`${argv[0] ?? "prog"}: unrecognized option '--${name}'`); } catch { /* ignore */ }
    }
    optind++;
    return "?".charCodeAt(0);
  }

  const opt = m.opt;
  optind++;

  if (opt.has_arg === required_argument) {
    if (inline !== null) {
      optarg = inline;
    } else if (optind < argc) {
      optarg = argv[optind]!;
      optind++;
    } else {
      optopt = opt.val;
      if (opterr && !colon) {
        try { console.error(`${argv[0] ?? "prog"}: option '--${opt.name}' requires an argument`); } catch { /* ignore */ }
      }
      return colon ? ":".charCodeAt(0) : "?".charCodeAt(0);
    }
  } else if (opt.has_arg === optional_argument) {
    optarg = inline; // null if not glued
  } else {
    if (inline !== null) {
      // no_argument but =value supplied → diagnose.
      if (opterr && !colon) {
        try { console.error(`${argv[0] ?? "prog"}: option '--${opt.name}' doesn't allow an argument`); } catch { /* ignore */ }
      }
      optopt = opt.val;
      return "?".charCodeAt(0);
    }
    optarg = null;
  }

  if (longindex) longindex.value = m.idx;
  if (opt.flag !== null) {
    opt.flag.value = opt.val;
    return 0;
  }
  return opt.val;
}
