/**
 * ts-crc16 — TypeScript port of libcrc's CRC-16 family.
 *
 * Upstream: https://github.com/lammertb/libcrc (MIT)
 *
 * Five CRC-16 variants:
 *   - CRC-16/IBM (ARC, ANSI, USB)      — poly 0xA001, init 0x0000
 *   - CRC-16/MODBUS                    — poly 0xA001, init 0xFFFF
 *   - CRC-16/XMODEM                    — poly 0x1021, init 0x0000
 *   - CRC-16/CCITT-FALSE (CCITT-FFFF)  — poly 0x1021, init 0xFFFF
 *   - CRC-16/CCITT-1D0F                — poly 0x1021, init 0x1D0F
 */
import {
  crc_16, crc_modbus, update_crc_16,
  crc_xmodem, crc_ccitt_1d0f, crc_ccitt_ffff, update_crc_ccitt,
} from './crc16.js';

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

function call(fn: (buf: any, len: number) => number, input: Uint8Array | string): number {
  const bytes = toBytes(input);
  return fn({ buf: bytes, off: 0 }, bytes.length) & 0xffff;
}

/** CRC-16/IBM (ARC, ANSI, USB). poly 0xA001 reflected, init 0x0000. */
export function crc16ibm(input: Uint8Array | string): number { return call(crc_16, input); }

/** CRC-16/MODBUS. poly 0xA001 reflected, init 0xFFFF. */
export function crc16modbus(input: Uint8Array | string): number { return call(crc_modbus, input); }

/** CRC-16/XMODEM. poly 0x1021, init 0x0000. */
export function crc16xmodem(input: Uint8Array | string): number { return call(crc_xmodem, input); }

/** CRC-16/CCITT-FALSE. poly 0x1021, init 0xFFFF. The most common
 *  "CRC-CCITT". Used in Bluetooth, SD cards, KISS, etc. */
export function crc16ccitt(input: Uint8Array | string): number { return call(crc_ccitt_ffff, input); }

/** CRC-16/CCITT-1D0F. poly 0x1021, init 0x1D0F. Used in some early
 *  modem standards. */
export function crc16ccitt1d0f(input: Uint8Array | string): number { return call(crc_ccitt_1d0f, input); }

/** Hex helper: 4-char lowercase hex. */
export function toHex(n: number): string {
  return (n & 0xffff).toString(16).padStart(4, '0');
}

/** Lower-level incremental update — feed one byte at a time. */
export { update_crc_16, update_crc_ccitt };
