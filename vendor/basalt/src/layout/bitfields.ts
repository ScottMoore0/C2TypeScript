// Bit-fields: C17 §6.7.2.1 ¶10–¶12.
// A bit-field packs an integer value of up to its declared width in bits
// within a "storage unit" (typically the declared type's size, e.g. 32 bits
// for int). Consecutive bit-fields share a storage unit; a zero-width
// unnamed bit-field forces alignment to the next unit boundary.
//
// NOTE: The C17 standard leaves many bit-field details implementation-defined
// (e.g. endianness of bit numbering within a byte, whether int straddles
// storage units). This implementation uses the conventional Itanium / x86-64
// SysV ABI layout: little-endian bit order within a byte, bit-fields
// allocated LSB-first within each storage unit, no straddling across units.

import type { CPtr } from "../memory/cptr.js";

/** A single bit-field declaration. */
export interface BitField {
  name: string;
  type: string;          // e.g. "int", "unsigned int", "char"
  storageBits: number;   // width of the storage unit (e.g. 32 for int, 8 for char)
  widthBits: number;     // declared bit-field width (0 = forces new unit if unnamed)
  unnamed: boolean;
}

/** Per-field placement info. Unnamed fields with width > 0 are omitted. */
export interface BitFieldOffset {
  name: string;
  byteOffset: number;
  bitOffset: number;   // bit offset within the byte at byteOffset (0..7)
  bitWidth: number;
}

export interface BitFieldLayout {
  offsets: BitFieldOffset[];
  totalBits: number;
}

/**
 * Compute a bit-field layout.
 * C17 §6.7.2.1 ¶11: an implementation may allocate any addressable storage unit
 *   large enough to hold a bit-field; we use the declared type's storageBits.
 * C17 §6.7.2.1 ¶11 last sentence: bit-fields that don't fit in the remaining
 *   space of a storage unit start a new storage unit (no straddling).
 * C17 §6.7.2.1 ¶12: a zero-width unnamed bit-field forces the next field to
 *   the boundary of its storage unit.
 */
export function computeBitFieldLayout(fields: BitField[]): BitFieldLayout {
  const offsets: BitFieldOffset[] = [];
  let unitStart = 0;              // bit position where current storage unit starts
  let unitSize = 0;               // size in bits of current storage unit (0 = no unit)
  let bitInUnit = 0;              // next free bit within current unit

  for (const f of fields) {
    // Zero-width unnamed: force alignment to next storage unit boundary.
    if (f.widthBits === 0) {
      if (f.unnamed) {
        if (bitInUnit > 0) {
          // Close current unit.
          unitStart += unitSize;
          unitSize = 0;
          bitInUnit = 0;
        }
        continue;
      }
      // Zero-width named is ill-formed in C; skip defensively.
      continue;
    }

    // Start a new unit if either: no unit yet, new type with different storage
    // size, or the field doesn't fit in the remaining space.
    const needNewUnit =
      unitSize === 0 ||
      unitSize !== f.storageBits ||
      bitInUnit + f.widthBits > unitSize;

    if (needNewUnit) {
      if (unitSize > 0) unitStart += unitSize;
      unitSize = f.storageBits;
      bitInUnit = 0;
      // Align unit to its own byte-size boundary.
      const unitByteSize = unitSize / 8;
      if (unitByteSize > 0) {
        const unitStartBytes = unitStart / 8;
        const aligned = Math.ceil(unitStartBytes / unitByteSize) * unitByteSize;
        unitStart = aligned * 8;
      }
    }

    const absBit = unitStart + bitInUnit;
    if (!f.unnamed) {
      offsets.push({
        name: f.name,
        byteOffset: Math.floor(absBit / 8),
        bitOffset: absBit % 8,
        bitWidth: f.widthBits
      });
    }
    bitInUnit += f.widthBits;
  }

  const totalBits = unitStart + Math.max(bitInUnit, unitSize > 0 ? unitSize : 0);
  // Round up to byte boundary.
  const aligned = Math.ceil(totalBits / 8) * 8;
  return { offsets, totalBits: aligned };
}

/**
 * Read a bit-field starting at byteOffset/bitOffset, of given width.
 * Bit 0 = LSB of the byte at byteOffset (little-endian bit order).
 * Returns a signed value if `signed` is true (sign-extended).
 */
export function readBitField(
  buf: CPtr,
  byteOffset: number,
  bitOffset: number,
  bitWidth: number,
  signed: boolean
): number {
  if (bitWidth <= 0 || bitWidth > 32) {
    throw new RangeError(`readBitField: width ${bitWidth} out of supported range (1..32)`);
  }
  // Assemble up to 5 bytes to cover worst-case 32-bit field spanning bytes.
  let value = 0;
  const startByte = buf.off + byteOffset;
  const totalBitsNeeded = bitOffset + bitWidth;
  const bytesNeeded = Math.ceil(totalBitsNeeded / 8);
  for (let i = 0; i < bytesNeeded; i++) {
    value |= (buf.buf[startByte + i] & 0xff) << (i * 8);
  }
  // Use >>> 0 to stay in unsigned 32-bit range during the shift.
  const shifted = bitWidth === 32 && bitOffset === 0
    ? (value >>> 0)
    : ((value >>> bitOffset) & ((1 << bitWidth) - 1)) >>> 0;
  if (!signed) return shifted >>> 0;
  // Sign-extend.
  const signBit = 1 << (bitWidth - 1);
  return (shifted & signBit) !== 0 ? shifted - (1 << bitWidth) : shifted;
}

/**
 * Write a bit-field, preserving surrounding bits.
 * Value is masked to bitWidth bits before writing.
 */
export function writeBitField(
  buf: CPtr,
  byteOffset: number,
  bitOffset: number,
  bitWidth: number,
  value: number
): void {
  if (bitWidth <= 0 || bitWidth > 32) {
    throw new RangeError(`writeBitField: width ${bitWidth} out of supported range (1..32)`);
  }
  const mask = bitWidth === 32 ? 0xffffffff : ((1 << bitWidth) - 1) >>> 0;
  const v = (value >>> 0) & mask;
  const startByte = buf.off + byteOffset;
  const totalBitsNeeded = bitOffset + bitWidth;
  const bytesNeeded = Math.ceil(totalBitsNeeded / 8);

  // Read the existing bytes as a small integer (in 64-bit BigInt to avoid
  // overflow when bytesNeeded=5).
  let big = 0n;
  for (let i = 0; i < bytesNeeded; i++) {
    big |= BigInt(buf.buf[startByte + i] & 0xff) << BigInt(i * 8);
  }
  const fieldMask = ((1n << BigInt(bitWidth)) - 1n) << BigInt(bitOffset);
  big = (big & ~fieldMask) | ((BigInt(v) << BigInt(bitOffset)) & fieldMask);
  for (let i = 0; i < bytesNeeded; i++) {
    buf.buf[startByte + i] = Number((big >> BigInt(i * 8)) & 0xffn);
  }
}
