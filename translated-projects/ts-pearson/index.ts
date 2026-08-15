/**
 * ts-pearson — TypeScript port of glapa-grossklag/pearson-c.
 *
 * Upstream: https://github.com/glapa-grossklag/pearson-c (BSD-3-Clause)
 *
 * Pearson hashing (Peter K. Pearson, "Fast hashing of variable-length text
 * strings", CACM 33(6), 1990) is a non-cryptographic table-driven hash
 * that is extremely simple, deterministic, and fast on short inputs.
 *
 * The 256-byte permutation table is the same as the upstream — a fixed
 * random shuffle of `0..255`. Outputs are deterministic given this table.
 */
import { Pearson8, Pearson16, Pearson32, Pearson64 } from './pearson.js';

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/** Pearson-8 hash. Returns a uint8 in [0, 255]. */
export function pearson8(input: Uint8Array | string): number {
  const b = toBytes(input);
  return Pearson8({ buf: b, off: 0 }, b.length) & 0xff;
}

/** Pearson-16 hash. Returns a uint16 in [0, 65535]. */
export function pearson16(input: Uint8Array | string): number {
  const b = toBytes(input);
  return Pearson16({ buf: b, off: 0 }, b.length) & 0xffff;
}

/** Pearson-32 hash. Returns a uint32 in [0, 2^32). */
export function pearson32(input: Uint8Array | string): number {
  const b = toBytes(input);
  return Pearson32({ buf: b, off: 0 }, b.length) >>> 0;
}

/** Pearson-64 hash. Returns a non-negative BigInt in [0, 2^64). */
export function pearson64(input: Uint8Array | string): bigint {
  const b = toBytes(input);
  const r = Pearson64({ buf: b, off: 0 }, b.length);
  // The port returns a BigInt for uint64_t; mask to be safe
  return BigInt.asUintN(64, typeof r === 'bigint' ? r : BigInt(r));
}

/** Hex helpers (lowercase, padded). */
export function pearson8hex(input: Uint8Array | string): string {
  return pearson8(input).toString(16).padStart(2, '0');
}
export function pearson16hex(input: Uint8Array | string): string {
  return pearson16(input).toString(16).padStart(4, '0');
}
export function pearson32hex(input: Uint8Array | string): string {
  return pearson32(input).toString(16).padStart(8, '0');
}
export function pearson64hex(input: Uint8Array | string): string {
  return pearson64(input).toString(16).padStart(16, '0');
}
