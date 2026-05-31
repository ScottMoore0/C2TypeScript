// BC-4: Struct layout engine — sizeof, offsetof, alignment, padding.
// C17 §6.7.2.1: Structure and union specifiers.
// C17 §6.2.8: Alignment of objects.
//
// Given a list of field types (each with a size and alignment), compute
// the offset of each field, the total size, and the alignment of the struct.
// This matches the System V x86-64 ABI (default for Clang/GCC on Linux).

export interface FieldType {
  name: string;
  size: number;       // sizeof(field) in bytes
  alignment: number;  // alignof(field) in bytes
}

export interface FieldLayout {
  name: string;
  offset: number;     // byte offset from struct start
  size: number;       // sizeof this field
  alignment: number;
}

export interface StructLayout {
  fields: FieldLayout[];
  size: number;       // total sizeof(struct) including tail padding
  alignment: number;  // alignof(struct) = max field alignment
}

// --- Primitive type sizes (System V x86-64 / LP64) ---

export const CHAR: FieldType   = { name: "char",   size: 1, alignment: 1 };
export const INT8: FieldType   = { name: "int8",   size: 1, alignment: 1 };
export const UINT8: FieldType  = { name: "uint8",  size: 1, alignment: 1 };
export const INT16: FieldType  = { name: "int16",  size: 2, alignment: 2 };
export const UINT16: FieldType = { name: "uint16", size: 2, alignment: 2 };
export const INT32: FieldType  = { name: "int32",  size: 4, alignment: 4 };
export const UINT32: FieldType = { name: "uint32", size: 4, alignment: 4 };
export const INT64: FieldType  = { name: "int64",  size: 8, alignment: 8 };
export const UINT64: FieldType = { name: "uint64", size: 8, alignment: 8 };
export const FLOAT: FieldType  = { name: "float",  size: 4, alignment: 4 };
export const DOUBLE: FieldType = { name: "double", size: 8, alignment: 8 };
export const PTR: FieldType    = { name: "ptr",    size: 8, alignment: 8 }; // 64-bit pointers

/** Create a FieldType for a fixed-size array: T[count]. */
export function arrayType(name: string, element: FieldType, count: number): FieldType {
  return { name, size: element.size * count, alignment: element.alignment };
}

/** Create a FieldType from a previously computed struct layout. */
export function structType(name: string, layout: StructLayout): FieldType {
  return { name, size: layout.size, alignment: layout.alignment };
}

// --- Layout computation ---

/** Align `offset` up to the next multiple of `alignment`. C17 §6.2.8. */
export function alignUp(offset: number, alignment: number): number {
  const mask = alignment - 1;
  return (offset + mask) & ~mask;
}

/**
 * Compute the layout of a struct given its fields in declaration order.
 * C17 §6.7.2.1 ¶15: each field is placed at the next suitably aligned offset.
 * C17 §6.7.2.1 ¶17: the struct's alignment is the maximum of its fields' alignments.
 * C17 §6.7.2.1 ¶17: the struct's size is padded to a multiple of its alignment.
 */
export function computeStructLayout(fields: Array<{ name: string; type: FieldType }>): StructLayout {
  let offset = 0;
  let maxAlign = 1;
  const result: FieldLayout[] = [];

  for (const { name, type } of fields) {
    // Align to field's required alignment.
    offset = alignUp(offset, type.alignment);
    result.push({
      name,
      offset,
      size: type.size,
      alignment: type.alignment
    });
    offset += type.size;
    if (type.alignment > maxAlign) maxAlign = type.alignment;
  }

  // Tail padding: struct size is a multiple of its alignment.
  const totalSize = alignUp(offset, maxAlign);

  return { fields: result, size: totalSize, alignment: maxAlign };
}

/**
 * Compute the layout of a union (all fields start at offset 0).
 * C17 §6.7.2.1 ¶16: size is at least as large as the largest member.
 */
export function computeUnionLayout(fields: Array<{ name: string; type: FieldType }>): StructLayout {
  let maxSize = 0;
  let maxAlign = 1;
  const result: FieldLayout[] = [];

  for (const { name, type } of fields) {
    result.push({ name, offset: 0, size: type.size, alignment: type.alignment });
    if (type.size > maxSize) maxSize = type.size;
    if (type.alignment > maxAlign) maxAlign = type.alignment;
  }

  return { fields: result, size: alignUp(maxSize, maxAlign), alignment: maxAlign };
}

/** Look up a field's offset by name. Equivalent to C's offsetof(). */
export function offsetof(layout: StructLayout, fieldName: string): number {
  const field = layout.fields.find(f => f.name === fieldName);
  if (!field) throw new Error(`field '${fieldName}' not found in struct layout`);
  return field.offset;
}
