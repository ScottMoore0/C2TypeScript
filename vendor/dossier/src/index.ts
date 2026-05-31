export { runCli } from "./cli.js";
export type { CliResult } from "./cli.js";
export { renderHelp } from "./help.js";
export { DOSSIER_VERSION } from "./version.js";
export { DossierError, CompileCommandError } from "./errors.js";

export { parseCompileCommandsJson } from "./compile-commands/parser.js";
export { tokenizeShellCommand } from "./compile-commands/tokenize.js";
export { parseCompilerFlags } from "./compile-commands/flags.js";
export type {
  CompileCommandEntry,
  IncludeFlag,
  IncludeKind,
  DefineFlag,
  RawFlagSet
} from "./compile-commands/types.js";

export {
  canonicalizePath,
  canonicalizeRelativeTo,
  isAbsolutePath
} from "./canonical/paths.js";
export { canonicalJsonStringify, canonicalize } from "./canonical/json.js";

export {
  isValidExtensionKey,
  validateExtensions
} from "./schema/extensions.js";
export type { ExtensionsRecord } from "./schema/extensions.js";

export {
  DOSSIER_SCHEMA_VERSION,
  computeVariantFingerprint,
  makeBuildVariant,
  validateSchemaVersion
} from "./schema/envelope.js";
export type {
  BuildVariant,
  DossierSchemaVersion,
  VariantFingerprintInputs
} from "./schema/envelope.js";

export {
  computeCompilerFingerprint,
  makeCompilerIdentity,
  validateTargetPlatform
} from "./schema/compiler.js";
export type {
  CompilerIdentity,
  CompilerIdentityInputs,
  CompilerVendor,
  Endianness,
  PointerSize,
  TargetPlatform
} from "./schema/compiler.js";

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

export {
  canonicalizeMacroValue,
  makeFunctionMacro,
  makeObjectMacro,
  parseDefineBody
} from "./schema/macros.js";
export type {
  MacroDefinition,
  MacroEnvironment,
  MacroKind,
  MacroOrigin
} from "./schema/macros.js";

export {
  classifyHeader,
  resolveIncludeSearchOrder
} from "./schema/include-graph.js";
export type {
  GeneratedClassificationInputs,
  GeneratedConfidence,
  IncludeDirectiveKind,
  IncludeEdge,
  IncludeGraph,
  IncludeNode,
  IncludeNodeKind,
  IncludeSearchPaths
} from "./schema/include-graph.js";

export { computeTuId } from "./schema/translation-unit.js";
export type {
  TranslationUnit,
  TranslationUnitIdentityInputs
} from "./schema/translation-unit.js";

export type { BuildContext } from "./schema/build-context.js";

export { ingestCompileDatabase } from "./ingest/compile-db.js";
export type { IngestCompileDatabaseOptions } from "./ingest/compile-db.js";

export {
  deserializeBuildContext,
  loadBuildContext,
  persistBuildContext,
  serializeBuildContext
} from "./persistence/store.js";

export { handleIngest } from "./commands/ingest.js";
export { handleValidate } from "./commands/validate.js";
export { handleListTus } from "./commands/list-tus.js";

export {
  ADAPTER_PRIORITY_ORDER,
  COMPILE_DB_SEARCH_LOCATIONS,
  DEFERRED_ADAPTERS,
  isDeferredAdapter,
  isKnownAdapter
} from "./adapters/priority.js";
export type {
  AdapterId,
  DeferredAdapterId
} from "./adapters/priority.js";
