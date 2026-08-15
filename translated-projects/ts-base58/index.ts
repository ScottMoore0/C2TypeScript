/**
 * ts-base58 — TypeScript port of deemru/b58.
 *
 * Upstream: https://github.com/deemru/b58 (MIT)
 *
 * Base58 encoding as used by Bitcoin / IPFS / Solana / Monero. The
 * 58-character alphabet excludes `0`, `O`, `I`, `l` to avoid
 * visually-ambiguous characters when transcribing.
 */
import { e58, d58, c58 } from './b58.js';

const ENCODE_OVERHEAD = 16;  // bytes added to the safe upper bound

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * Encode bytes as a Base58 string (Bitcoin alphabet).
 */
export function base58Encode(input: Uint8Array | string): string {
  const bytes = toBytes(input);
  if (bytes.length === 0) return '';
  // Encoded length is at most ceil(binlen * log(256)/log(58)) + leading-zero count
  // = ~1.366 * binlen, plus safety margin
  const outBufSize = Math.max(16, Math.ceil(bytes.length * 1.5) + ENCODE_OVERHEAD);
  const outBuf = new Uint8Array(outBufSize);
  const outOut: { value: any } = { value: { buf: outBuf, off: 0 } };
  const lenOut: { value: number } = { value: outBuf.length };
  e58({ buf: bytes, off: 0 }, bytes.length, outOut, lenOut);
  const off = outOut.value.off ?? 0;
  return new TextDecoder().decode(outOut.value.buf.subarray(off, off + lenOut.value));
}

/**
 * Decode a Base58 string back to bytes (Bitcoin alphabet).
 */
export function base58Decode(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);
  const inBytes = new TextEncoder().encode(input);
  // Decoded length is at most binlen * log(58)/log(256) ≈ 0.733 * b58len + 1
  const outBufSize = Math.max(16, Math.ceil(input.length * 0.8) + ENCODE_OVERHEAD);
  const outBuf = new Uint8Array(outBufSize);
  const outOut: { value: any } = { value: { buf: outBuf, off: 0 } };
  const lenOut: { value: number } = { value: outBuf.length };
  d58({ buf: inBytes, off: 0 }, input.length, outOut, lenOut);
  const off = outOut.value.off ?? 0;
  // Copy out the result (the C function returns a pointer into outBuf;
  // we slice to detach from the over-allocated buffer)
  return outOut.value.buf.slice(off, off + lenOut.value);
}

/** Lower-level: number of non-`1` characters in a base58 string. */
export { c58 };
