// CD-10: Adapter priority order for build-system detection.
//
// Rule (binding): first match wins, in this order.
//   1. `--compile-db <path>` explicit override (always wins when given)
//   2. Existing `compile_commands.json` found at a known location
//      (project root, build/, cmake-build-debug/, out/, build/Debug/)
//   3. CMake adapter (runs cmake -B ... -DCMAKE_EXPORT_COMPILE_COMMANDS=ON)
//   4. Deferred to v1.0: Bazel, Meson, Autotools, Bear-wrapped Makefile
//
// The BuildContext envelope records which adapter ran so users can see which
// path was taken. A `--force-regenerate` flag skips the existing-database
// cache and always re-runs the adapter.

export type AdapterId =
  | "user-compile-db"
  | "existing-compile-commands"
  | "cmake";

export type DeferredAdapterId =
  | "bazel"
  | "meson"
  | "autotools"
  | "bear-makefile";

export const ADAPTER_PRIORITY_ORDER: readonly AdapterId[] = [
  "user-compile-db",
  "existing-compile-commands",
  "cmake"
] as const;

export const DEFERRED_ADAPTERS: readonly DeferredAdapterId[] = [
  "bazel",
  "meson",
  "autotools",
  "bear-makefile"
] as const;

export const COMPILE_DB_SEARCH_LOCATIONS: readonly string[] = [
  "compile_commands.json",
  "build/compile_commands.json",
  "build/Debug/compile_commands.json",
  "build/Release/compile_commands.json",
  "cmake-build-debug/compile_commands.json",
  "cmake-build-release/compile_commands.json",
  "out/compile_commands.json",
  "out/Default/compile_commands.json"
] as const;

export function isKnownAdapter(id: string): id is AdapterId {
  return (ADAPTER_PRIORITY_ORDER as readonly string[]).includes(id);
}

export function isDeferredAdapter(id: string): id is DeferredAdapterId {
  return (DEFERRED_ADAPTERS as readonly string[]).includes(id);
}
