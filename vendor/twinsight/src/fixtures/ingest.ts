import { readFileSync, statSync } from "node:fs";

import type { ComparisonMode, FixtureConfig } from "../config/types.js";
import { FixtureValidationError } from "./errors.js";
import { discoverFixtures } from "./registry.js";
import type { FixtureMetadata, FixtureRecord, IngestedFixture } from "./types.js";

function statExists(pathname: string): boolean {
  try {
    statSync(pathname);
    return true;
  } catch {
    return false;
  }
}

function isDirectory(pathname: string): boolean {
  try {
    return statSync(pathname).isDirectory();
  } catch {
    return false;
  }
}

function readMetadata(pathname?: string): FixtureMetadata {
  if (!pathname) {
    return {};
  }

  try {
    const raw = readFileSync(pathname, "utf8");
    const parsed = JSON.parse(raw) as FixtureMetadata;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new FixtureValidationError(`Fixture metadata must be an object: ${pathname}`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof FixtureValidationError) {
      throw error;
    }
    throw new FixtureValidationError(`Unable to parse fixture metadata: ${pathname}`);
  }
}

function validateEnv(env: Record<string, string>, rootDir: string): void {
  for (const [key, value] of Object.entries(env)) {
    if (!key.trim()) {
      throw new FixtureValidationError(`Fixture environment contains empty key: ${rootDir}`);
    }
    if (typeof value !== "string") {
      throw new FixtureValidationError(`Fixture environment value must be a string: ${rootDir}`);
    }
  }
}

function validateFixtureRecord(fixture: FixtureRecord): void {
  if (!isDirectory(fixture.rootDir)) {
    throw new FixtureValidationError(`Fixture directory does not exist: ${fixture.rootDir}`);
  }
  if (fixture.sourceFiles.length === 0) {
    throw new FixtureValidationError(`Fixture has no source files: ${fixture.rootDir}`);
  }
  for (const source of fixture.sourceFiles) {
    if (!statExists(source.absolutePath)) {
      throw new FixtureValidationError(`Fixture source file is missing: ${source.absolutePath}`);
    }
  }
  if (fixture.expectedOutputFile && !statExists(fixture.expectedOutputFile)) {
    throw new FixtureValidationError(`Expected output file is missing: ${fixture.expectedOutputFile}`);
  }
  if (fixture.assetsDir && !isDirectory(fixture.assetsDir)) {
    throw new FixtureValidationError(`Assets directory is missing: ${fixture.assetsDir}`);
  }
  if (fixture.timeoutMs !== undefined && fixture.timeoutMs <= 0) {
    throw new FixtureValidationError(`Fixture timeout must be positive: ${fixture.rootDir}`);
  }
  if (fixture.numericTolerance !== undefined && fixture.numericTolerance < 0) {
    throw new FixtureValidationError(`Fixture numeric tolerance must be non-negative: ${fixture.rootDir}`);
  }
  validateEnv(fixture.env, fixture.rootDir);
}

export function ingestFixture(fixture: FixtureRecord): IngestedFixture {
  validateFixtureRecord(fixture);
  return {
    fixture,
    metadata: readMetadata(fixture.metadataFile),
    sourceFiles: fixture.sourceFiles,
    expectedOutputFile: fixture.expectedOutputFile,
    assetsDir: fixture.assetsDir
  };
}

export function ingestFixtures(options: {
  fixturesDir: string;
  comparisonMode: ComparisonMode;
  fixtures?: FixtureConfig[];
}): IngestedFixture[] {
  const discovered = discoverFixtures({
    fixturesDir: options.fixturesDir,
    comparisonMode: options.comparisonMode,
    fixtures: options.fixtures
  });

  return discovered.map((fixture) => ingestFixture(fixture));
}
