// GCC/Clang/MSVC layout attributes: __attribute__((packed)),
// __attribute__((aligned(N))), __attribute__((vector_size(N))),
// __attribute__((may_alias)).
// GCC Manual §6.38 "Common Type Attributes".
// C17 §6.7.2.1 provides natural alignment; these attributes override it.
//
// NOTE: Packed + aligned(N) precedence: fields are placed without padding
// (packed wins for field offsets), but the total struct size is rounded
// up to N (aligned wins for total size). This matches GCC behaviour.

/** Normalized layout attributes for a struct or union. */
export interface LayoutAttribute {
  /** __attribute__((packed)) — remove inter-field padding. */
  packed: boolean;
  /** __attribute__((aligned(N))) — round total size up to N bytes. null = natural. */
  alignment: number | null;
  /** __attribute__((vector_size(N))) — SIMD vector type size in bytes. null = not a vector. */
  vectorSize: number | null;
  /** __attribute__((may_alias)) — type may alias others despite strict aliasing. */
  mayAlias: boolean;
}

/** Default (no attributes): natural alignment. */
export const DEFAULT_ATTRIBUTES: LayoutAttribute = Object.freeze({
  packed: false,
  alignment: null,
  vectorSize: null,
  mayAlias: false
});

/**
 * Parse an array of Clang attribute strings into a normalized LayoutAttribute.
 * Accepts raw attribute text like "packed", "aligned(16)", "vector_size(32)",
 * "may_alias". Unrecognized attributes are ignored.
 */
export function parseLayoutAttributes(attrs: string[]): LayoutAttribute {
  let packed = false;
  let alignment: number | null = null;
  let vectorSize: number | null = null;
  let mayAlias = false;

  for (const raw of attrs) {
    const s = raw.trim();
    if (s === "packed") { packed = true; continue; }
    if (s === "may_alias") { mayAlias = true; continue; }
    const alignMatch = /^aligned\s*\(\s*(\d+)\s*\)$/.exec(s);
    if (alignMatch) { alignment = parseInt(alignMatch[1], 10); continue; }
    const bareAligned = /^aligned$/.exec(s);
    if (bareAligned) {
      // GCC: bare "aligned" without value means "max useful alignment"
      // for the target. We use 16 as a reasonable default for x86-64.
      alignment = 16;
      continue;
    }
    const vecMatch = /^vector_size\s*\(\s*(\d+)\s*\)$/.exec(s);
    if (vecMatch) { vectorSize = parseInt(vecMatch[1], 10); continue; }
    // Unknown attribute: ignore silently (forward compatibility).
  }

  return { packed, alignment, vectorSize, mayAlias };
}

/** A minimal field description for layout computation with attributes. */
export interface AttrField {
  name: string;
  type: string;
  size: number;
  align: number;
}

/** Result of computing a (possibly packed/aligned) struct layout. */
export interface PackedLayoutResult {
  offsets: number[];
  totalSize: number;
}

/**
 * Align `offset` up to the next multiple of `alignment`.
 * Identical to layout/struct.ts alignUp but re-derived to avoid circular import.
 */
function alignUp(offset: number, alignment: number): number {
  if (alignment <= 1) return offset;
  const mask = alignment - 1;
  return (offset + mask) & ~mask;
}

/**
 * Compute the byte offset of each field and the total size of the struct.
 * C17 §6.7.2.1 ¶15/¶17: natural alignment + tail padding.
 * GCC packed: no inter-field or tail padding.
 * GCC aligned(N): final size is max(natural, N), rounded up.
 *
 * Precedence rules (matching GCC):
 * - packed alone: offsets = cumulative field sizes; total = cumulative (no tail pad)
 * - aligned(N) alone: natural offsets; total rounded up to max(N, natural align)
 * - both: packed field offsets; total rounded up to N
 */
export function computePackedLayout(
  fields: AttrField[],
  attrs: LayoutAttribute
): PackedLayoutResult {
  const offsets: number[] = [];
  let cursor = 0;
  let maxAlign = 1;

  for (const f of fields) {
    if (!attrs.packed) {
      cursor = alignUp(cursor, f.align);
    }
    offsets.push(cursor);
    cursor += f.size;
    if (f.align > maxAlign) maxAlign = f.align;
  }

  // Determine total size.
  let total = cursor;
  if (!attrs.packed) {
    // Natural tail padding to max field alignment.
    total = alignUp(total, maxAlign);
  }
  if (attrs.alignment !== null) {
    // aligned(N) forces final size up to N.
    total = alignUp(total, attrs.alignment);
  }

  return { offsets, totalSize: total };
}

/**
 * Convenience wrapper: look up the offset of a named field under given attrs.
 * Returns null if the field is not present.
 */
export function offsetOfPacked(
  fields: AttrField[],
  attrs: LayoutAttribute,
  fieldName: string
): number | null {
  const { offsets } = computePackedLayout(fields, attrs);
  const idx = fields.findIndex(f => f.name === fieldName);
  return idx < 0 ? null : offsets[idx];
}
