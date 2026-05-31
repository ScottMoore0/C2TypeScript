import { AnchorError } from "../errors.js";

// AC-1: Position model.
//
// Rules (binding):
//   - 1-based line for human display (compiler convention)
//   - 1-based UTF-8 byte offset within the line for human display
//   - 0-based absolute byte offset is the canonical identity
//   - byteOffset is the comparator; line/column are presentation
//
// Two positions are equal iff their byteOffsets agree. The line/column form
// is preserved for human-readable error messages and CLI output, but
// programmatic comparisons always use byteOffset to avoid the unicode
// "what is a column" problem entirely.

export interface Position {
  line: number;        // 1-based, for human display
  column: number;      // 1-based UTF-8 byte offset within the line
  byteOffset: number;  // 0-based absolute byte offset, canonical identity
}

export function validatePosition(
  position: unknown,
  recordPath: string = "position"
): Position {
  if (typeof position !== "object" || position === null || Array.isArray(position)) {
    throw new AnchorError(`${recordPath} must be an object`);
  }
  const obj = position as Record<string, unknown>;

  if (
    typeof obj.line !== "number" ||
    !Number.isInteger(obj.line) ||
    obj.line < 1
  ) {
    throw new AnchorError(`${recordPath}.line must be a positive integer (1-based)`);
  }
  if (
    typeof obj.column !== "number" ||
    !Number.isInteger(obj.column) ||
    obj.column < 1
  ) {
    throw new AnchorError(`${recordPath}.column must be a positive integer (1-based)`);
  }
  if (
    typeof obj.byteOffset !== "number" ||
    !Number.isInteger(obj.byteOffset) ||
    obj.byteOffset < 0
  ) {
    throw new AnchorError(`${recordPath}.byteOffset must be a non-negative integer`);
  }

  return {
    line: obj.line,
    column: obj.column,
    byteOffset: obj.byteOffset
  };
}

// CD-1 canonical comparator: byteOffset is the source of truth.
export function comparePositions(a: Position, b: Position): -1 | 0 | 1 {
  if (a.byteOffset < b.byteOffset) return -1;
  if (a.byteOffset > b.byteOffset) return 1;
  return 0;
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.byteOffset === b.byteOffset;
}

// Convenience: build a Position from line/column when the absolute byte
// offset is known. Validates the inputs and returns the structured form.
export function makePosition(
  line: number,
  column: number,
  byteOffset: number
): Position {
  return validatePosition({ line, column, byteOffset });
}
