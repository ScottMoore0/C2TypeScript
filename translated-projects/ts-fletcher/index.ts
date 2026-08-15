/**
 * ts-fletcher — TypeScript port of lenniea/fletcher.
 *
 * Upstream: https://github.com/lenniea/fletcher (MIT)
 * Algorithm: Fletcher's checksum (Fletcher 1982).
 *
 * Used by TCP/UDP-Lite, SCTP, OSPF, ZFS, IPX, and several embedded
 * protocols. Faster than CRC for similar collision resistance on
 * cooperative data; not suitable as a cryptographic check.
 */
import { fletcher16, fletcher32 } from './fletcher.js';

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * Fletcher-16 checksum. Returns a uint16 in [0, 65535].
 */
export function fletcher16sum(input: Uint8Array | string): number {
  const bytes = toBytes(input);
  return fletcher16({ buf: bytes, off: 0 }, bytes.length) & 0xffff;
}

/**
 * Fletcher-32 checksum. Returns a uint32 in [0, 2^32). Operates on
 * 16-bit words; input length must be even (one zero byte is appended
 * internally for odd-length inputs, matching the most common convention).
 */
export function fletcher32sum(input: Uint8Array | string): number {
  const bytes = toBytes(input);
  // fletcher32 expects 16-bit word count, but the C function takes byte
  // count and accesses pairs — odd length is undefined behaviour in the
  // upstream, so pad odd lengths with a trailing zero.
  let data = bytes;
  if (bytes.length & 1) {
    data = new Uint8Array(bytes.length + 1);
    data.set(bytes);
    // last byte stays 0
  }
  return fletcher32({ buf: data, off: 0 }, data.length >> 1) >>> 0;
}

/** Hex helpers. */
export function fletcher16hex(input: Uint8Array | string): string {
  return fletcher16sum(input).toString(16).padStart(4, '0');
}

export function fletcher32hex(input: Uint8Array | string): string {
  return fletcher32sum(input).toString(16).padStart(8, '0');
}
