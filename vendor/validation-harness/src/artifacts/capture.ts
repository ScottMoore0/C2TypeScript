import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import type { ArtifactConfig } from "../config/types.js";
import type { RunWorkspace } from "../workspace/types.js";
import type { ArtifactKind, ArtifactRecord } from "./types.js";

function ensureDirectory(pathname: string): void {
  mkdirSync(pathname, { recursive: true });
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

function writeArtifactFile(
  targetDir: string,
  filename: string,
  contents: string,
  kind: ArtifactKind,
  label: string
): ArtifactRecord {
  ensureDirectory(targetDir);
  const absolutePath = join(targetDir, filename);
  writeFileSync(absolutePath, contents, "utf8");
  return {
    kind,
    label,
    absolutePath,
    relativePath: toPosixPath(relative(resolve(targetDir, "..", ".."), absolutePath))
  };
}

function collectFiles(rootDir: string): string[] {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = escaped.replace(/\*/g, ".*");
  return new RegExp(`^${regex}$`);
}

function shouldRetainArtifacts(retention: ArtifactConfig["retention"], ok: boolean): boolean {
  if (retention === "none") {
    return false;
  }
  if (retention === "failures-only") {
    return !ok;
  }
  return true;
}

export function captureTextArtifact(options: {
  targetDir: string;
  filename: string;
  contents: string;
  kind: ArtifactKind;
  label: string;
  retention: ArtifactConfig["retention"];
  ok: boolean;
}): ArtifactRecord | undefined {
  if (!shouldRetainArtifacts(options.retention, options.ok)) {
    return undefined;
  }

  return writeArtifactFile(options.targetDir, options.filename, options.contents, options.kind, options.label);
}

export function captureGeneratedFiles(options: {
  workspace: RunWorkspace;
  targetDir: string;
  patterns: string[];
  retention: ArtifactConfig["retention"];
  ok: boolean;
}): ArtifactRecord[] {
  if (!shouldRetainArtifacts(options.retention, options.ok) || options.patterns.length === 0) {
    return [];
  }

  const matchers = options.patterns.map((pattern) => globToRegExp(toPosixPath(pattern)));
  const records: ArtifactRecord[] = [];

  for (const absolutePath of collectFiles(options.workspace.fixtureDir)) {
    const relativePath = toPosixPath(relative(options.workspace.fixtureDir, absolutePath));
    if (!matchers.some((matcher) => matcher.test(relativePath))) {
      continue;
    }

    const destination = join(options.targetDir, relativePath);
    ensureDirectory(dirname(destination));
    copyFileSync(absolutePath, destination);
    records.push({
      kind: "generated-file",
      label: relativePath,
      absolutePath: destination,
      relativePath: toPosixPath(relative(options.workspace.rootDir, destination))
    });
  }

  return records;
}

export function captureNamedOutputFiles(options: {
  workspace: RunWorkspace;
  targetDir: string;
  filePaths: string[];
  retention: ArtifactConfig["retention"];
  ok: boolean;
}): ArtifactRecord[] {
  if (!shouldRetainArtifacts(options.retention, options.ok) || options.filePaths.length === 0) {
    return [];
  }

  const records: ArtifactRecord[] = [];

  for (const relativeName of options.filePaths) {
    const absolutePath = join(options.workspace.fixtureDir, relativeName);
    try {
      if (!statSync(absolutePath).isFile()) {
        continue;
      }
    } catch {
      continue;
    }

    const destination = join(options.targetDir, relativeName);
    ensureDirectory(dirname(destination));
    copyFileSync(absolutePath, destination);
    records.push({
      kind: "output-file",
      label: relativeName,
      absolutePath: destination,
      relativePath: toPosixPath(relative(options.workspace.rootDir, destination))
    });
  }

  return records;
}
