import { AnchorError } from "../errors.js";

// AC-14 (= Dossier CD-14): Schema extension mechanism.
//
// Every structured record in Anchor's schema MAY carry an optional
// `extensions` field of type ExtensionsRecord. Keys must match the pattern
// `<org>/<tool>` (lowercase alphanumerics with hyphens; one slash separator)
// so that downstream projects can annotate Anchor records without colliding
// with each other.
//
// The validator strictly rejects extension keys that don't follow the
// namespace convention, but it never inspects the values - downstream projects
// own their own data entirely.
//
// Inherited from Dossier CD-14 verbatim, with the type vendored rather than
// imported to keep the package standalone.

export type ExtensionsRecord = Record<string, unknown>;

// Pattern: lowercase alphanumerics + hyphens in the org segment, plus dots and
// hyphens allowed in the tool segment. Exactly one slash separator.
const EXTENSION_KEY_PATTERN = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9.-]*$/;

export function isValidExtensionKey(key: string): boolean {
  return EXTENSION_KEY_PATTERN.test(key);
}

export function validateExtensions(
  extensions: unknown,
  recordPath: string
): ExtensionsRecord | undefined {
  if (extensions === undefined) {
    return undefined;
  }
  if (typeof extensions !== "object" || extensions === null || Array.isArray(extensions)) {
    throw new AnchorError(
      `${recordPath}.extensions must be an object when provided`
    );
  }
  const obj = extensions as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!isValidExtensionKey(key)) {
      throw new AnchorError(
        `${recordPath}.extensions key '${key}' must match pattern 'org/tool' (lowercase alphanumerics with hyphens, single slash separator)`
      );
    }
  }
  return obj;
}
