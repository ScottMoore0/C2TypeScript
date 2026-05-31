import type { ExtensionsRecord } from "./extensions.js";

// CD-11 + CD-13: Diagnostic taxonomy.
//
// Errors are unrecoverable: the BuildContext cannot be produced at all.
// They surface as thrown DossierError subclasses at the library layer and
// as exit-code 1 from the CLI.
//
// Warnings are caveats: the BuildContext is produced but carries diagnostics
// that downstream tools can inspect and act on. They do not change the CLI
// exit code by default. Passing --strict promotes every warning into an
// error (exit 1, throw).
//
// Diagnostic codes are stable across Dossier versions: new codes are added,
// never renamed or removed. Downstream tools can pattern-match on a specific
// code with confidence that it means the same thing in v0.1.0 and v10.0.0.

export type DiagnosticSeverity = "warning" | "error";

export type DiagnosticCode =
  | "dossier/unresolved-include"
  | "dossier/target-triple-mismatch"
  | "dossier/generated-header-confidence-low"
  | "dossier/compiler-version-unknown"
  | "dossier/missing-compiler"
  | "dossier/malformed-compile-command"
  | "dossier/adapter-not-found"
  | "dossier/cmake-exit-nonzero"
  | "dossier/preprocessor-failed"
  | "dossier/include-cycle-detected"
  | "dossier/partial-ingest"
  | "dossier/schema-extension-rejected";

export interface DiagnosticLocation {
  tuId?: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface Diagnostic {
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
  location?: DiagnosticLocation;
  extensions?: ExtensionsRecord;
}

// Every valid diagnostic code the library knows about. Used for validation
// and for the stable-code guarantee (tests assert that removing a code is
// detected at build time).
export const DIAGNOSTIC_CODES: readonly DiagnosticCode[] = [
  "dossier/unresolved-include",
  "dossier/target-triple-mismatch",
  "dossier/generated-header-confidence-low",
  "dossier/compiler-version-unknown",
  "dossier/missing-compiler",
  "dossier/malformed-compile-command",
  "dossier/adapter-not-found",
  "dossier/cmake-exit-nonzero",
  "dossier/preprocessor-failed",
  "dossier/include-cycle-detected",
  "dossier/partial-ingest",
  "dossier/schema-extension-rejected"
] as const;

export function isKnownDiagnosticCode(code: string): code is DiagnosticCode {
  return (DIAGNOSTIC_CODES as readonly string[]).includes(code);
}

export function makeDiagnostic(
  severity: DiagnosticSeverity,
  code: DiagnosticCode,
  message: string,
  location?: DiagnosticLocation
): Diagnostic {
  const diagnostic: Diagnostic = { severity, code, message };
  if (location !== undefined) {
    diagnostic.location = location;
  }
  return diagnostic;
}
