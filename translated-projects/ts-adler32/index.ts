/**
 * ts-adler32 — TypeScript port of an Adler-32 reference implementation.
 *
 * Upstream: https://github.com/shixiongfei/adler32 (Apache-2.0)
 * Spec: RFC 1950 §9.
 *
 * Adler-32 is the checksum used by zlib/PNG/deflate. It is slightly
 * faster than CRC-32 in software but has weaker statistical guarantees
 * for very short inputs; for general-purpose integrity, prefer CRC-32.
 */
import { adler32, adler32_combine, adler32_rolling } from './adler32.js';

const ADLER32_INIT = 1;

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * Compute the Adler-32 checksum of the input. Returns a 32-bit unsigned
 * integer. Seed defaults to `1` per RFC 1950.
 */
export function adler32sum(input: Uint8Array | string, seed: number = ADLER32_INIT): number {
  const bytes = toBytes(input);
  return adler32(seed >>> 0, { buf: bytes, off: 0 }, bytes.length) >>> 0;
}

/** Adler-32 as an 8-character lowercase hex string. */
export function adler32hex(input: Uint8Array | string, seed: number = ADLER32_INIT): string {
  return adler32sum(input, seed).toString(16).padStart(8, '0');
}

/**
 * Combine two Adler-32 checksums. Useful for verifying concatenated
 * streams: `combine(checksum(A), checksum(B), B.length) === checksum(A+B)`.
 */
export function adler32combine(adler1: number, adler2: number, len2: number): number {
  return adler32_combine(adler1 >>> 0, adler2 >>> 0, len2) >>> 0;
}

/**
 * Rolling-window update: given a current adler and the bytes entering
 * and leaving a window of size `windowSize`, advance the checksum by
 * one position.
 */
export function adler32roll(
  currentAdler: number,
  inByte: number,
  outByte: number,
  windowSize: number,
): number {
  return adler32_rolling(currentAdler >>> 0, inByte & 0xff, outByte & 0xff, windowSize) >>> 0;
}

export { ADLER32_INIT };
