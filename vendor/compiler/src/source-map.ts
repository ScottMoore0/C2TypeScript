/**
 * Source Map v3 writer module.
 *
 * Spec: Source Map Revision 3 Proposal — https://sourcemaps.info/spec.html
 *
 * Encoding (per spec):
 *   - The `mappings` string is a list of generated lines separated by `;`.
 *   - Within a line, segments are separated by `,`.
 *   - Each segment is 1, 4, or 5 VLQ-encoded fields:
 *       [generatedColumn, sourceIndex, sourceLine, sourceColumn, nameIndex]
 *   - All fields except generatedColumn are *delta-encoded* relative to the
 *     previous segment's value (across the entire `mappings` string, NOT just
 *     within a line). generatedColumn resets to 0 at each `;`.
 *   - Field values are encoded as Base64 VLQ: a signed integer is mapped to
 *     unsigned by placing the sign bit in the LSB of the first 5-bit group;
 *     each 5-bit group is OR'd with a 6th continuation bit if more groups
 *     follow, and finally rendered with the standard Base64 alphabet.
 *
 * Charter requirement #10: emit source maps linking each emitted TypeScript
 * line/range to the corresponding C/C++/Lua source location, so refactoring
 * tools can display the original construct when editing.
 *
 * Pinned public API (consumed by emitter / cli / e2e tests in parallel):
 *
 *   export interface SourceLoc { file: string; line: number; column: number; }
 *   export class SourceMap {
 *     constructor();
 *     addMapping(gen: { line: number; column: number }, src: SourceLoc): void;
 *     toJSON(file: string): {
 *       version: 3; file: string; sources: string[];
 *       sourcesContent?: (string | null)[]; names: string[]; mappings: string;
 *     };
 *   }
 */

const VLQ_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Encode a signed integer as a Base64 VLQ string per the source-map v3 spec.
 *
 * The sign is moved to the LSB of the first 5-bit group:
 *   - non-negative: value << 1
 *   - negative:     ((-value) << 1) | 1
 *
 * Each 5-bit group (mask 0b11111) is emitted; if more groups remain after
 * shifting right by 5, a continuation bit (0b100000) is OR'd in.
 */
function encodeVlq(value: number): string {
  let vlq = value < 0 ? ((-value) << 1) | 1 : value << 1;
  let out = "";
  do {
    let digit = vlq & 0b11111;
    vlq >>>= 5;
    if (vlq > 0) digit |= 0b100000;
    out += VLQ_ALPHABET[digit]!;
  } while (vlq > 0);
  return out;
}

/**
 * Decode a Base64 VLQ string into the array of signed integers it encodes.
 * Used by the unit tests to round-trip mappings; not on the emitter hot path.
 */
function decodeVlq(s: string): number[] {
  const out: number[] = [];
  let shift = 0;
  let value = 0;
  for (let i = 0; i < s.length; i++) {
    const digit = VLQ_ALPHABET.indexOf(s[i]!);
    if (digit < 0) throw new Error(`invalid VLQ character: ${s[i]}`);
    const cont = (digit & 0b100000) !== 0;
    const chunk = digit & 0b11111;
    value += chunk << shift;
    shift += 5;
    if (!cont) {
      const negative = (value & 1) === 1;
      const shifted = value >>> 1;
      out.push(negative ? -shifted : shifted);
      value = 0;
      shift = 0;
    }
  }
  return out;
}

/** Pinned public type — a position in an original source file. */
export interface SourceLoc {
  file: string;
  /** 1-based line number, per source-map v3 convention for source lines. */
  line: number;
  /** 0-based column number, per source-map v3 convention. */
  column: number;
}

interface InternalMapping {
  generatedLine: number;   // 1-based
  generatedCol: number;    // 0-based
  sourceFile: string;
  sourceLine: number;      // 1-based on the wire
  sourceCol: number;       // 0-based on the wire
}

/**
 * Pinned public class.
 *
 * Internally stores mapping tuples as recorded; defers VLQ encoding and
 * line bucketing to `toJSON()`. `addMapping` is idempotent: identical
 * (gen, src) tuples are deduplicated, so callers (e.g. an emitter that
 * touches the same AST node twice) do not produce duplicate segments.
 */
export class SourceMap {
  private sources: string[] = [];
  private sourceIndex = new Map<string, number>();
  private mappings: InternalMapping[] = [];
  private mappingKeys = new Set<string>();

  constructor() {}

  /**
   * Record a mapping from a generated TS position to an original source
   * position. Identical repeated calls are no-ops.
   *
   * @param gen   { line: 1-based, column: 0-based } in the generated file.
   * @param src   { file, line: 1-based, column: 0-based } in an input file.
   */
  addMapping(
    gen: { line: number; column: number },
    src: SourceLoc,
  ): void {
    // Idempotency key: encoding all five fields of the mapping.
    const key = `${gen.line}:${gen.column}|${src.file}:${src.line}:${src.column}`;
    if (this.mappingKeys.has(key)) return;
    this.mappingKeys.add(key);

    if (!this.sourceIndex.has(src.file)) {
      this.sourceIndex.set(src.file, this.sources.length);
      this.sources.push(src.file);
    }
    this.mappings.push({
      generatedLine: gen.line,
      generatedCol: gen.column,
      sourceFile: src.file,
      sourceLine: src.line,
      sourceCol: src.column,
    });
  }

  /**
   * Materialise the source-map v3 JSON object for the generated file.
   *
   * Per spec, fields are delta-encoded against the previous segment for
   * sourceIndex/sourceLine/sourceColumn (carried across `;`), while
   * generatedColumn resets to 0 at each `;`. Names are unused (always `[]`)
   * since the translator does not yet thread original-symbol identifiers
   * through to mapping sites.
   */
  toJSON(file: string): {
    version: 3;
    file: string;
    sources: string[];
    sourcesContent?: (string | null)[];
    names: string[];
    mappings: string;
  } {
    // Sort mappings by (generatedLine, generatedColumn) for stable output.
    const sorted = [...this.mappings].sort((a, b) =>
      a.generatedLine - b.generatedLine ||
      a.generatedCol - b.generatedCol,
    );

    const maxLine = sorted.length > 0
      ? sorted[sorted.length - 1]!.generatedLine
      : 0;

    // Bucket by 1-based generated line.
    const byLine: InternalMapping[][] = [];
    for (let i = 0; i <= maxLine; i++) byLine.push([]);
    for (const m of sorted) byLine[m.generatedLine]!.push(m);

    // Running deltas. sourceIdx/sourceLine/sourceCol persist across `;`;
    // generatedCol resets per line (per spec).
    let prevSourceIdx = 0;
    let prevSourceLine = 0; // already 0-based on the wire
    let prevSourceCol = 0;

    const lineGroups: string[] = [];
    for (let line = 1; line <= maxLine; line++) {
      const segments: string[] = [];
      let prevGenCol = 0;
      for (const m of byLine[line]!) {
        const srcIdx = this.sourceIndex.get(m.sourceFile)!;
        // Convert source line from 1-based (API) to 0-based (wire).
        const wireSrcLine = m.sourceLine - 1;
        const seg =
          encodeVlq(m.generatedCol - prevGenCol) +
          encodeVlq(srcIdx - prevSourceIdx) +
          encodeVlq(wireSrcLine - prevSourceLine) +
          encodeVlq(m.sourceCol - prevSourceCol);
        segments.push(seg);
        prevGenCol = m.generatedCol;
        prevSourceIdx = srcIdx;
        prevSourceLine = wireSrcLine;
        prevSourceCol = m.sourceCol;
      }
      lineGroups.push(segments.join(","));
    }

    return {
      version: 3,
      file,
      sources: [...this.sources],
      names: [],
      mappings: lineGroups.join(";"),
    };
  }
}

// ---------------------------------------------------------------------------
// Backward-compatible helper class (pre-existing in the tree). Wraps the
// pinned `SourceMap` so older callers that imported `SourceMapBuilder` keep
// working. New code should use `SourceMap` directly.
// ---------------------------------------------------------------------------

export class SourceMapBuilder {
  private generatedFile: string;
  private map = new SourceMap();

  constructor(generatedFile: string) {
    this.generatedFile = generatedFile;
  }

  addMapping(
    generatedLine: number,
    generatedCol: number,
    sourceFile: string,
    sourceLine: number,
    sourceCol: number,
  ): void {
    this.map.addMapping(
      { line: generatedLine, column: generatedCol },
      { file: sourceFile, line: sourceLine, column: sourceCol },
    );
  }

  build(): string {
    const json = this.map.toJSON(this.generatedFile);
    // Older shape carried `sourceRoot: ""`; preserve it for compatibility.
    return JSON.stringify({ ...json, sourceRoot: "" });
  }
}

// Exported for unit tests.
export const __test = { encodeVlq, decodeVlq };
