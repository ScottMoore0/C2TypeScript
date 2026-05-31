import type { Diagnostic } from "./diagnostics.js";
import type { ExtensionsRecord } from "./extensions.js";
import type { MappingEntry } from "./mapping-entry.js";
import { ANCHOR_SCHEMA_VERSION, type AnchorSchemaVersion } from "./version.js";

// The top-level SourceMap document. One of these is produced per translator
// run. It carries the schema version, the generator identity, a timestamp,
// the canonical list of mapping entries (AC-4: both source and target ranges
// per entry), diagnostics from the generation pass, and an optional
// extensions slot.

export interface Generator {
  name: string;
  version: string;
  options?: Record<string, unknown>;
}

export interface SourceMap {
  schemaVersion: AnchorSchemaVersion;
  generator: Generator;
  generatedAt: string;
  mappings: MappingEntry[];
  diagnostics: Diagnostic[];
  extensions?: ExtensionsRecord;
}

export interface MakeSourceMapOptions {
  generator: Generator;
  mappings: MappingEntry[];
  diagnostics?: Diagnostic[];
  extensions?: ExtensionsRecord;
  clock?: () => Date;
}

export function makeSourceMap(options: MakeSourceMapOptions): SourceMap {
  const generatedAt = (options.clock ?? (() => new Date()))().toISOString();
  const map: SourceMap = {
    schemaVersion: ANCHOR_SCHEMA_VERSION,
    generator: options.generator,
    generatedAt,
    mappings: options.mappings,
    diagnostics: options.diagnostics ?? []
  };
  if (options.extensions !== undefined) {
    map.extensions = options.extensions;
  }
  return map;
}
