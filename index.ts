/**
 * ts-murmur3
 *
 * A zero-dependency TypeScript port of MurmurHash3 by Austin Appleby
 * (public domain). Provides the three reference variants:
 *   - MurmurHash3_x86_32  (32-bit output, 32-bit-optimised mixing)
 *   - MurmurHash3_x86_128 (128-bit output, 32-bit-optimised mixing)
 *   - MurmurHash3_x64_128 (128-bit output, 64-bit-optimised mixing)
 *
 * Original C: by Austin Appleby, placed in the public domain.
 * TypeScript translation: copyright (c) 2026 Scott Moore, released
 * under the MIT license.
 *
 * Reference: https://github.com/aappleby/smhasher
 */

import * as core from './murmur3.js';

/** MurmurHash3_x86_32 (32-bit non-cryptographic hash). Returns a number in
 *  [0, 2^32). `seed` should be a 32-bit unsigned integer. */
export function murmur3_x86_32(input: string | Uint8Array, seed: number = 0): number {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const out = new Uint8Array(4);
  core.MurmurHash3_x86_32(
    { buf: data, off: 0 },
    data.length,
    seed >>> 0,
    { buf: out, off: 0 },
  );
  return (out[0] | (out[1] << 8) | (out[2] << 16) | (out[3] << 24)) >>> 0;
}

/** MurmurHash3_x86_128. Returns a 16-byte Uint8Array (the 128-bit digest in
 *  little-endian byte order). */
export function murmur3_x86_128(input: string | Uint8Array, seed: number = 0): Uint8Array {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const out = new Uint8Array(16);
  core.MurmurHash3_x86_128(
    { buf: data, off: 0 },
    data.length,
    seed >>> 0,
    { buf: out, off: 0 },
  );
  return out;
}

/** MurmurHash3_x64_128 (recommended variant on 64-bit platforms). Returns a
 *  16-byte Uint8Array (the 128-bit digest in little-endian byte order). */
export function murmur3_x64_128(input: string | Uint8Array, seed: number = 0): Uint8Array {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const out = new Uint8Array(16);
  core.MurmurHash3_x64_128(
    { buf: data, off: 0 },
    data.length,
    seed >>> 0,
    { buf: out, off: 0 },
  );
  return out;
}

/** Hex-encode helper for the 128-bit variants. */
export function toHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}
