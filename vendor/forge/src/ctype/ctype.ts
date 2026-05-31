// FC-6: C character classification and conversion.
// C17 §7.4: Character handling.

/** C17 §7.4.1.1: isalnum — alphanumeric. */
export function c_isalnum(c: number): boolean {
  return c_isalpha(c) || c_isdigit(c);
}

/** C17 §7.4.1.2: isalpha — alphabetic. */
export function c_isalpha(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

/** C17 §7.4.1.5: isdigit — decimal digit. */
export function c_isdigit(c: number): boolean {
  return c >= 48 && c <= 57;
}

/** C17 §7.4.1.7: islower — lowercase. */
export function c_islower(c: number): boolean {
  return c >= 97 && c <= 122;
}

/** C17 §7.4.1.11: isupper — uppercase. */
export function c_isupper(c: number): boolean {
  return c >= 65 && c <= 90;
}

/** C17 §7.4.1.10: isspace — whitespace. */
export function c_isspace(c: number): boolean {
  return c === 32 || (c >= 9 && c <= 13); // space, tab, \n, \v, \f, \r
}

/** C17 §7.4.1.8: isprint — printable. */
export function c_isprint(c: number): boolean {
  return c >= 32 && c <= 126;
}

/** C17 §7.4.1.9: ispunct — punctuation. */
export function c_ispunct(c: number): boolean {
  return c_isprint(c) && !c_isalnum(c) && !c_isspace(c);
}

/** C17 §7.4.1.12: isxdigit — hex digit. */
export function c_isxdigit(c: number): boolean {
  return c_isdigit(c) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102);
}

/** C17 §7.4.2.1: tolower. */
export function c_tolower(c: number): number {
  return c_isupper(c) ? c + 32 : c;
}

/** C17 §7.4.2.2: toupper. */
export function c_toupper(c: number): number {
  return c_islower(c) ? c - 32 : c;
}

/** C17 §7.4.1.3: isblank — blank character (space or tab). */
export function c_isblank(c: number): boolean {
  return c === 32 || c === 9; // space or tab
}

/** C17 §7.4.1.5: iscntrl — control character. */
export function c_iscntrl(c: number): boolean {
  return (c >= 0 && c <= 31) || c === 127;
}

/** C17 §7.4.1.6: isgraph — graphic character (printable, not space). */
export function c_isgraph(c: number): boolean {
  return c > 32 && c <= 126;
}
