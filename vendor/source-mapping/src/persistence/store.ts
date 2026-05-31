import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { canonicalJsonStringify } from "../canonical/json.js";
import { AnchorError } from "../errors.js";
import type { SourceMap } from "../schema/source-map.js";
import { validateSchemaVersion } from "../schema/version.js";

// AC-12 persistence layer: serialise a SourceMap to the canonical JSON form,
// persist it to disk, and load it back with validation.
//
// The canonical writer gives byte-identical output across runs for the same
// input (modulo the `generatedAt` timestamp, which can be fixed via the
// `clock` injection point on `makeSourceMap`).

export function serializeSourceMap(map: SourceMap): string {
  return canonicalJsonStringify(map);
}

export function deserializeSourceMap(text: string): SourceMap {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AnchorError(`Failed to parse source map JSON: ${message}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AnchorError("source map must be a JSON object at the top level");
  }

  const obj = parsed as Record<string, unknown>;

  validateSchemaVersion(obj.schemaVersion, "schemaVersion");

  const required: readonly string[] = [
    "generator",
    "generatedAt",
    "mappings",
    "diagnostics"
  ];
  for (const field of required) {
    if (!(field in obj)) {
      throw new AnchorError(`source map missing required field: ${field}`);
    }
  }

  if (!Array.isArray(obj.mappings)) {
    throw new AnchorError("source map mappings must be an array");
  }
  if (!Array.isArray(obj.diagnostics)) {
    throw new AnchorError("source map diagnostics must be an array");
  }
  if (typeof obj.generator !== "object" || obj.generator === null) {
    throw new AnchorError("source map generator must be an object");
  }

  return obj as unknown as SourceMap;
}

export function persistSourceMap(map: SourceMap, path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeSourceMap(map), "utf8");
}

export function loadSourceMap(path: string): SourceMap {
  const text = readFileSync(path, "utf8");
  return deserializeSourceMap(text);
}
