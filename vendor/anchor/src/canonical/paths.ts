import { resolve as nodeResolve } from "node:path";

// AC-11 (= Dossier CD-1): Path canonicalization policy.
//
// Rules (binding, inherited from Dossier):
//   - Always forward-slash separators, even on Windows
//   - Drive letter uppercase: "C:/...", not "c:/..."
//   - Case-preserving, case-sensitive comparison
//   - No trailing slash except on root paths ("/" or "C:/")
//   - Symlinks are NOT resolved - we preserve what the caller gave us
//
// canonicalizePath() does in-place normalisation (no filesystem access, no
// absolute-path conversion).
//
// canonicalizeRelativeTo() resolves a relative path against a base directory
// using Node's platform-aware path.resolve, then applies canonicalizePath
// to the result.
//
// This file is vendored from Dossier rather than imported, because Anchor
// is a fully independent subproject and must have no runtime dependency on
// other c2typescript subprojects.

export function canonicalizePath(input: string): string {
  if (input.length === 0) {
    return input;
  }

  const forwardSlashed = input.replace(/\\/g, "/");

  const driveUppered = forwardSlashed.replace(
    /^([a-z]):/i,
    (_, letter: string) => `${letter.toUpperCase()}:`
  );

  const isUnc = driveUppered.startsWith("//");
  const collapsed = isUnc
    ? "//" + driveUppered.slice(2).replace(/\/{2,}/g, "/")
    : driveUppered.replace(/\/{2,}/g, "/");

  if (collapsed.length <= 1) {
    return collapsed;
  }
  if (/^[A-Z]:\/$/.test(collapsed)) {
    return collapsed;
  }
  if (collapsed === "/") {
    return collapsed;
  }
  return collapsed.endsWith("/") ? collapsed.replace(/\/+$/, "") : collapsed;
}

export function canonicalizeRelativeTo(base: string, relative: string): string {
  const resolved = nodeResolve(base, relative);
  return canonicalizePath(resolved);
}

export function isAbsolutePath(path: string): boolean {
  if (path.length === 0) return false;
  if (path.startsWith("/")) return true;
  if (/^[A-Za-z]:[\\/]/.test(path)) return true;
  return false;
}
