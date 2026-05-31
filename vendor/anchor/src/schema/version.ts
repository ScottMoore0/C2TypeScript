import { AnchorError } from "../errors.js";

// AC-10 (= Dossier CD-2): Schema versioning.
//
// Rules (binding, inherited from Dossier):
//   - `schemaVersion` is a single integer, starting at 1
//   - Additive fields never bump the version
//   - Breaking changes bump the integer
//   - Loaders fail-fast on unknown future versions

export const ANCHOR_SCHEMA_VERSION = 1 as const;
export type AnchorSchemaVersion = typeof ANCHOR_SCHEMA_VERSION;

export function validateSchemaVersion(
  version: unknown,
  recordPath: string = "schemaVersion"
): AnchorSchemaVersion {
  if (
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    throw new AnchorError(`${recordPath} must be a positive integer`);
  }
  if (version > ANCHOR_SCHEMA_VERSION) {
    throw new AnchorError(
      `${recordPath} ${version} is newer than this Anchor version (${ANCHOR_SCHEMA_VERSION}); upgrade the reader or downgrade the file`
    );
  }
  return version as AnchorSchemaVersion;
}
