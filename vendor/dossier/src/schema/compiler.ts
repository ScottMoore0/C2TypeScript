import { createHash } from "node:crypto";

import { DossierError } from "../errors.js";
import type { ExtensionsRecord } from "./extensions.js";

// CD-4: Compiler identity fingerprinting.
//
// A CompilerIdentity is uniquely determined by its vendor, semantic version,
// target triple, and the SHA-256 of its full predefined-macro set (from
// `cc -dM -E -x c /dev/null`). Cross-compile environments with different
// predefined macros hash differently even at the same version string, which
// is essential for correctly identifying "the compiler that actually built
// this code" rather than "a compiler that happens to share the version
// number".
//
// The binary path is deliberately excluded from the fingerprint: the same
// compiler at different paths should hash identically.

export type CompilerVendor = "gcc" | "clang" | "msvc" | "unknown";

export interface CompilerIdentity {
  vendor: CompilerVendor;
  version: string;
  targetTriple: string;
  predefinedMacroHash: string;
  fingerprint: string;
  extensions?: ExtensionsRecord;
}

export interface CompilerIdentityInputs {
  vendor: CompilerVendor;
  version: string;
  targetTriple: string;
  predefinedMacros: Readonly<Record<string, string>>;
}

function hashPredefinedMacros(
  macros: Readonly<Record<string, string>>
): string {
  const sortedEntries = Object.keys(macros)
    .sort()
    .map((name) => [name, macros[name]] as const);
  return createHash("sha256")
    .update(JSON.stringify(sortedEntries))
    .digest("hex");
}

export function computeCompilerFingerprint(
  inputs: CompilerIdentityInputs
): { predefinedMacroHash: string; fingerprint: string } {
  const predefinedMacroHash = hashPredefinedMacros(inputs.predefinedMacros);
  const canonical = {
    predefinedMacroHash,
    targetTriple: inputs.targetTriple,
    vendor: inputs.vendor,
    version: inputs.version
  };
  const full = createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("hex");
  return {
    predefinedMacroHash,
    fingerprint: `compiler-${full.slice(0, 12)}`
  };
}

export function makeCompilerIdentity(
  inputs: CompilerIdentityInputs
): CompilerIdentity {
  const { predefinedMacroHash, fingerprint } =
    computeCompilerFingerprint(inputs);
  return {
    vendor: inputs.vendor,
    version: inputs.version,
    targetTriple: inputs.targetTriple,
    predefinedMacroHash,
    fingerprint
  };
}

// CD-7: Target platform detection.
//
// The TargetPlatform is observed from compiler introspection (the
// compiler's own predefined macros), not inferred from the `-target` flag.
// If the user-supplied target flag disagrees with the compiler's observed
// answer, a `target-triple-mismatch` diagnostic is emitted (see CD-13) but
// the compiler's observation is still used as the source of truth.

export type Endianness = "little" | "big";
export type PointerSize = 32 | 64;

export interface TargetPlatform {
  arch: string; // e.g. "x86_64", "aarch64"
  os: string; // e.g. "linux", "darwin", "windows"
  abi?: string; // e.g. "gnu", "musl", "msvc"
  pointerSize: PointerSize;
  endianness: Endianness;
  extensions?: ExtensionsRecord;
}

export function validateTargetPlatform(
  platform: unknown,
  recordPath: string
): TargetPlatform {
  if (
    typeof platform !== "object" ||
    platform === null ||
    Array.isArray(platform)
  ) {
    throw new DossierError(`${recordPath} must be an object`);
  }
  const obj = platform as Record<string, unknown>;

  if (typeof obj.arch !== "string" || obj.arch.length === 0) {
    throw new DossierError(`${recordPath}.arch must be a non-empty string`);
  }
  if (typeof obj.os !== "string" || obj.os.length === 0) {
    throw new DossierError(`${recordPath}.os must be a non-empty string`);
  }
  if (obj.abi !== undefined && typeof obj.abi !== "string") {
    throw new DossierError(`${recordPath}.abi must be a string when provided`);
  }
  if (obj.pointerSize !== 32 && obj.pointerSize !== 64) {
    throw new DossierError(`${recordPath}.pointerSize must be 32 or 64`);
  }
  if (obj.endianness !== "little" && obj.endianness !== "big") {
    throw new DossierError(
      `${recordPath}.endianness must be 'little' or 'big'`
    );
  }

  return {
    arch: obj.arch,
    os: obj.os,
    abi: obj.abi as string | undefined,
    pointerSize: obj.pointerSize as PointerSize,
    endianness: obj.endianness as Endianness
  };
}
