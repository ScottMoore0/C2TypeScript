import type { ExtensionsRecord } from "./extensions.js";

// AC-13 (= Dossier CD-11/CD-13): Diagnostic taxonomy.
//
// Stable codes under the `source-mapping/*` namespace. New codes can be added but
// never renamed or removed without a schemaVersion bump.

export type DiagnosticSeverity = "warning" | "error";

export type DiagnosticCode =
  | "source-mapping/unmapped-target"
  | "source-mapping/stale-source"
  | "source-mapping/region-not-found"
  | "source-mapping/overlapping-regions"
  | "source-mapping/invalid-construct-kind"
  | "source-mapping/schema-version-mismatch"
  | "source-mapping/malformed-source-map"
  | "source-mapping/source-file-missing"
  | "source-mapping/determinism-failure";

export interface DiagnosticLocation {
  file?: string;
  line?: number;
  column?: number;
  regionId?: string;
}

export interface Diagnostic {
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
  location?: DiagnosticLocation;
  extensions?: ExtensionsRecord;
}

export const DIAGNOSTIC_CODES: readonly DiagnosticCode[] = [
  "source-mapping/unmapped-target",
  "source-mapping/stale-source",
  "source-mapping/region-not-found",
  "source-mapping/overlapping-regions",
  "source-mapping/invalid-construct-kind",
  "source-mapping/schema-version-mismatch",
  "source-mapping/malformed-source-map",
  "source-mapping/source-file-missing",
  "source-mapping/determinism-failure"
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
