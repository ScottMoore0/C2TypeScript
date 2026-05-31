import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { AnchorError } from "../errors.js";
import { canonicalizePath } from "../canonical/paths.js";

// AC-8: Source location staleness.
//
// Rules (binding):
//   - `path` is required, canonicalised per AC-11
//   - `contentHash` is optional, format "sha256-<16hex>"
//   - `size` is optional, bytes
//   - No inline source content in v0.1.0
//   - Staleness check: if hash is present, re-hash file on disk and compare

export interface SourceFile {
  path: string;
  contentHash?: string;
  size?: number;
}

export type StalenessStatus = "fresh" | "stale" | "unknown" | "missing";

export function makeSourceFile(
  rawPath: string,
  contentHash?: string,
  size?: number
): SourceFile {
  const path = canonicalizePath(rawPath);
  if (path.length === 0) {
    throw new AnchorError("SourceFile path must not be empty");
  }
  const file: SourceFile = { path };
  if (contentHash !== undefined) {
    file.contentHash = contentHash;
  }
  if (size !== undefined) {
    file.size = size;
  }
  return file;
}

export function computeContentHash(content: string): string {
  const normalised = content.replace(/\r\n?/g, "\n");
  const hash = createHash("sha256").update(normalised, "utf8").digest("hex");
  return `sha256-${hash.slice(0, 16)}`;
}

export function checkStaleness(file: SourceFile): StalenessStatus {
  if (file.contentHash === undefined) {
    return "unknown";
  }
  let content: string;
  try {
    content = readFileSync(file.path, "utf8");
  } catch {
    return "missing";
  }
  const currentHash = computeContentHash(content);
  return currentHash === file.contentHash ? "fresh" : "stale";
}
