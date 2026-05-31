// uchar.h — C17 §7.27 Unicode utilities
// char16_t is UTF-16 code unit, char32_t is Unicode code point.
// Multibyte encoding is UTF-8 (the de-facto C locale encoding for modern platforms).

export type MbState = { pending: number[]; surrogateHigh: number };

export function c_mbstate_init(): MbState {
  return { pending: [], surrogateHigh: 0 };
}

/**
 * §7.27.1.3 mbrtoc16 — decode one UTF-8 sequence from `s` into a char16_t at `out`.
 * Returns:
 *   0 if a null byte was consumed.
 *   (size_t)-3 if a surrogate low was produced from a prior call (no bytes consumed).
 *   (size_t)-2 if input is incomplete (partial sequence); here we fold into -1 since we don't stream.
 *   (size_t)-1 on encoding error.
 *   number of bytes consumed otherwise.
 * `out` is a single-element writable container (object with `value`).
 */
export function c_mbrtoc16(
  out: { value: number },
  s: number[] | null,
  n: number,
  ps: MbState
): number {
  // If we previously emitted a high surrogate, deliver the low surrogate now (§7.27.1.3 p3).
  if (ps.surrogateHigh !== 0) {
    out.value = ps.surrogateHigh;
    ps.surrogateHigh = 0;
    return -3; // (size_t)-3
  }
  if (s === null) return 0;
  if (n === 0) return -1;
  const cp = decodeUtf8(s, n);
  if (cp < 0) return cp; // error
  const [codepoint, bytes] = [cp >>> 8, cp & 0xff];
  if (codepoint === 0) { out.value = 0; return 0; }
  if (codepoint <= 0xFFFF) {
    out.value = codepoint;
    return bytes;
  }
  // Emit high surrogate now; queue low surrogate for next call.
  const adj = codepoint - 0x10000;
  out.value = 0xD800 | (adj >>> 10);
  ps.surrogateHigh = 0xDC00 | (adj & 0x3FF);
  return bytes;
}

/**
 * §7.27.1.4 c16rtomb — encode a char16_t into UTF-8 bytes appended to `s`.
 * Returns bytes written, or (size_t)-1 on error.
 */
export function c16rtomb(s: number[], c16: number, ps: MbState): number {
  // If we have a pending high surrogate, combine with low surrogate.
  if (ps.surrogateHigh !== 0) {
    if (!(c16 >= 0xDC00 && c16 <= 0xDFFF)) { ps.surrogateHigh = 0; return -1; }
    const cp = 0x10000 + (((ps.surrogateHigh & 0x3FF) << 10) | (c16 & 0x3FF));
    ps.surrogateHigh = 0;
    return encodeUtf8(s, cp);
  }
  if (c16 >= 0xD800 && c16 <= 0xDBFF) {
    ps.surrogateHigh = c16;
    return 0; // nothing written yet
  }
  return encodeUtf8(s, c16);
}

/**
 * §7.27.1.5 mbrtoc32 — decode next UTF-8 sequence to a codepoint.
 */
export function c_mbrtoc32(
  out: { value: number },
  s: number[] | null,
  n: number,
  _ps: MbState
): number {
  if (s === null) return 0;
  if (n === 0) return -1;
  const cp = decodeUtf8(s, n);
  if (cp < 0) return cp;
  const [codepoint, bytes] = [cp >>> 8, cp & 0xff];
  out.value = codepoint;
  return codepoint === 0 ? 0 : bytes;
}

/**
 * §7.27.1.6 c32rtomb — encode a codepoint into UTF-8.
 */
export function c32rtomb(s: number[], c32: number, _ps: MbState): number {
  return encodeUtf8(s, c32);
}

// --- helpers (private) ---

// Returns (codepoint << 8) | byteCount, or negative on error per UTF-8 RFC 3629.
function decodeUtf8(bytes: number[], n: number): number {
  const b0 = bytes[0]! & 0xff;
  if (b0 < 0x80) return (b0 << 8) | 1;
  if ((b0 & 0xE0) === 0xC0) {
    if (n < 2) return -1;
    const b1 = bytes[1]! & 0xff;
    if ((b1 & 0xC0) !== 0x80) return -1;
    const cp = ((b0 & 0x1F) << 6) | (b1 & 0x3F);
    if (cp < 0x80) return -1; // overlong
    return (cp << 8) | 2;
  }
  if ((b0 & 0xF0) === 0xE0) {
    if (n < 3) return -1;
    const b1 = bytes[1]! & 0xff, b2 = bytes[2]! & 0xff;
    if ((b1 & 0xC0) !== 0x80 || (b2 & 0xC0) !== 0x80) return -1;
    const cp = ((b0 & 0x0F) << 12) | ((b1 & 0x3F) << 6) | (b2 & 0x3F);
    if (cp < 0x800) return -1;
    if (cp >= 0xD800 && cp <= 0xDFFF) return -1; // surrogate
    return (cp << 8) | 3;
  }
  if ((b0 & 0xF8) === 0xF0) {
    if (n < 4) return -1;
    const b1 = bytes[1]! & 0xff, b2 = bytes[2]! & 0xff, b3 = bytes[3]! & 0xff;
    if ((b1 & 0xC0) !== 0x80 || (b2 & 0xC0) !== 0x80 || (b3 & 0xC0) !== 0x80) return -1;
    const cp = ((b0 & 0x07) << 18) | ((b1 & 0x3F) << 12) | ((b2 & 0x3F) << 6) | (b3 & 0x3F);
    if (cp < 0x10000 || cp > 0x10FFFF) return -1;
    return (cp << 8) | 4;
  }
  return -1;
}

function encodeUtf8(out: number[], cp: number): number {
  if (cp < 0 || cp > 0x10FFFF) return -1;
  if (cp < 0x80) { out.push(cp); return 1; }
  if (cp < 0x800) {
    out.push(0xC0 | (cp >>> 6));
    out.push(0x80 | (cp & 0x3F));
    return 2;
  }
  if (cp < 0x10000) {
    if (cp >= 0xD800 && cp <= 0xDFFF) return -1;
    out.push(0xE0 | (cp >>> 12));
    out.push(0x80 | ((cp >>> 6) & 0x3F));
    out.push(0x80 | (cp & 0x3F));
    return 3;
  }
  out.push(0xF0 | (cp >>> 18));
  out.push(0x80 | ((cp >>> 12) & 0x3F));
  out.push(0x80 | ((cp >>> 6) & 0x3F));
  out.push(0x80 | (cp & 0x3F));
  return 4;
}
