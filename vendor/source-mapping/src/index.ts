export { runCli } from "./cli.js";
export type { CliResult } from "./cli.js";
export { renderHelp } from "./help.js";
export { ANCHOR_VERSION } from "./version.js";
export { AnchorError, SourceMapError } from "./errors.js";

export {
  canonicalizePath,
  canonicalizeRelativeTo,
  isAbsolutePath
} from "./canonical/paths.js";
export { canonicalJsonStringify, canonicalize } from "./canonical/json.js";
export { canonicalizeSourceText } from "./canonical/source-text.js";

export {
  ANCHOR_SCHEMA_VERSION,
  validateSchemaVersion
} from "./schema/version.js";
export type { AnchorSchemaVersion } from "./schema/version.js";

export {
  isValidExtensionKey,
  validateExtensions
} from "./schema/extensions.js";
export type { ExtensionsRecord } from "./schema/extensions.js";

export {
  comparePositions,
  makePosition,
  positionsEqual,
  validatePosition
} from "./schema/position.js";
export type { Position } from "./schema/position.js";

export {
  compareRanges,
  isPoint,
  makeRange,
  rangeContains,
  rangeContainsPosition,
  rangeSize,
  rangesOverlap,
  validateRange
} from "./schema/range.js";
export type { Range } from "./schema/range.js";

export {
  REGION_ID_PATTERN,
  computeRegionId,
  isValidRegionId
} from "./schema/region-id.js";
export type { RegionId } from "./schema/region-id.js";

export {
  WELL_KNOWN_CONSTRUCT_KINDS,
  isNamespacedConstructKind,
  isValidConstructKind,
  isWellKnownConstructKind
} from "./schema/construct-kind.js";
export type {
  ConstructKind,
  WellKnownConstructKind
} from "./schema/construct-kind.js";

export {
  checkStaleness,
  computeContentHash,
  makeSourceFile
} from "./schema/source-file.js";
export type {
  SourceFile,
  StalenessStatus
} from "./schema/source-file.js";

export {
  V3_ADAPTER_STATUS,
  V3_SOURCEMAP_COMPAT
} from "./schema/mapping-entry.js";
export type {
  GapFillStrategy,
  MappingEntry
} from "./schema/mapping-entry.js";

export {
  DIAGNOSTIC_CODES,
  isKnownDiagnosticCode,
  makeDiagnostic
} from "./schema/diagnostics.js";
export type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticLocation,
  DiagnosticSeverity
} from "./schema/diagnostics.js";

export { makeSourceMap } from "./schema/source-map.js";
export type {
  Generator,
  MakeSourceMapOptions,
  SourceMap
} from "./schema/source-map.js";

export {
  deserializeSourceMap,
  loadSourceMap,
  persistSourceMap,
  serializeSourceMap
} from "./persistence/store.js";

export { SourceMapIndex } from "./lookup/index.js";
export {
  formatLocalizedFailure,
  localizeFailure,
  readContextWindow
} from "./lookup/localize.js";
export { handleInspect } from "./commands/inspect.js";
export { handleLookup } from "./commands/lookup.js";
export { handleVerify } from "./commands/verify.js";
export { handleListRegions } from "./commands/list-regions.js";
export type { LocalizedFailure } from "./lookup/localize.js";
