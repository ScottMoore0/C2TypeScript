import type { ConstructKind } from "./construct-kind.js";
import type { ExtensionsRecord } from "./extensions.js";
import type { Range } from "./range.js";
import type { RegionId } from "./region-id.js";
import type { SourceFile } from "./source-file.js";

// AC-4: Forward/reverse storage.
//   Store one canonical list of MappingEntry records. Each entry carries both
//   sourceRange and targetRange. Forward and reverse indexes are built at
//   load time from this list.
//
// AC-5: Multi-region overlap.
//   Overlaps are allowed. Lookup returns all containing mappings sorted
//   most-specific-first (smallest range = most specific).
//
// AC-7: Mapping completeness.
//   Sparse. Gaps between regions are unmapped. Lookup at an unmapped position
//   returns an empty array by default; callers can pass a gapFillStrategy.

export type GapFillStrategy = "null" | "nearest" | "containingScope";

export interface MappingEntry {
  regionId: RegionId;
  sourceFile: SourceFile;
  sourceRange: Range;
  targetFile: SourceFile;
  targetRange: Range;
  kind: ConstructKind;
  semanticContext?: Record<string, unknown>;
  extensions?: ExtensionsRecord;
}

// AC-9: V3 Source Maps compatibility.
// Anchor v0.1.0 uses its own format. V3 conversion is a v1.0+ adapter.
// This constant documents the decision for downstream consumers.
export const V3_SOURCEMAP_COMPAT = "independent" as const;
export const V3_ADAPTER_STATUS = "deferred-to-v1.0" as const;
