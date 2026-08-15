/**
 * ts-md5
 *
 * A zero-dependency TypeScript port of the RFC 1321 MD5 reference
 * implementation by Bryce Wilson.
 *
 * SECURITY NOTICE: MD5 is cryptographically broken and unsuitable for
 * security purposes (digital signatures, password hashing, integrity
 * against an active adversary). It remains useful as a non-cryptographic
 * checksum, for legacy interop, and for non-security-sensitive
 * fingerprinting. Use SHA-256 or BLAKE3 for new cryptographic work.
 *
 * Original C: Public Domain, copyright (c) Bryce Wilson.
 * TypeScript translation: copyright (c) 2026 Scott Moore, also released
 * into the public domain via the Unlicense.
 *
 * See: https://github.com/Zunawe/md5-c
 */

// Re-export the core MD5 surface from the translated module. The
// signatures use CPtr ({ buf: Uint8Array; off: number }) where the C
// original used uint8_t * / void *. md5File is intentionally NOT
// re-exported — file I/O is not part of this package's public API.
export {
  MD5Context,
  md5Init,
  md5Update,
  md5Finalize,
  md5Step,
  md5String,
  rotateLeft,
} from './md5.js';
