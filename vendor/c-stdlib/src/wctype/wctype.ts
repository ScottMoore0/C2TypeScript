// wctype.h — C17 §7.30 wide character classification and mapping
// All predicates behave per the "C" locale (ASCII classification), per C17 §7.30.1 p3.
// wint_t and wchar_t are modeled as number; WEOF is -1.

export const WEOF = -1;

// §7.30.2.1.1 iswalnum
export function c_iswalnum(wc: number): number {
  return (c_iswalpha(wc) || c_iswdigit(wc)) ? 1 : 0;
}
// §7.30.2.1.2 iswalpha
export function c_iswalpha(wc: number): number {
  return (c_iswupper(wc) || c_iswlower(wc)) ? 1 : 0;
}
// §7.30.2.1.3 iswblank — space or horizontal tab in C locale
export function c_iswblank(wc: number): number {
  return (wc === 0x20 || wc === 0x09) ? 1 : 0;
}
// §7.30.2.1.4 iswcntrl — 0x00-0x1F or 0x7F in C locale
export function c_iswcntrl(wc: number): number {
  return ((wc >= 0x00 && wc <= 0x1F) || wc === 0x7F) ? 1 : 0;
}
// §7.30.2.1.5 iswdigit
export function c_iswdigit(wc: number): number {
  return (wc >= 0x30 && wc <= 0x39) ? 1 : 0;
}
// §7.30.2.1.6 iswgraph — any printing except space
export function c_iswgraph(wc: number): number {
  return (wc > 0x20 && wc < 0x7F) ? 1 : 0;
}
// §7.30.2.1.7 iswlower
export function c_iswlower(wc: number): number {
  return (wc >= 0x61 && wc <= 0x7A) ? 1 : 0;
}
// §7.30.2.1.8 iswprint — printing including space
export function c_iswprint(wc: number): number {
  return (wc >= 0x20 && wc < 0x7F) ? 1 : 0;
}
// §7.30.2.1.9 iswpunct — printing, not space, not alnum
export function c_iswpunct(wc: number): number {
  if (!c_iswprint(wc)) return 0;
  if (wc === 0x20) return 0;
  if (c_iswalnum(wc)) return 0;
  return 1;
}
// §7.30.2.1.10 iswspace — standard whitespace
export function c_iswspace(wc: number): number {
  return (wc === 0x20 || (wc >= 0x09 && wc <= 0x0D)) ? 1 : 0;
}
// §7.30.2.1.11 iswupper
export function c_iswupper(wc: number): number {
  return (wc >= 0x41 && wc <= 0x5A) ? 1 : 0;
}
// §7.30.2.1.12 iswxdigit
export function c_iswxdigit(wc: number): number {
  return (
    c_iswdigit(wc) ||
    (wc >= 0x41 && wc <= 0x46) ||
    (wc >= 0x61 && wc <= 0x66)
  ) ? 1 : 0;
}

// §7.30.2.2.1 towlower
export function c_towlower(wc: number): number {
  return c_iswupper(wc) ? wc + 0x20 : wc;
}
// §7.30.2.2.2 towupper
export function c_towupper(wc: number): number {
  return c_iswlower(wc) ? wc - 0x20 : wc;
}

// §7.30.2.2.1 wctype_t / wctrans_t are extensible tokens — model as number IDs.
export type WCType = number;
export type WCTrans = number;

// §7.30.2.1.13 wctype — construct a property token from a standard name.
// Standard property names (§7.30.2.1.2): "alnum","alpha","blank","cntrl",
// "digit","graph","lower","print","punct","space","upper","xdigit".
// Returns 0 if unrecognized (per spec).
const WCTYPE_NAMES: Record<string, number> = {
  alnum: 1, alpha: 2, blank: 3, cntrl: 4, digit: 5, graph: 6,
  lower: 7, print: 8, punct: 9, space: 10, upper: 11, xdigit: 12,
};
export function c_wctype(property: string): WCType {
  return WCTYPE_NAMES[property] ?? 0;
}
// §7.30.2.1.2 iswctype — dispatch on wctype id.
export function c_iswctype(wc: number, desc: WCType): number {
  switch (desc) {
    case 1:  return c_iswalnum(wc);
    case 2:  return c_iswalpha(wc);
    case 3:  return c_iswblank(wc);
    case 4:  return c_iswcntrl(wc);
    case 5:  return c_iswdigit(wc);
    case 6:  return c_iswgraph(wc);
    case 7:  return c_iswlower(wc);
    case 8:  return c_iswprint(wc);
    case 9:  return c_iswpunct(wc);
    case 10: return c_iswspace(wc);
    case 11: return c_iswupper(wc);
    case 12: return c_iswxdigit(wc);
    default: return 0;
  }
}
// §7.30.2.2.1 wctrans — standard mappings "tolower","toupper"
const WCTRANS_NAMES: Record<string, number> = { tolower: 1, toupper: 2 };
export function c_wctrans(property: string): WCTrans {
  return WCTRANS_NAMES[property] ?? 0;
}
// §7.30.2.2.2 towctrans
export function c_towctrans(wc: number, desc: WCTrans): number {
  switch (desc) {
    case 1: return c_towlower(wc);
    case 2: return c_towupper(wc);
    default: return wc;
  }
}
