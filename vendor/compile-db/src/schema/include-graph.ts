import type { ExtensionsRecord } from "./extensions.js";

// CD-5: Generated-header detection (heuristic-primary, observational-optional)
// and CD-8: Include path resolution order (literal GCC/Clang order with
// angle/quote distinction preserved).

export type IncludeNodeKind = "source" | "system" | "generated" | "unresolved";
export type GeneratedConfidence = "high" | "medium" | "low";
export type IncludeDirectiveKind = "angle" | "quote";

export interface IncludeNode {
  nodeId: string;
  path: string;
  kind: IncludeNodeKind;
  generatedConfidence?: GeneratedConfidence;
  extensions?: ExtensionsRecord;
}

export interface IncludeEdge {
  from: string;
  to: string;
  includeKind: IncludeDirectiveKind;
  line?: number;
  extensions?: ExtensionsRecord;
}

export interface IncludeGraph {
  nodes: IncludeNode[];
  edges: IncludeEdge[];
  cycles: string[][];
  extensions?: ExtensionsRecord;
}

// CD-8: The GCC/Clang include search order is the concatenation of four
// buckets, in order: quote paths (only for `#include "..."` form), ordinary
// `-I` paths, system `-isystem` + compiler-builtin paths, and `-idirafter`
// paths. For the quote form, the directory of the including file is tried
// first before any flag-derived paths.

export interface IncludeSearchPaths {
  quote: readonly string[];
  ordinary: readonly string[];
  system: readonly string[];
  after: readonly string[];
}

export function resolveIncludeSearchOrder(
  paths: IncludeSearchPaths,
  directive: IncludeDirectiveKind,
  currentFileDir?: string
): readonly string[] {
  const result: string[] = [];
  if (directive === "quote") {
    if (currentFileDir !== undefined) {
      result.push(currentFileDir);
    }
    result.push(...paths.quote);
    result.push(...paths.ordinary);
    result.push(...paths.system);
    result.push(...paths.after);
    return result;
  }
  // Angle form: skip current-file-dir and quote paths entirely.
  result.push(...paths.ordinary);
  result.push(...paths.system);
  result.push(...paths.after);
  return result;
}

// CD-5: classify a header as source/system/generated based on its resolved
// absolute path, an optional build directory, and an optional pre-build
// filesystem snapshot.
//
//   - Primary rule (medium confidence): the header path is inside the build
//     directory → `generated`
//   - Secondary rule (low confidence): the header path was not present on
//     disk before the build started → `generated`
//   - Observational mode (high confidence, deferred to v1.0): the header was
//     observed being created during the build
//   - Otherwise: `source`
//
// On conflict, observational > heuristic (see CD-5). This function only
// implements the heuristic-primary path; the observational path is plumbed
// through the ingestion pipeline separately in v1.0.

export interface GeneratedClassificationInputs {
  headerPath: string;
  buildDir?: string;
  preExistingOnDisk?: (path: string) => boolean;
  observedAsGenerated?: boolean;
}

export function classifyHeader(
  inputs: GeneratedClassificationInputs
): { kind: IncludeNodeKind; generatedConfidence?: GeneratedConfidence } {
  if (inputs.observedAsGenerated === true) {
    return { kind: "generated", generatedConfidence: "high" };
  }
  if (inputs.buildDir !== undefined && inputs.headerPath.startsWith(inputs.buildDir)) {
    return { kind: "generated", generatedConfidence: "medium" };
  }
  if (inputs.preExistingOnDisk !== undefined && !inputs.preExistingOnDisk(inputs.headerPath)) {
    return { kind: "generated", generatedConfidence: "low" };
  }
  return { kind: "source" };
}
