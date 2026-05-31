import type { AdapterId } from "../adapters/priority.js";
import type { CompilerIdentity } from "./compiler.js";
import type { Diagnostic } from "./diagnostics.js";
import type { BuildVariant, DossierSchemaVersion } from "./envelope.js";
import type { ExtensionsRecord } from "./extensions.js";
import type { TranslationUnit } from "./translation-unit.js";

// The top-level BuildContext envelope. One of these is produced per ingestion
// run. It carries:
//
//   - schemaVersion: the integer from CD-2 (currently 1)
//   - ingestedAt: an ISO-8601 timestamp recording when the ingestion ran
//   - projectRoot: the canonical absolute path the user pointed Dossier at
//   - adapter: which build-system adapter produced the underlying compile
//     database (see CD-10 and adapters/priority.ts)
//   - variant: the CD-3 variant fingerprint (+ optional label) derived from
//     the aggregated distinguishing flags across all TUs in this run
//   - compilers: a deduplicated array of CompilerIdentity records
//     referenced by `translationUnit.compilerRef`. Empty in v0.1.0 until
//     compiler introspection lands.
//   - translationUnits: one record per compile_commands.json entry
//     (never collapsed, per CD-9)
//   - diagnostics: top-level warnings/errors that applied to the whole run
//     rather than any individual TU
//   - extensions: CD-14 namespaced extension slot

export interface BuildContext {
  schemaVersion: DossierSchemaVersion;
  ingestedAt: string;
  projectRoot: string;
  adapter: AdapterId;
  variant: BuildVariant;
  compilers: CompilerIdentity[];
  translationUnits: TranslationUnit[];
  diagnostics: Diagnostic[];
  extensions?: ExtensionsRecord;
}
