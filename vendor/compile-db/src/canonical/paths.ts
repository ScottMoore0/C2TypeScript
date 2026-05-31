import { resolve as nodeResolve } from "node:path";

// CD-1: Path canonicalization policy.
//
// Rules (binding):
//   - Always forward-slash separators, even on Windows
//   - Drive letter uppercase: "C:/...", not "c:/..."
//   - Case-preserving, case-sensitive comparison (two paths differing only
//     in case are treated as distinct)
//   - No trailing slash except on root paths ("/" or "C:/")
//   - Symlinks are NOT resolved - we preserve what the caller gave us
//
// canonicalizePath() does in-place normalisation (no filesystem access, no
// absolute-path conversion).
//
// canonicalizeRelativeTo() resolves a relative path against a base directory
// using Node's platform-aware path.resolve, then applies canonicalizePath to
// the result. This is the function the compile_commands.json parser uses to
// turn `{file, directory}` pairs into canonical absolute paths.

export function canonicalizePath(input: string): string {
  if (input.length === 0) {
    return input;
  }

  // 1. Forward-slash every separator.
  const forwardSlashed = input.replace(/\\/g, "/");

  // 2. Uppercase the drive letter if present.
  const driveUppered = forwardSlashed.replace(
    /^([a-z]):/i,
    (_, letter: string) => `${letter.toUpperCase()}:`
  );

  // 3. Collapse runs of slashes (but keep UNC "//server/share" prefix intact).
  const isUnc = driveUppered.startsWith("//");
  const collapsed = isUnc
    ? "//" + driveUppered.slice(2).replace(/\/{2,}/g, "/")
    : driveUppered.replace(/\/{2,}/g, "/");

  // 4. Strip trailing slash unless the path is a root.
  if (collapsed.length <= 1) {
    return collapsed;
  }
  if (/^[A-Z]:\/$/.test(collapsed)) {
    // Windows drive root, e.g. "C:/"
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
  if (path.startsWith("/")) return true; // POSIX abs, also UNC "//"
  if (/^[A-Za-z]:[\\/]/.test(path)) return true; // Windows drive-qualified abs
  return false;
}
