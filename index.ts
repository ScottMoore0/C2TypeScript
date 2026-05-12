/**
 * ts-crc32c — TypeScript port of a CRC-32C (Castagnoli) reference.
 *
 * Upstream: https://github.com/eloj/crc32c (MIT)
 * Polynomial: 0x82F63B78 (reflected CRC-32C-Castagnoli).
 *
 * CRC-32C is the polynomial of choice for new protocols. Used in iSCSI,
 * SCTP, Btrfs, Ceph, RocksDB, ZFS, FCoE, Cassandra, and more.
 *
 * The upstream source includes SSE4.2 hardware-accelerated paths; this
 * port keeps only the software fallback, since browsers / Node have no
 * portable access to the SSE4.2 CRC32C instruction.
 */
import { crc32c_soft, crc32c_initialize } from './crc32c.js';

let initialized = false;
function ensureInit() {
  if (!initialized) { crc32c_initialize(); initialized = true; }
}

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * Compute the CRC-32C (Castagnoli) of the input. Returns a 32-bit
 * unsigned integer. Initial CRC is `~0` and final XOR is `~result`;
 * these are applied internally so callers can pass a raw byte buffer.
 */
export function crc32c(input: Uint8Array | string): number {
  ensureInit();
  const bytes = toBytes(input);
  const seed = 0xffffffff;
  return (~crc32c_soft(seed, { buf: bytes, off: 0 }, bytes.length)) >>> 0;
}

/** CRC-32C as an 8-character lowercase hex string. */
export function crc32cHex(input: Uint8Array | string): string {
  return crc32c(input).toString(16).padStart(8, '0');
}
