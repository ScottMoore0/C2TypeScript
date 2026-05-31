// BC-1: CPtr — the universal C pointer model.
// A C pointer is a base buffer + byte offset. All pointer operations
// (arithmetic, dereference, comparison) reduce to operations on {buf, off}.
// C17 §6.2.5 ¶28: pointer types, §6.5.6: additive operators on pointers.

export interface CPtr {
  buf: Uint8Array;
  off: number;
}

// --- Construction ---

/** Create a null pointer. C17 §6.3.2.3. */
export const NULLPTR: CPtr = Object.freeze({ buf: new Uint8Array(0), off: 0 });

/** Check if a pointer is null or invalid. */
export function isNull(ptr: CPtr | null | undefined): boolean {
  return ptr == null || (ptr.buf.length === 0 && ptr.off === 0);
}

/** Create a pointer from a fresh allocation of `size` zero-filled bytes. */
// BRIDGE: size accepts number | bigint per CPtr design; idempotent Number()
// coercion handles `(uint64_t)`-cast size arithmetic without TypeError.
export function create(size: number | bigint): CPtr {
  const sz = typeof size === "bigint" ? Number(size) : Number(size ?? 0);
  return { buf: new Uint8Array(sz), off: 0 };
}

/** Create a pointer from an existing buffer at a given offset. */
export function fromBuffer(buf: Uint8Array, off: number = 0): CPtr {
  return { buf, off };
}

/** Encode a JS string as a null-terminated UTF-8 byte buffer. C17 §6.4.5. */
export function fromString(str: string): CPtr {
  const encoded = new TextEncoder().encode(str);
  const buf = new Uint8Array(encoded.length + 1);
  buf.set(encoded);
  // buf[encoded.length] is already 0
  return { buf, off: 0 };
}

// --- Pointer arithmetic (C17 §6.5.6) ---

/** ptr + n bytes. Returns a new CPtr sharing the same buffer. */
export function add(ptr: CPtr, n: number): CPtr {
  return { buf: ptr.buf, off: ptr.off + n };
}

/** ptr + n * elementSize. For typed pointer arithmetic (int*, float*, etc.). */
export function addScaled(ptr: CPtr, n: number, elementSize: number): CPtr {
  return { buf: ptr.buf, off: ptr.off + n * elementSize };
}

/** ptr - n bytes. */
export function sub(ptr: CPtr, n: number): CPtr {
  return { buf: ptr.buf, off: ptr.off - n };
}

/** Pointer difference: a - b in bytes. C17 §6.5.6 ¶9. */
export function diff(a: CPtr, b: CPtr): number {
  return a.off - b.off;
}

/** Pointer difference in elements: (a - b) / elementSize. */
export function diffScaled(a: CPtr, b: CPtr, elementSize: number): number {
  return (a.off - b.off) / elementSize;
}

// --- Comparison (C17 §6.5.8, §6.5.9) ---

/** Pointer equality: same buffer AND same offset. */
export function eq(a: CPtr | null, b: CPtr | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.buf === b.buf && a.off === b.off;
}

/** Pointer ordering: a < b (only meaningful for same allocation). */
export function lt(a: CPtr, b: CPtr): boolean {
  return a.off < b.off;
}

/** Pointer ordering: a <= b. */
export function le(a: CPtr, b: CPtr): boolean {
  return a.off <= b.off;
}

// --- Byte-level read/write (C17 §6.5.3.2 dereference) ---

/** Read one byte at ptr + i. */
export function readByte(ptr: CPtr, i: number = 0): number {
  return ptr.buf[ptr.off + i] ?? 0;
}

/** Write one byte at ptr + i. */
export function writeByte(ptr: CPtr, i: number, val: number): void {
  ptr.buf[ptr.off + i] = val & 0xFF;
}

// --- Typed read/write via DataView ---

export function readInt8(ptr: CPtr, i: number = 0): number {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset).getInt8(ptr.off + i);
}

export function writeInt8(ptr: CPtr, i: number, val: number): void {
  new DataView(ptr.buf.buffer, ptr.buf.byteOffset).setInt8(ptr.off + i, val);
}

export function readUint8(ptr: CPtr, i: number = 0): number {
  return ptr.buf[ptr.off + i] ?? 0;
}

export function writeUint8(ptr: CPtr, i: number, val: number): void {
  ptr.buf[ptr.off + i] = val & 0xFF;
}

export function readInt16(ptr: CPtr, byteOffset: number = 0): number {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset).getInt16(ptr.off + byteOffset, true);
}

export function writeInt16(ptr: CPtr, byteOffset: number, val: number): void {
  new DataView(ptr.buf.buffer, ptr.buf.byteOffset).setInt16(ptr.off + byteOffset, val, true);
}

export function readUint16(ptr: CPtr, byteOffset: number = 0): number {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset).getUint16(ptr.off + byteOffset, true);
}

export function writeUint16(ptr: CPtr, byteOffset: number, val: number): void {
  new DataView(ptr.buf.buffer, ptr.buf.byteOffset).setUint16(ptr.off + byteOffset, val, true);
}

export function readInt32(ptr: CPtr, byteOffset: number = 0): number {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset).getInt32(ptr.off + byteOffset, true);
}

export function writeInt32(ptr: CPtr, byteOffset: number, val: number): void {
  new DataView(ptr.buf.buffer, ptr.buf.byteOffset).setInt32(ptr.off + byteOffset, val, true);
}

export function readUint32(ptr: CPtr, byteOffset: number = 0): number {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset).getUint32(ptr.off + byteOffset, true);
}

export function writeUint32(ptr: CPtr, byteOffset: number, val: number): void {
  new DataView(ptr.buf.buffer, ptr.buf.byteOffset).setUint32(ptr.off + byteOffset, val, true);
}

export function readFloat32(ptr: CPtr, byteOffset: number = 0): number {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset).getFloat32(ptr.off + byteOffset, true);
}

export function writeFloat32(ptr: CPtr, byteOffset: number, val: number): void {
  new DataView(ptr.buf.buffer, ptr.buf.byteOffset).setFloat32(ptr.off + byteOffset, val, true);
}

export function readFloat64(ptr: CPtr, byteOffset: number = 0): number {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset).getFloat64(ptr.off + byteOffset, true);
}

export function writeFloat64(ptr: CPtr, byteOffset: number, val: number): void {
  new DataView(ptr.buf.buffer, ptr.buf.byteOffset).setFloat64(ptr.off + byteOffset, val, true);
}

// --- Bulk operations ---

/** Read bytes from offset to first \0, decode as UTF-8. C17 §7.1.1. */
export function toString(ptr: CPtr | null): string {
  if (!ptr || isNull(ptr)) return "";
  let end = ptr.off;
  while (end < ptr.buf.length && ptr.buf[end] !== 0) end++;
  return new TextDecoder().decode(ptr.buf.subarray(ptr.off, end));
}

/** Count bytes from offset to first \0. C17 §7.24.6.3 strlen. */
export function strlen(ptr: CPtr | null): number {
  if (!ptr || isNull(ptr)) return 0;
  let i = 0;
  while (ptr.off + i < ptr.buf.length && ptr.buf[ptr.off + i] !== 0) i++;
  return i;
}

/** Copy n bytes from src to dst. C17 §7.24.2.1 memcpy. */
export function memcpy(dst: CPtr, src: CPtr, n: number): void {
  if (!dst?.buf || !src?.buf || n <= 0) return;
  const srcEnd = Math.min(src.off + n, src.buf.length);
  dst.buf.set(src.buf.subarray(src.off, srcEnd), dst.off);
}

/** Set n bytes to val. C17 §7.24.6.1 memset. */
export function memset(ptr: CPtr, val: number, n: number): void {
  ptr.buf.fill(val & 0xFF, ptr.off, ptr.off + n);
}

/** Compare n bytes. C17 §7.24.4.1 memcmp. Returns <0, 0, or >0. */
export function memcmp(a: CPtr, b: CPtr, n: number): number {
  for (let i = 0; i < n; i++) {
    const av = a.buf[a.off + i] ?? 0;
    const bv = b.buf[b.off + i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/** Clone a pointer (same buffer, same offset — shallow). */
export function clone(ptr: CPtr): CPtr {
  return { buf: ptr.buf, off: ptr.off };
}

// --- Struct-as-class <-> CPtr round-trip (C17 §6.2.5 ¶20 + §7.22.3) ---
//
// BRIDGE: struct-as-class realloc round-trip. The translator emits C
// structs as JS classes with __fieldNames / __fieldTypes / __fieldOffsets
// metadata stamped on the constructor. When such a class instance is
// passed to `realloc` (e.g. `s = realloc(s, sizeof(T) + N)` for a flex-
// array growth), the runtime needs a CPtr to actually resize. These
// helpers serialize and deserialize the byte layout while preserving
// class identity for the hot path.

const __FIELD_TYPE_SIZE: Record<string, number> = {
  bool: 1, int8: 1, uint8: 1, char: 1, bytes: 1,
  int16: 2, uint16: 2,
  int32: 4, uint32: 4, float: 4,
  int64: 8, uint64: 8, double: 8, ptr: 8,
};

function __structHeaderSize(ctor: any): number {
  if (!ctor) return 0;
  const offsets: number[] | undefined = ctor.__fieldOffsets;
  const types: string[] | undefined = ctor.__fieldTypes;
  if (offsets && offsets.length > 0) {
    let max = 0;
    for (let i = 0; i < offsets.length; i++) {
      const sz = __FIELD_TYPE_SIZE[types?.[i] ?? "int32"] ?? 4;
      if (offsets[i] + sz > max) max = offsets[i] + sz;
    }
    return max;
  }
  if (types) {
    let off = 0;
    for (const t of types) off += __FIELD_TYPE_SIZE[t] ?? 4;
    return off;
  }
  return 0;
}

/**
 * Serialise a struct-as-class instance to a CPtr. Header fields are written
 * in declaration order at __fieldOffsets (or packed if offsets absent). For
 * a flex-array struct, the caller normally pre-resizes via realloc so the
 * trailing bytes are reserved.
 */
export function cptr_from_struct<T extends Record<string, any>>(instance: T): CPtr {
  if (!instance || typeof instance !== "object") return NULLPTR;
  const ctor: any = (instance as any).constructor;
  const names: string[] = ctor?.__fieldNames ?? [];
  const types: string[] = ctor?.__fieldTypes ?? [];
  const offsets: number[] | undefined = ctor?.__fieldOffsets;
  const headerSize = __structHeaderSize(ctor);
  const buf = new Uint8Array(headerSize);
  const dv = new DataView(buf.buffer);
  for (let i = 0; i < names.length; i++) {
    const off = offsets ? offsets[i] : (() => {
      let o = 0; for (let k = 0; k < i; k++) o += __FIELD_TYPE_SIZE[types[k]] ?? 4; return o;
    })();
    const t = types[i] ?? "int32";
    const v = (instance as any)[names[i]];
    switch (t) {
      case "bool": case "uint8": case "char": case "bytes":
        buf[off] = (Number(v ?? 0) & 0xFF); break;
      case "int8":
        dv.setInt8(off, Number(v ?? 0) | 0); break;
      case "int16":
        dv.setInt16(off, Number(v ?? 0) | 0, true); break;
      case "uint16":
        dv.setUint16(off, Number(v ?? 0) & 0xFFFF, true); break;
      case "int32":
        dv.setInt32(off, Number(v ?? 0) | 0, true); break;
      case "uint32":
        dv.setUint32(off, Number(v ?? 0) >>> 0, true); break;
      case "float":
        dv.setFloat32(off, Number(v ?? 0), true); break;
      case "int64": {
        const bv = typeof v === "bigint" ? v : BigInt(Math.trunc(Number(v ?? 0)));
        dv.setBigInt64(off, BigInt.asIntN(64, bv), true); break;
      }
      case "uint64": {
        const bv = typeof v === "bigint" ? v : BigInt(Math.trunc(Number(v ?? 0)));
        dv.setBigUint64(off, BigInt.asUintN(64, bv), true); break;
      }
      case "double":
        dv.setFloat64(off, Number(v ?? 0), true); break;
      // ptr fields cannot be serialized portably; leave zero-padded.
    }
  }
  return { buf, off: 0 };
}

/**
 * Deserialise a CPtr back into a fresh struct-as-class instance. Uses the
 * constructor's __fieldNames / __fieldTypes / __fieldOffsets metadata.
 */
export function cptr_to_struct<T>(p: CPtr | null, ctor: new () => T): T {
  const out: any = new (ctor as any)();
  if (!p || !p.buf) return out;
  const meta: any = ctor as any;
  const names: string[] = meta.__fieldNames ?? [];
  const types: string[] = meta.__fieldTypes ?? [];
  const offsets: number[] | undefined = meta.__fieldOffsets;
  const dv = new DataView(p.buf.buffer, p.buf.byteOffset);
  for (let i = 0; i < names.length; i++) {
    const off = (p.off ?? 0) + (offsets ? offsets[i] : (() => {
      let o = 0; for (let k = 0; k < i; k++) o += __FIELD_TYPE_SIZE[types[k]] ?? 4; return o;
    })());
    const t = types[i] ?? "int32";
    switch (t) {
      case "bool": case "uint8": case "char": case "bytes":
        out[names[i]] = p.buf[off] ?? 0; break;
      case "int8":
        out[names[i]] = dv.getInt8(off); break;
      case "int16":
        out[names[i]] = dv.getInt16(off, true); break;
      case "uint16":
        out[names[i]] = dv.getUint16(off, true); break;
      case "int32":
        out[names[i]] = dv.getInt32(off, true); break;
      case "uint32":
        out[names[i]] = dv.getUint32(off, true); break;
      case "float":
        out[names[i]] = dv.getFloat32(off, true); break;
      case "int64":
        out[names[i]] = dv.getBigInt64(off, true); break;
      case "uint64":
        out[names[i]] = dv.getBigUint64(off, true); break;
      case "double":
        out[names[i]] = dv.getFloat64(off, true); break;
    }
  }
  return out;
}
