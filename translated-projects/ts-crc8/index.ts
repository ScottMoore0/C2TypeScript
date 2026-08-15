/**
 * ts-crc8 — TypeScript port of libcrc's CRC-8 (Sensirion SHT75 variant,
 * polynomial 0x31, init 0x00).
 *
 * Upstream: https://github.com/lammertb/libcrc (MIT)
 *
 * Used by Sensirion temperature/humidity sensors (SHT family), some
 * 1-Wire device CRCs, and several industrial sensor protocols. Not the
 * Dallas/Maxim CRC-8 (which has init 0x00 and reflected polynomial
 * 0x8C).
 */
import { crc_8, update_crc_8 } from './crc8.js';

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * Compute CRC-8 (poly 0x31, init 0x00) of the input. Returns a uint8 in [0, 255].
 */
export function crc8(input: Uint8Array | string): number {
  const bytes = toBytes(input);
  return crc_8({ buf: bytes, off: 0 }, bytes.length) & 0xff;
}

/** CRC-8 as a 2-character lowercase hex string. */
export function crc8hex(input: Uint8Array | string): string {
  return crc8(input).toString(16).padStart(2, '0');
}

/** Incremental byte-at-a-time update. */
export { update_crc_8 };
