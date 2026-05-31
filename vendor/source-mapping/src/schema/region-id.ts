import { createHash } from "node:crypto";

import { canonicalizeSourceText } from "../canonical/source-text.js";

// AC-3: Region identity scheme.
//
// Rule (binding): a region's stable identifier is the SHA-256 of its
// canonicalised source span text, truncated to 12 hex characters and
// formatted as `region-<12hex>`. Canonicalisation collapses whitespace
// runs to single spaces, normalises line endings to LF, and trims trailing
// whitespace per line, so that formatting changes do not break IDs.
//
// Rename a variable inside a region -> hash changes (correct: this is a
// real source change). Reformat the whitespace around it -> hash unchanged.
//
// The 12-hex truncation matches Dossier's tu-<12hex> and variant-<12hex>
// conventions.

export type RegionId = string;

export const REGION_ID_PATTERN = /^region-[0-9a-f]{12}$/;

export function isValidRegionId(id: string): boolean {
  return REGION_ID_PATTERN.test(id);
}

export function computeRegionId(sourceSpanText: string): RegionId {
  const canonical = canonicalizeSourceText(sourceSpanText);
  const hash = createHash("sha256").update(canonical, "utf8").digest("hex");
  return `region-${hash.slice(0, 12)}`;
}
