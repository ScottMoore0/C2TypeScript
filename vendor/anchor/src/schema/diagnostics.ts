import type { ExtensionsRecord } from "./extensions.js";

// AC-13 (= Dossier CD-11/CD-13): Diagnostic taxonomy.
//
// Stable codes under the `anchor/*` namespace. New codes can be added but
// never renamed or removed without a schemaVersion bump.

export type DiagnosticSeverity = "warning" | "error";

export type DiagnosticCode =
  | "anchor/unmapped-target"
  | "anchor/stale-source"
  | "anchor/region-not-found"
  | "anchor/overlapping-regions"
  | "anchor/invalid-construct-kind"
  | "anchor/schema-version-mismatch"
  | "anchor/malformed-source-map"
  | "anchor/source-file-missing"
  | "anchor/determinism-failure";

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
  "anchor/unmapped-target",
  "anchor/stale-source",
  "anchor/region-not-found",
  "anchor/overlapping-regions",
  "anchor/invalid-construct-kind",
  "anchor/schema-version-mismatch",
  "anchor/malformed-source-map",
  "anchor/source-file-missing",
  "anchor/determinism-failure"
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
