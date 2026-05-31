import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { canonicalJsonStringify } from "../canonical/json.js";
import { DossierError } from "../errors.js";
import type { BuildContext } from "../schema/build-context.js";
import { validateSchemaVersion } from "../schema/envelope.js";

// CD-12 persistence layer: serialise a BuildContext to the canonical JSON
// form, persist it to disk, and load it back with validation.
//
// The canonical writer gives us byte-identical output across runs for the
// same input, which is essential for the determinism gate and for any
// downstream regression tracking that diffs two stored BuildContexts.

export function serializeBuildContext(context: BuildContext): string {
  return canonicalJsonStringify(context);
}

export function deserializeBuildContext(text: string): BuildContext {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DossierError(`Failed to parse build context JSON: ${message}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new DossierError(
      "build context must be a JSON object at the top level"
    );
  }

  const obj = parsed as Record<string, unknown>;

  // CD-2 schema-version fail-fast before inspecting anything else.
  validateSchemaVersion(obj.schemaVersion, "schemaVersion");

  // Lightweight shape check: required top-level fields. A full recursive
  // validation is deferred to a later slice - the schema is large and the
  // full validator is additive.
  const required: readonly string[] = [
    "ingestedAt",
    "projectRoot",
    "adapter",
    "variant",
    "compilers",
    "translationUnits",
    "diagnostics"
  ];
  for (const field of required) {
    if (!(field in obj)) {
      throw new DossierError(
        `build context missing required field: ${field}`
      );
    }
  }

  if (!Array.isArray(obj.translationUnits)) {
    throw new DossierError("build context translationUnits must be an array");
  }
  if (!Array.isArray(obj.compilers)) {
    throw new DossierError("build context compilers must be an array");
  }
  if (!Array.isArray(obj.diagnostics)) {
    throw new DossierError("build context diagnostics must be an array");
  }

  return obj as unknown as BuildContext;
}

export function persistBuildContext(
  context: BuildContext,
  path: string
): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeBuildContext(context), "utf8");
}

export function loadBuildContext(path: string): BuildContext {
  const text = readFileSync(path, "utf8");
  return deserializeBuildContext(text);
}
