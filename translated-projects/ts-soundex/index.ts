/**
 * ts-soundex — TypeScript port of BlurryRoots/zoundx.
 *
 * Upstream: https://github.com/BlurryRoots/zoundx (MIT)
 *
 * Implements the classical American Soundex algorithm: a four-character
 * phonetic code of the form [Letter][Digit][Digit][Digit]. Used in
 * fuzzy-name matching, US Census records, and many genealogy systems.
 */
import { zoundx_encode } from './soundex.js';

function cptrToString(ptr: any): string {
  if (typeof ptr === 'string') return ptr;
  if (!ptr || !ptr.buf) return '';
  let i = 0;
  const off = ptr.off ?? 0;
  while (ptr.buf[off + i] !== 0 && off + i < ptr.buf.length && i < 16) i++;
  return new TextDecoder().decode(ptr.buf.subarray(off, off + i));
}

/**
 * Compute the Soundex code of a name. Returns a 4-character code:
 * the first letter (uppercase) followed by three digits.
 *
 * @param name  A single name token (letters; non-letters are ignored).
 * @returns     4-character Soundex code, e.g. `"Robert" → "R163"`.
 */
export function soundex(name: string): string {
  if (!name) return '';
  const result = zoundx_encode(name);
  return cptrToString(result);
}
