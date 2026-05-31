import type { MappingEntry } from "../schema/mapping-entry.js";
import {
  compareRanges,
  rangeContainsPosition,
  rangesOverlap,
  rangeSize,
  type Range
} from "../schema/range.js";
import type { Position } from "../schema/position.js";
import type { RegionId } from "../schema/region-id.js";
import type { SourceMap } from "../schema/source-map.js";

// A-7: Forward and reverse lookup engine.
//
// Builds precomputed indexes from the canonical mapping list at construction
// time (AC-4). Lookups are O(n) scans over per-file mapping arrays for
// v0.1.0 - a future version can use interval trees for O(log n).
//
// AC-5: overlap policy. `lookupByTargetPosition` and `lookupBySourcePosition`
// return ALL overlapping mappings sorted most-specific-first (smallest range
// = most specific).
//
// AC-7: sparse mappings. A lookup at an unmapped position returns an empty
// array.

export class SourceMapIndex {
  private readonly byTargetFile = new Map<string, MappingEntry[]>();
  private readonly bySourceFile = new Map<string, MappingEntry[]>();
  private readonly byRegionId = new Map<string, MappingEntry>();

  constructor(public readonly map: SourceMap) {
    for (const entry of map.mappings) {
      const targetPath = entry.targetFile.path;
      if (!this.byTargetFile.has(targetPath)) {
        this.byTargetFile.set(targetPath, []);
      }
      this.byTargetFile.get(targetPath)!.push(entry);

      const sourcePath = entry.sourceFile.path;
      if (!this.bySourceFile.has(sourcePath)) {
        this.bySourceFile.set(sourcePath, []);
      }
      this.bySourceFile.get(sourcePath)!.push(entry);

      // Last-write-wins for duplicate regionIds (shouldn't happen in well-formed maps).
      this.byRegionId.set(entry.regionId, entry);
    }
  }

  // Returns all mappings whose target range contains the given position,
  // sorted most-specific-first (AC-5).
  lookupByTargetPosition(
    targetFile: string,
    position: Position
  ): MappingEntry[] {
    const entries = this.byTargetFile.get(targetFile) ?? [];
    return entries
      .filter((e) => rangeContainsPosition(e.targetRange, position))
      .sort((a, b) => {
        const aSize = rangeSize(a.targetRange);
        const bSize = rangeSize(b.targetRange);
        if (aSize !== bSize) return aSize - bSize;
        return compareRanges(a.targetRange, b.targetRange);
      });
  }

  // Returns all mappings whose source range contains the given position,
  // sorted most-specific-first.
  lookupBySourcePosition(
    sourceFile: string,
    position: Position
  ): MappingEntry[] {
    const entries = this.bySourceFile.get(sourceFile) ?? [];
    return entries
      .filter((e) => rangeContainsPosition(e.sourceRange, position))
      .sort((a, b) => {
        const aSize = rangeSize(a.sourceRange);
        const bSize = rangeSize(b.sourceRange);
        if (aSize !== bSize) return aSize - bSize;
        return compareRanges(a.sourceRange, b.sourceRange);
      });
  }

  // Returns all mappings whose target range overlaps the given range.
  lookupByTargetRange(
    targetFile: string,
    range: Range
  ): MappingEntry[] {
    const entries = this.byTargetFile.get(targetFile) ?? [];
    return entries
      .filter((e) => rangesOverlap(e.targetRange, range))
      .sort((a, b) => compareRanges(a.targetRange, b.targetRange));
  }

  // Returns all mappings whose source range overlaps the given range.
  lookupBySourceRange(
    sourceFile: string,
    range: Range
  ): MappingEntry[] {
    const entries = this.bySourceFile.get(sourceFile) ?? [];
    return entries
      .filter((e) => rangesOverlap(e.sourceRange, range))
      .sort((a, b) => compareRanges(a.sourceRange, b.sourceRange));
  }

  // O(1) lookup by region identity.
  lookupByRegionId(regionId: RegionId): MappingEntry | undefined {
    return this.byRegionId.get(regionId);
  }

  // Returns the single most-specific mapping containing `position` on the
  // target side, or undefined if the position is unmapped (AC-7 sparse).
  mostSpecificAtTarget(
    targetFile: string,
    position: Position
  ): MappingEntry | undefined {
    return this.lookupByTargetPosition(targetFile, position)[0];
  }

  // Returns the single most-specific mapping containing `position` on the
  // source side, or undefined if unmapped.
  mostSpecificAtSource(
    sourceFile: string,
    position: Position
  ): MappingEntry | undefined {
    return this.lookupBySourcePosition(sourceFile, position)[0];
  }

  // Utility: unique source file paths across all mappings.
  sourceFiles(): string[] {
    return [...this.bySourceFile.keys()].sort();
  }

  // Utility: unique target file paths across all mappings.
  targetFiles(): string[] {
    return [...this.byTargetFile.keys()].sort();
  }

  // Utility: all region IDs.
  regionIds(): string[] {
    return [...this.byRegionId.keys()].sort();
  }
}
