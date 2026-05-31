import { AnchorError } from "../errors.js";
import {
  comparePositions,
  positionsEqual,
  validatePosition,
  type Position
} from "./position.js";

// AC-2: Range vs point.
//
// Rule (binding): every mapping is a range with start and end positions.
// A point is encoded as a range where end === start. This is strictly more
// expressive than point-only and matches LSP, tree-sitter, and rust-analyzer
// conventions.

export interface Range {
  start: Position;
  end: Position;
}

export function validateRange(
  range: unknown,
  recordPath: string = "range"
): Range {
  if (typeof range !== "object" || range === null || Array.isArray(range)) {
    throw new AnchorError(`${recordPath} must be an object`);
  }
  const obj = range as Record<string, unknown>;

  const start = validatePosition(obj.start, `${recordPath}.start`);
  const end = validatePosition(obj.end, `${recordPath}.end`);

  if (comparePositions(end, start) < 0) {
    throw new AnchorError(
      `${recordPath}: end position (byteOffset ${end.byteOffset}) must not be before start position (byteOffset ${start.byteOffset})`
    );
  }

  return { start, end };
}

export function makeRange(start: Position, end: Position): Range {
  return validateRange({ start, end });
}

export function isPoint(range: Range): boolean {
  return positionsEqual(range.start, range.end);
}

export function rangeSize(range: Range): number {
  return range.end.byteOffset - range.start.byteOffset;
}

// True if `outer` fully contains `inner` (inclusive at both ends).
export function rangeContains(outer: Range, inner: Range): boolean {
  return (
    comparePositions(outer.start, inner.start) <= 0 &&
    comparePositions(outer.end, inner.end) >= 0
  );
}

// True if `a` and `b` share at least one byte.
export function rangesOverlap(a: Range, b: Range): boolean {
  return (
    comparePositions(a.start, b.end) < 0 &&
    comparePositions(b.start, a.end) < 0
  );
}

// Stable comparator: by start position, then by size (smaller first = more
// specific). This matches AC-5's most-specific-first lookup ordering.
export function compareRanges(a: Range, b: Range): -1 | 0 | 1 {
  const startCmp = comparePositions(a.start, b.start);
  if (startCmp !== 0) return startCmp;
  const aSize = rangeSize(a);
  const bSize = rangeSize(b);
  if (aSize < bSize) return -1;
  if (aSize > bSize) return 1;
  return 0;
}

// True if `range` contains `position` (inclusive of both ends).
export function rangeContainsPosition(range: Range, position: Position): boolean {
  return (
    comparePositions(range.start, position) <= 0 &&
    comparePositions(position, range.end) <= 0
  );
}
