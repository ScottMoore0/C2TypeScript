/**
 * ts-crc32 — TypeScript port of a tiny CRC-32 (IEEE 802.3) reference.
 *
 * Upstream: https://github.com/aeldidi/crc32 (CC0 public domain)
 * Polynomial: 0xEDB88320 (reflected CRC-32-IEEE).
 *
 * Compatible with zlib, gzip, PNG, Ethernet, SCTP CRC32, and `crc32`
 * function in many languages (Python's binascii.crc32, Go's
 * hash/crc32 IEEE table, etc.).
 */
import { crc32 } from './crc32.js';

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * Compute the CRC-32 of the input. Returns a 32-bit unsigned integer.
 *
 * @param input  Bytes (or UTF-8-encoded string) to checksum.
 * @returns      Unsigned 32-bit CRC value.
 */
export function crc32sum(input: Uint8Array | string): number {
  const bytes = toBytes(input);
  return (crc32({ buf: bytes, off: 0 }, bytes.length)) >>> 0;
}

/** CRC-32 as an 8-character lowercase hex string. */
export function crc32hex(input: Uint8Array | string): string {
  return crc32sum(input).toString(16).padStart(8, '0');
}
