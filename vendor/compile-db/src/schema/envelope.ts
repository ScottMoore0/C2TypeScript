import { createHash } from "node:crypto";

import { DossierError } from "../errors.js";
import type { ExtensionsRecord } from "./extensions.js";

// CD-2: Schema versioning.
//
// Rules (binding):
//   - `schemaVersion` is a single integer, starting at 1
//   - Additive fields never bump the version
//   - Breaking changes bump the integer
//   - Loaders fail-fast on unknown future versions

export const DOSSIER_SCHEMA_VERSION = 1 as const;
export type DossierSchemaVersion = typeof DOSSIER_SCHEMA_VERSION;

export function validateSchemaVersion(
  version: unknown,
  recordPath: string = "schemaVersion"
): DossierSchemaVersion {
  if (
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    throw new DossierError(`${recordPath} must be a positive integer`);
  }
  if (version > DOSSIER_SCHEMA_VERSION) {
    throw new DossierError(
      `${recordPath} ${version} is newer than this Dossier version (${DOSSIER_SCHEMA_VERSION}); upgrade the reader or downgrade the file`
    );
  }
  return version as DossierSchemaVersion;
}

// CD-3: Build-variant identification.
//
// A BuildVariant has an optional user-supplied label plus a deterministic
// fingerprint derived from the distinguishing inputs. Two variants with the
// same fingerprint are considered the same variant.
//
// The fingerprint is stable across runs and across platforms: it depends only
// on the canonicalised input object, not on hashing order or platform endianness.

export interface BuildVariant {
  label?: string;
  fingerprint: string;
  extensions?: ExtensionsRecord;
}

export interface VariantFingerprintInputs {
  targetTriple?: string;
  standard?: string;
  optimization?: string;
  defines: ReadonlyArray<{ name: string; value?: string }>;
  debugFlags: ReadonlyArray<string>;
}

export function computeVariantFingerprint(
  inputs: VariantFingerprintInputs
): string {
  const canonical = {
    debugFlags: [...inputs.debugFlags].sort(),
    defines: [...inputs.defines]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => ({ name: d.name, value: d.value ?? null })),
    optimization: inputs.optimization ?? "",
    standard: inputs.standard ?? "",
    targetTriple: inputs.targetTriple ?? ""
  };
  const hash = createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("hex");
  return `variant-${hash.slice(0, 12)}`;
}

export function makeBuildVariant(
  inputs: VariantFingerprintInputs,
  label?: string
): BuildVariant {
  const fingerprint = computeVariantFingerprint(inputs);
  return label === undefined ? { fingerprint } : { label, fingerprint };
}
