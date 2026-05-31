import { createHash } from "node:crypto";

import type { RawFlagSet } from "../compile-commands/types.js";
import type { Diagnostic } from "./diagnostics.js";
import type { ExtensionsRecord } from "./extensions.js";
import type { IncludeGraph } from "./include-graph.js";
import type { MacroEnvironment } from "./macros.js";
import type { TargetPlatform } from "./compiler.js";

// CD-9: Multi-TU merging semantics.
//
// Rule (binding): never collapse. Each compile_commands.json entry becomes
// one TranslationUnit record, even when the `file` field matches another
// entry. Each TU gets a unique tuId computed from a content hash of its
// (file, directory, argv) tuple. Re-ingesting the same project produces
// identical tuIds - essential for regression detection and caching.

export interface TranslationUnitIdentityInputs {
  file: string;
  directory: string;
  arguments: readonly string[];
}

export function computeTuId(inputs: TranslationUnitIdentityInputs): string {
  const canonical = {
    arguments: [...inputs.arguments],
    directory: inputs.directory,
    file: inputs.file
  };
  const hash = createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("hex");
  return `tu-${hash.slice(0, 12)}`;
}

// Full TranslationUnit record as it appears in a persisted BuildContext.
//
// v0.1.0 makes several fields optional because the slices that populate them
// land later:
//
//   - `compilerRef` is optional until SP-1 compiler introspection lands
//   - `macroEnvironment`, `includeGraph`, and `targetPlatform` are optional
//     until preprocessor invocation and compiler introspection land
//
// Per CD-2 (additive-safe schema versioning), populating these fields in a
// future release is a non-breaking change that does NOT bump schemaVersion.
// Making any of them required WOULD bump schemaVersion.

export interface TranslationUnit {
  tuId: string;
  sourceFile: string;
  directory: string;
  compilerRef?: string;
  flagSet: RawFlagSet;
  macroEnvironment?: MacroEnvironment;
  includeGraph?: IncludeGraph;
  targetPlatform?: TargetPlatform;
  diagnostics: Diagnostic[];
  extensions?: ExtensionsRecord;
}
