// AC-6: Semantic construct vocabulary.
//
// Rules (binding): two-tier system.
//   - Well-known kinds are language-agnostic and stable across versions
//     (new entries can be added but never renamed or removed without a
//     schemaVersion bump)
//   - User-defined kinds are namespaced as `<namespace>/<kind>` with the
//     same naming convention as AC-14 extension keys

export const WELL_KNOWN_CONSTRUCT_KINDS = [
  "function",
  "statement",
  "expression",
  "declaration",
  "block",
  "comment",
  "directive",
  "region"
] as const;

export type WellKnownConstructKind = (typeof WELL_KNOWN_CONSTRUCT_KINDS)[number];

// A namespaced kind matches `<org>/<kind>` (lowercase alphanumerics,
// hyphens, dots, underscores).
const NAMESPACED_KIND_PATTERN = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*$/;

export type ConstructKind = WellKnownConstructKind | string;

export function isWellKnownConstructKind(kind: string): kind is WellKnownConstructKind {
  return (WELL_KNOWN_CONSTRUCT_KINDS as readonly string[]).includes(kind);
}

export function isNamespacedConstructKind(kind: string): boolean {
  return NAMESPACED_KIND_PATTERN.test(kind);
}

export function isValidConstructKind(kind: string): boolean {
  return isWellKnownConstructKind(kind) || isNamespacedConstructKind(kind);
}
