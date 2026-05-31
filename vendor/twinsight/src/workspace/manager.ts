import { copyFileSync, cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import type { FixtureRecord } from "../fixtures/types.js";
import type { RunWorkspace, WorkspacePolicy } from "./types.js";

function ensureDirectory(pathname: string): void {
  mkdirSync(pathname, { recursive: true });
}

function createRunId(fixtureId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${fixtureId}-${randomSuffix}`;
}

function copyFixtureFiles(targetDir: string, fixture: FixtureRecord): void {
  for (const source of fixture.sourceFiles) {
    const destination = join(targetDir, source.relativePath);
    ensureDirectory(dirname(destination));
    copyFileSync(source.absolutePath, destination);
  }

  if (fixture.assetsDir) {
    cpSync(fixture.assetsDir, join(targetDir, basename(fixture.assetsDir)), { recursive: true });
  }
}

export function createRunWorkspace(resultsDir: string, fixture: FixtureRecord): RunWorkspace {
  const root = resolve(resultsDir);
  ensureDirectory(root);

  const runId = createRunId(fixture.id);
  const workspaceRoot = join(root, runId);
  const fixtureDir = join(workspaceRoot, "fixture");
  const artifactsDir = join(workspaceRoot, "artifacts");
  const baselineArtifactsDir = join(artifactsDir, "baseline");
  const translatedArtifactsDir = join(artifactsDir, "translated");
  const browserArtifactsDir = join(artifactsDir, "browser");
  const metadataPath = join(workspaceRoot, "resolved-fixture.json");

  ensureDirectory(fixtureDir);
  ensureDirectory(baselineArtifactsDir);
  ensureDirectory(translatedArtifactsDir);
  ensureDirectory(browserArtifactsDir);
  copyFixtureFiles(fixtureDir, fixture);

  writeFileSync(
    metadataPath,
    JSON.stringify(
      {
        id: fixture.id,
        language: fixture.language,
        category: fixture.category,
        tags: fixture.tags,
        suite: fixture.suite,
        comparisonMode: fixture.comparisonMode,
        timeoutMs: fixture.timeoutMs,
        env: fixture.env,
        baselineCommand: fixture.baselineCommand,
        translatedCommand: fixture.translatedCommand,
        sourceFiles: fixture.sourceFiles.map((file) => file.relativePath),
        generatedFileGlobs: fixture.generatedFileGlobs,
        outputFiles: fixture.outputFiles
      },
      null,
      2
    ),
    "utf8"
  );

  return {
    runId,
    rootDir: workspaceRoot,
    fixtureDir,
    artifactsDir,
    baselineArtifactsDir,
    translatedArtifactsDir,
    browserArtifactsDir,
    metadataPath,
    fixture
  };
}

export function pruneWorkspaces(resultsDir: string, policy: WorkspacePolicy = {}): void {
  const root = resolve(resultsDir);
  const keepRuns = policy.keepRuns ?? Number.POSITIVE_INFINITY;

  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        fullPath: join(root, entry.name),
        mtimeMs: statSync(join(root, entry.name)).mtimeMs
      }))
      .sort((left, right) => right.mtimeMs - left.mtimeMs);
  } catch {
    return;
  }

  for (const entry of entries.slice(keepRuns)) {
    rmSync(entry.fullPath, { recursive: true, force: true });
  }
}
