import type { AdapterId } from "../adapters/priority.js";
import { canonicalizePath, canonicalizeRelativeTo } from "../canonical/paths.js";
import {
  parseCompileCommandsJson
} from "../compile-commands/parser.js";
import { parseCompilerFlags } from "../compile-commands/flags.js";
import type {
  CompileCommandEntry,
  RawFlagSet
} from "../compile-commands/types.js";
import type { BuildContext } from "../schema/build-context.js";
import type { Diagnostic } from "../schema/diagnostics.js";
import {
  DOSSIER_SCHEMA_VERSION,
  makeBuildVariant,
  type VariantFingerprintInputs
} from "../schema/envelope.js";
import {
  computeTuId,
  type TranslationUnit
} from "../schema/translation-unit.js";

// End-to-end ingestion of a single compile_commands.json blob into a
// BuildContext record. This is the v0.1.0 core flow. It does NOT invoke
// the compiler, does NOT build an include graph, and does NOT populate
// the macro environment - those slices land in later releases and are
// additive under CD-2's schema-versioning rule.
//
// Inputs:
//   jsonText     - the raw contents of a compile_commands.json file
//   projectRoot  - the path the user pointed Dossier at (canonicalised)
//   variantLabel - optional human-readable label for the variant
//   adapter      - which adapter produced the underlying database;
//                  defaults to "existing-compile-commands" for the
//                  fast path where a database already exists on disk
//   clock        - injectable clock for deterministic testing
//                  (defaults to `() => new Date()`)
//
// Determinism: for a given input, the output is byte-identical across
// runs except for the `ingestedAt` timestamp. Tests can pass a fixed
// clock to make the whole envelope byte-stable.

export interface IngestCompileDatabaseOptions {
  jsonText: string;
  projectRoot: string;
  variantLabel?: string;
  adapter?: AdapterId;
  clock?: () => Date;
}

export function ingestCompileDatabase(
  options: IngestCompileDatabaseOptions
): BuildContext {
  const entries = parseCompileCommandsJson(options.jsonText);
  const projectRoot = canonicalizePath(options.projectRoot);
  const adapter = options.adapter ?? "existing-compile-commands";
  const clock = options.clock ?? (() => new Date());

  const translationUnits: TranslationUnit[] = entries.map((entry) =>
    buildTuRecord(entry)
  );

  const variant = makeBuildVariant(
    aggregateVariantInputs(translationUnits),
    options.variantLabel
  );

  const ingestedAt = clock().toISOString();
  const diagnostics: Diagnostic[] = [];

  return {
    schemaVersion: DOSSIER_SCHEMA_VERSION,
    ingestedAt,
    projectRoot,
    adapter,
    variant,
    compilers: [],
    translationUnits,
    diagnostics
  };
}

function buildTuRecord(entry: CompileCommandEntry): TranslationUnit {
  const directory = canonicalizePath(entry.directory);
  const sourceFile = canonicalizeRelativeTo(entry.directory, entry.file);
  const flagSet = parseCompilerFlags(entry.arguments);
  const tuId = computeTuId({
    file: sourceFile,
    directory,
    arguments: entry.arguments
  });
  return {
    tuId,
    sourceFile,
    directory,
    flagSet,
    diagnostics: []
  };
}

// Aggregate the distinguishing flags across all TUs into a single
// VariantFingerprintInputs record. For v0.1.0 the aggregation is a simple
// union across entries: defines are deduplicated by name (first occurrence
// wins), debug flags are collected from any flag starting with `-g`, and
// standard/optimisation/target-triple use the first non-empty value found.
//
// This makes the variant fingerprint stable as long as the underlying build
// is homogeneous. When the build is heterogeneous (different TUs compiled
// with different standards or targets) the fingerprint represents the first
// such value seen, which is an acceptable simplification for v0.1.0. A
// future version may emit a `compile-db/heterogeneous-variant` diagnostic when
// aggregation detects real conflicts.
function aggregateVariantInputs(
  tus: readonly TranslationUnit[]
): VariantFingerprintInputs {
  const defines = new Map<string, string | undefined>();
  const debugFlags = new Set<string>();
  let standard: string | undefined;
  let optimization: string | undefined;
  let targetTriple: string | undefined;

  for (const tu of tus) {
    for (const define of tu.flagSet.defines) {
      if (!defines.has(define.name)) {
        defines.set(define.name, define.value);
      }
    }
    for (const other of tu.flagSet.other) {
      if (other.startsWith("-g")) {
        debugFlags.add(other.slice(1));
      }
    }
    if (standard === undefined && tu.flagSet.standard !== undefined) {
      standard = tu.flagSet.standard;
    }
    if (
      optimization === undefined &&
      tu.flagSet.optimization !== undefined
    ) {
      optimization = tu.flagSet.optimization;
    }
    if (
      targetTriple === undefined &&
      tu.flagSet.targetTriple !== undefined
    ) {
      targetTriple = tu.flagSet.targetTriple;
    }
  }

  return {
    defines: [...defines.entries()].map(([name, value]) =>
      value === undefined ? { name } : { name, value }
    ),
    debugFlags: [...debugFlags],
    standard,
    optimization,
    targetTriple
  };
}

// Convenience for callers that don't care about separate entry points for
// FlagSet vs the full TU: re-export the RawFlagSet type under a stable name.
export type { RawFlagSet };
