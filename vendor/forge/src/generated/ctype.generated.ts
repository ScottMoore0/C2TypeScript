// AUTO-GENERATED from CTYPE_PREDICATES.json — do not edit by hand.
// Regenerate with: npx tsx compiler/scripts/build-catalogue/generate-forge-trivials.ts
// Generated: 2026-04-22T00:07:28.453Z
//
// Per CONVENTIONS.md §A1, §A5: signature uses `c: number` and returns boolean
// (TS truthy semantics). Project-wide naming: c_<name> to distinguish from
// native JS identifiers.

/**
 * C17 §7.4.1.1: isalnum — tests for any character that is alphabetic OR a decimal digit (isalpha(c) || isdigit(c))
 * BRIDGE: libc-ctype
 */
export function c_isalnum(c: number): boolean {
  return (c_isalpha(c) || c_isdigit(c));
}

/**
 * C17 §7.4.1.2: isalpha — tests for any character that is alphabetic (isupper(c) || islower(c) in C locale)
 * BRIDGE: libc-ctype
 */
export function c_isalpha(c: number): boolean {
  const b = c & 0xFF; return ((b >= 0x41 && b <= 0x5A) || (b >= 0x61 && b <= 0x7A));
}

/**
 * C17 §7.4.1.3: isblank — tests for any character that is a standard blank character: space or horizontal tab
 * BRIDGE: libc-ctype
 */
export function c_isblank(c: number): boolean {
  const b = c & 0xFF; return (b === 0x20 || b === 0x09);
}

/**
 * C17 §7.4.1.4: iscntrl — tests for any control character (code points 0x00–0x1F and 0x7F)
 * BRIDGE: libc-ctype
 */
export function c_iscntrl(c: number): boolean {
  const b = c & 0xFF; return ((b >= 0x00 && b <= 0x1F) || b === 0x7F);
}

/**
 * C17 §7.4.1.5: isdigit — tests for any decimal-digit character (0–9)
 * BRIDGE: libc-ctype
 */
export function c_isdigit(c: number): boolean {
  const b = c & 0xFF; return (b >= 0x30 && b <= 0x39);
}

/**
 * C17 §7.4.1.6: isgraph — tests for any printing character except space (0x21–0x7E)
 * BRIDGE: libc-ctype
 */
export function c_isgraph(c: number): boolean {
  const b = c & 0xFF; return (b >= 0x21 && b <= 0x7E);
}

/**
 * C17 §7.4.1.7: islower — tests for any lowercase letter (a–z)
 * BRIDGE: libc-ctype
 */
export function c_islower(c: number): boolean {
  const b = c & 0xFF; return (b >= 0x61 && b <= 0x7A);
}

/**
 * C17 §7.4.1.8: isprint — tests for any printing character including space (0x20–0x7E)
 * BRIDGE: libc-ctype
 */
export function c_isprint(c: number): boolean {
  const b = c & 0xFF; return (b >= 0x20 && b <= 0x7E);
}

/**
 * C17 §7.4.1.9: ispunct — tests for any printing character that is neither space nor alphanumeric
 * BRIDGE: libc-ctype
 */
export function c_ispunct(c: number): boolean {
  const b = c & 0xFF; return ((b >= 0x21 && b <= 0x2F) || (b >= 0x3A && b <= 0x40) || (b >= 0x5B && b <= 0x60) || (b >= 0x7B && b <= 0x7E));
}

/**
 * C17 §7.4.1.10: isspace — tests for standard whitespace: space, form feed, newline, carriage return, horizontal tab, vertical tab
 * BRIDGE: libc-ctype
 */
export function c_isspace(c: number): boolean {
  const b = c & 0xFF; return (b === 0x20 || (b >= 0x09 && b <= 0x0D));
}

/**
 * C17 §7.4.1.11: isupper — tests for any uppercase letter (A–Z)
 * BRIDGE: libc-ctype
 */
export function c_isupper(c: number): boolean {
  const b = c & 0xFF; return (b >= 0x41 && b <= 0x5A);
}

/**
 * C17 §7.4.1.12: isxdigit — tests for any hexadecimal-digit character (0–9, A–F, a–f)
 * BRIDGE: libc-ctype
 */
export function c_isxdigit(c: number): boolean {
  const b = c & 0xFF; return ((b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x46) || (b >= 0x61 && b <= 0x66));
}

/**
 * C17 §7.4.2.1: tolower — converts an uppercase letter to the corresponding lowercase; returns unchanged otherwise
 * BRIDGE: libc-ctype
 */
export function c_tolower(c: number): boolean {
  const b = c & 0xFF; return (b >= 0x41 && b <= 0x5A) ? (b + 32) : b;
}

/**
 * C17 §7.4.2.2: toupper — converts a lowercase letter to the corresponding uppercase; returns unchanged otherwise
 * BRIDGE: libc-ctype
 */
export function c_toupper(c: number): boolean {
  const b = c & 0xFF; return (b >= 0x61 && b <= 0x7A) ? (b - 32) : b;
}
