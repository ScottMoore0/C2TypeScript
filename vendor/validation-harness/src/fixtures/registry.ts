import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

import type { FixtureConfig, SuiteConfig } from "../config/types.js";
import { ConfigValidationError } from "../config/validation.js";
import { FixtureValidationError } from "./errors.js";
import type {
  FixtureDiscoveryOptions,
  FixtureMetadata,
  FixtureRecord,
  FixtureSelection,
  FixtureSourceFile,
  SuiteRecord
} from "./types.js";

const SOURCE_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cxx",
  ".h",
  ".hpp",
  ".hh",
  ".hxx",
  ".lua"
]);

function isSourceFile(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  for (const extension of SOURCE_EXTENSIONS) {
    if (lower.endsWith(extension)) {
      return true;
    }
  }
  return false;
}

function statExists(pathname: string): boolean {
  try {
    statSync(pathname);
    return true;
  } catch {
    return false;
  }
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

function normalizeId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function listSourceFiles(rootDir: string): FixtureSourceFile[] {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const discovered: FixtureSourceFile[] = [];

  for (const entry of entries) {
    if (entry.name === "assets") {
      continue;
    }

    const absolutePath = resolve(rootDir, entry.name);
    if (entry.isDirectory()) {
      for (const nested of listSourceFiles(absolutePath)) {
        discovered.push({
          relativePath: toPosixPath(`${entry.name}/${nested.relativePath}`),
          absolutePath: nested.absolutePath
        });
      }
      continue;
    }

    if (entry.isFile() && isSourceFile(entry.name)) {
      discovered.push({
        relativePath: toPosixPath(entry.name),
        absolutePath
      });
    }
  }

  return discovered.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function readMetadataFile(metadataPath: string): FixtureMetadata {
  try {
    const raw = readFileSync(metadataPath, "utf8");
    const parsed = JSON.parse(raw) as FixtureMetadata;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new FixtureValidationError(`Fixture metadata must be an object: ${metadataPath}`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof FixtureValidationError) {
      throw error;
    }
    throw new FixtureValidationError(`Unable to parse fixture metadata: ${metadataPath}`);
  }
}

function parseTags(value: string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return [...new Set(value.map((tag) => tag.trim()).filter(Boolean))].sort();
}

function resolveSuiteRecord(config: SuiteConfig): SuiteRecord {
  return {
    name: config.name,
    fixtureIds: [...(config.fixtureIds ?? [])].sort(),
    fixtureGlobs: [...(config.fixtureGlobs ?? [])].sort(),
    tags: parseTags(config.tags),
    config
  };
}

function deriveLanguage(config: FixtureConfig, metadata: FixtureMetadata, sources: FixtureSourceFile[]): string {
  const explicit = config.language ?? metadata.language;
  if (explicit) {
    return explicit;
  }

  const first = sources[0]?.relativePath.toLowerCase() ?? "";
  if (first.endsWith(".lua")) {
    return "lua";
  }
  if (first.endsWith(".cpp") || first.endsWith(".cc") || first.endsWith(".cxx") || first.endsWith(".hpp")) {
    return "cpp";
  }
  return "c";
}

function buildFixtureRecord(fixturesDir: string, config: FixtureConfig, comparisonMode: string): FixtureRecord {
  if (!config.path) {
    throw new ConfigValidationError("Fixture config is missing required path");
  }

  const rootDir = resolve(fixturesDir, config.path);
  const metadataPath = config.metadataFile
    ? resolve(rootDir, config.metadataFile)
    : resolve(rootDir, "fixture.json");
  const metadata = statExists(metadataPath) ? readMetadataFile(metadataPath) : {};
  const sources = listSourceFiles(rootDir);

  if (sources.length === 0) {
    throw new FixtureValidationError(`Fixture has no source files: ${rootDir}`);
  }

  const relativeRoot = toPosixPath(relative(fixturesDir, rootDir));
  const id = normalizeId(config.id ?? metadata.id ?? relativeRoot);
  if (!id) {
    throw new FixtureValidationError(`Fixture ID is empty after normalization: ${rootDir}`);
  }

  const expectedOutputCandidate = config.expectedOutputFile
    ? resolve(rootDir, config.expectedOutputFile)
    : resolve(rootDir, "expected.stdout");
  const assetsCandidate = config.assetsDir ? resolve(rootDir, config.assetsDir) : resolve(rootDir, "assets");

  return {
    id,
    description: config.description ?? metadata.description,
    language: deriveLanguage(config, metadata, sources),
    category: config.category ?? metadata.category,
    tags: parseTags([...(metadata.tags ?? []), ...(config.tags ?? [])]),
    suite: config.suite ?? metadata.suite,
    rootDir,
    sourceFiles: sources,
    expectedOutputFile: statExists(expectedOutputCandidate) ? expectedOutputCandidate : undefined,
    metadataFile: statExists(metadataPath) ? metadataPath : undefined,
    assetsDir: statExists(assetsCandidate) ? assetsCandidate : undefined,
    comparisonMode: (config.comparisonMode ?? metadata.comparisonMode ?? comparisonMode) as FixtureRecord["comparisonMode"],
    timeoutMs: config.timeoutMs ?? metadata.timeoutMs,
    env: { ...(metadata.env ?? {}), ...(config.env ?? {}) },
    baselineCommand: config.baselineCommand ?? metadata.baselineCommand,
    translatedCommand: config.translatedCommand ?? metadata.translatedCommand,
    browserExecutionMode: config.browserExecutionMode ?? metadata.browserExecutionMode,
    browserTimeoutMs: config.browserTimeoutMs ?? metadata.browserTimeoutMs,
    generatedFileGlobs: parseTags([...(metadata.generatedFileGlobs ?? []), ...(config.generatedFileGlobs ?? [])]),
    outputFiles: parseTags([...(metadata.outputFiles ?? []), ...(config.outputFiles ?? [])]),
    numericTolerance: config.numericTolerance ?? metadata.numericTolerance,
    regexPattern: config.regexPattern ?? metadata.regexPattern,
    expectedFailureTarget: config.expectedFailureTarget ?? metadata.expectedFailureTarget ?? "translated",
    expectedRejectStage: config.expectedRejectStage ?? metadata.expectedRejectStage,
    config
  };
}

function discoverFixtureConfigs(fixturesDir: string, configuredFixtures: FixtureConfig[]): FixtureConfig[] {
  if (configuredFixtures.length > 0) {
    return configuredFixtures;
  }

  return readdirSync(fixturesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ path: entry.name }))
    .sort((left, right) => (left.path ?? "").localeCompare(right.path ?? ""));
}

export function discoverFixtures(options: FixtureDiscoveryOptions): FixtureRecord[] {
  const fixturesDir = resolve(options.fixturesDir);
  const discovered = discoverFixtureConfigs(fixturesDir, options.fixtures ?? [])
    .map((fixture) => buildFixtureRecord(fixturesDir, fixture, options.comparisonMode))
    .sort((left, right) => left.id.localeCompare(right.id));

  const seen = new Set<string>();
  for (const fixture of discovered) {
    if (seen.has(fixture.id)) {
      throw new FixtureValidationError(`Duplicate fixture ID discovered: ${fixture.id}`);
    }
    seen.add(fixture.id);
  }

  return discovered;
}

export function discoverSuites(suites: SuiteConfig[] = []): SuiteRecord[] {
  return suites.map(resolveSuiteRecord).sort((left, right) => left.name.localeCompare(right.name));
}

export function filterFixtures(fixtures: FixtureRecord[], selection: FixtureSelection = {}): FixtureRecord[] {
  const ids = selection.ids && selection.ids.length > 0
    ? new Set(selection.ids.map((value) => normalizeId(value)))
    : undefined;
  const tags = selection.tags && selection.tags.length > 0
    ? new Set(selection.tags.map((value) => value.trim()).filter(Boolean))
    : undefined;
  const suites = selection.suites && selection.suites.length > 0
    ? new Set(selection.suites.map((value) => value.trim()).filter(Boolean))
    : undefined;
  const languages = selection.languages && selection.languages.length > 0
    ? new Set(selection.languages.map((value) => value.trim().toLowerCase()).filter(Boolean))
    : undefined;

  return fixtures.filter((fixture) => {
    if (ids && !ids.has(fixture.id)) {
      return false;
    }
    if (tags && !fixture.tags.some((tag) => tags.has(tag))) {
      return false;
    }
    if (suites && (!fixture.suite || !suites.has(fixture.suite))) {
      return false;
    }
    if (languages && !languages.has(fixture.language.toLowerCase())) {
      return false;
    }
    return true;
  });
}

export function normalizeFixtureId(raw: string): string {
  return normalizeId(raw);
}
