// __builtin_offsetof / offsetof — C17 §7.19 ¶3 defines offsetof(type, member)
// as the integer constant of type size_t giving the byte offset of `member`
// within `type`. GCC's __builtin_offsetof extends this to nested paths like
// `foo.bar.baz` and `arr[0].member`.
//
// This module provides a flat-list-based computation with support for:
//   - nested struct paths: "outer.inner.field"
//   - array index paths: "items[3].member"
//   - packed / aligned attributes (via LayoutAttribute)
//   - bit-field byte offset (bit-field byte offset, not bit offset)

import { computePackedLayout, type LayoutAttribute, type AttrField } from "./attributes.js";

/** Field description for offsetof computation. */
export interface OffsetField {
  name: string;
  type: string;
  size: number;
  align: number;
  /** Bit-field width, if this is a bit-field. Otherwise undefined. */
  bitWidth?: number;
}

// --- Type table (natural sizeof / alignof for common C types) ---
// NOTE: sizes assume 64-bit LP64 target (Linux/macOS) or LLP64 (Windows) where
// they agree. Long double is 16 bytes (MSVC treats long double as double,
// but GCC/Clang on x86-64 use 10 bytes padded to 16; we pick 16 as the
// widely-used ABI value).

const SIZEOF_TABLE: Record<string, number> = {
  "char": 1, "signed char": 1, "unsigned char": 1, "_Bool": 1, "bool": 1,
  "short": 2, "unsigned short": 2, "int16_t": 2, "uint16_t": 2,
  "int": 4, "unsigned": 4, "unsigned int": 4, "int32_t": 4, "uint32_t": 4, "float": 4,
  "long": 8, "unsigned long": 8, "long long": 8, "unsigned long long": 8,
  "int64_t": 8, "uint64_t": 8, "double": 8, "size_t": 8, "ptrdiff_t": 8,
  "long double": 16, "__int128": 16, "unsigned __int128": 16,
  "_Complex double": 16, "_Complex float": 8, "_Complex long double": 32,
  "pointer": 8
};

const ALIGNOF_TABLE: Record<string, number> = { ...SIZEOF_TABLE };

/**
 * Register the alignment (and size) of a user-defined type (e.g. a struct).
 * Allows callers to pre-compute nested struct layouts and reference them by name.
 */
export function register_alignof(name: string, align: number, size?: number): void {
  ALIGNOF_TABLE[name] = align;
  if (size !== undefined) SIZEOF_TABLE[name] = size;
}

/** Natural alignment in bytes for a type. Returns 1 if unknown. */
export function alignof_type(typeName: string): number {
  // Pointer types (anything ending in *) are 8.
  if (typeName.endsWith("*")) return 8;
  return ALIGNOF_TABLE[typeName] ?? 1;
}

/** Natural sizeof in bytes for a type. Returns 0 if unknown. */
export function sizeof_type(typeName: string): number {
  if (typeName.endsWith("*")) return 8;
  return SIZEOF_TABLE[typeName] ?? 0;
}

/** Nested struct definition keyed by type name (for recursive offsetof paths). */
const NESTED_STRUCTS: Map<string, { fields: OffsetField[]; attrs: LayoutAttribute }> = new Map();

/** Register a nested struct definition that offsetof paths can recurse into. */
export function register_struct(
  name: string,
  fields: OffsetField[],
  attrs: LayoutAttribute
): void {
  NESTED_STRUCTS.set(name, { fields, attrs });
}

/** Clear all registered structs (primarily for tests). */
export function clear_registered_structs(): void {
  NESTED_STRUCTS.clear();
}

// --- Path parsing ---

interface PathSegment {
  name: string;
  index: number | null;   // array index, if "name[N]"
}

function parsePath(path: string): PathSegment[] {
  const segments: PathSegment[] = [];
  for (const raw of path.split(".")) {
    const m = /^([A-Za-z_]\w*)(?:\[(\d+)\])?$/.exec(raw.trim());
    if (!m) throw new Error(`builtin_offsetof: invalid path segment '${raw}'`);
    segments.push({ name: m[1], index: m[2] !== undefined ? parseInt(m[2], 10) : null });
  }
  return segments;
}

/**
 * Compute the byte offset of a member within a struct, following a dotted path.
 * Returns null if any segment is not found.
 *
 * For a bit-field leaf, the returned offset is the byte address of the
 * containing storage unit (bit-level offset requires the bit-field layout
 * APIs in bitfields.ts).
 */
export function builtin_offsetof(
  fields: OffsetField[],
  attrs: LayoutAttribute,
  path: string
): number | null {
  const segments = parsePath(path);
  if (segments.length === 0) return null;

  let totalOffset = 0;
  let currentFields = fields;
  let currentAttrs = attrs;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Compute the layout of currentFields.
    const attrFields: AttrField[] = currentFields.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      align: f.align
    }));
    const layout = computePackedLayout(attrFields, currentAttrs);
    const idx = currentFields.findIndex(f => f.name === seg.name);
    if (idx < 0) return null;

    totalOffset += layout.offsets[idx];
    const fld = currentFields[idx];

    if (seg.index !== null) {
      // "name[N]" — step N elements into the field's element type.
      // We treat fld.size as the declared field size; per-element size is
      // looked up via sizeof_type(fld.type).
      const elemSize = sizeof_type(fld.type) || fld.size;
      totalOffset += seg.index * elemSize;
    }

    // Descend into nested struct if there are more segments.
    if (i < segments.length - 1) {
      const nested = NESTED_STRUCTS.get(fld.type);
      if (!nested) return null;
      currentFields = nested.fields;
      currentAttrs = nested.attrs;
    }
  }

  return totalOffset;
}
