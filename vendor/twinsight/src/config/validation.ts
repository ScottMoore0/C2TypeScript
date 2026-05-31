import type {
  ComparisonMode,
  CorpusConfig,
  FixtureConfig,
  RejectStage,
  RunnerConfig,
  SuiteConfig,
  ValidationHarnessConfig
} from "./types.js";

const COMPARISON_MODES = new Set<ComparisonMode>([
  "exact-text",
  "normalized-text",
  "exit-code",
  "expect-failure",
  "expected-reject",
  "numeric-tolerance",
  "line-wise",
  "unordered-line",
  "file-content",
  "regex"
]);

const REJECT_STAGES = new Set<RejectStage>(["parse", "translate", "pre-run"]);

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ConfigValidationError(`${field} must be a non-empty string`);
  }
}

function assertOptionalString(value: unknown, field: string): void {
  if (value !== undefined && (typeof value !== "string" || value.length === 0)) {
    throw new ConfigValidationError(`${field} must be a non-empty string when provided`);
  }
}

function assertStringArray(value: unknown, field: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== "string" || item.length === 0)) {
    throw new ConfigValidationError(`${field} must be an array of non-empty strings`);
  }
}

function assertEnvRecord(value: unknown, field: string): asserts value is Record<string, string> {
  if (!isRecord(value)) {
    throw new ConfigValidationError(`${field} must be an object of string values`);
  }

  for (const [key, item] of Object.entries(value)) {
    if (key.length === 0 || typeof item !== "string") {
      throw new ConfigValidationError(`${field} must only contain string keys and string values`);
    }
  }
}

function validateComparisonMode(value: unknown, field: string): void {
  if (value !== undefined && !COMPARISON_MODES.has(value as ComparisonMode)) {
    throw new ConfigValidationError(`${field} must be one of: ${[...COMPARISON_MODES].join(", ")}`);
  }
}

function validateRejectStage(value: unknown, field: string): void {
  if (value !== undefined && !REJECT_STAGES.has(value as RejectStage)) {
    throw new ConfigValidationError(`${field} must be one of: ${[...REJECT_STAGES].join(", ")}`);
  }
}

function validateRunnerConfig(runners: RunnerConfig): void {
  if (typeof runners.shell !== "boolean") {
    throw new ConfigValidationError("runners.shell must be a boolean");
  }

  if (!Number.isInteger(runners.timeoutMs) || runners.timeoutMs <= 0) {
    throw new ConfigValidationError("runners.timeoutMs must be a positive integer");
  }
  if (!Number.isInteger(runners.concurrency) || runners.concurrency <= 0) {
    throw new ConfigValidationError("runners.concurrency must be a positive integer");
  }

  assertEnvRecord(runners.env, "runners.env");
  assertOptionalString(runners.cwd, "runners.cwd");
  assertOptionalString(runners.baselineCommand, "runners.baselineCommand");
  assertOptionalString(runners.translatedCommand, "runners.translatedCommand");
}

function validateFixtureConfig(fixture: FixtureConfig, index: number): void {
  const prefix = `fixtures[${index}]`;
  assertOptionalString(fixture.id, `${prefix}.id`);
  assertOptionalString(fixture.description, `${prefix}.description`);
  assertOptionalString(fixture.language, `${prefix}.language`);
  assertOptionalString(fixture.category, `${prefix}.category`);
  assertOptionalString(fixture.suite, `${prefix}.suite`);
  assertOptionalString(fixture.path, `${prefix}.path`);
  assertOptionalString(fixture.expectedOutputFile, `${prefix}.expectedOutputFile`);
  assertOptionalString(fixture.metadataFile, `${prefix}.metadataFile`);
  assertOptionalString(fixture.assetsDir, `${prefix}.assetsDir`);
  assertOptionalString(fixture.baselineCommand, `${prefix}.baselineCommand`);
  assertOptionalString(fixture.translatedCommand, `${prefix}.translatedCommand`);
  validateComparisonMode(fixture.comparisonMode, `${prefix}.comparisonMode`);

  if (fixture.tags !== undefined) {
    assertStringArray(fixture.tags, `${prefix}.tags`);
  }

  if (fixture.timeoutMs !== undefined && (!Number.isInteger(fixture.timeoutMs) || fixture.timeoutMs <= 0)) {
    throw new ConfigValidationError(`${prefix}.timeoutMs must be a positive integer when provided`);
  }

  if (fixture.env !== undefined) {
    assertEnvRecord(fixture.env, `${prefix}.env`);
  }

  if (fixture.numericTolerance !== undefined && (typeof fixture.numericTolerance !== "number" || fixture.numericTolerance < 0)) {
    throw new ConfigValidationError(`${prefix}.numericTolerance must be a non-negative number when provided`);
  }

  assertOptionalString(fixture.regexPattern, `${prefix}.regexPattern`);
  validateRejectStage(fixture.expectedRejectStage, `${prefix}.expectedRejectStage`);
  if (
    fixture.expectedFailureTarget !== undefined &&
    fixture.expectedFailureTarget !== "baseline" &&
    fixture.expectedFailureTarget !== "translated"
  ) {
    throw new ConfigValidationError(`${prefix}.expectedFailureTarget must be either "baseline" or "translated" when provided`);
  }

  if (fixture.generatedFileGlobs !== undefined) {
    assertStringArray(fixture.generatedFileGlobs, `${prefix}.generatedFileGlobs`);
  }

  if (fixture.outputFiles !== undefined) {
    assertStringArray(fixture.outputFiles, `${prefix}.outputFiles`);
  }

  if (
    fixture.browserExecutionMode !== undefined &&
    fixture.browserExecutionMode !== "headless" &&
    fixture.browserExecutionMode !== "headed"
  ) {
    throw new ConfigValidationError(
      `${prefix}.browserExecutionMode must be either "headless" or "headed" when provided`
    );
  }

  if (
    fixture.browserTimeoutMs !== undefined &&
    (!Number.isInteger(fixture.browserTimeoutMs) || fixture.browserTimeoutMs <= 0)
  ) {
    throw new ConfigValidationError(
      `${prefix}.browserTimeoutMs must be a positive integer when provided`
    );
  }
}

function validateSuiteConfig(suite: SuiteConfig, index: number): void {
  const prefix = `suites[${index}]`;
  assertString(suite.name, `${prefix}.name`);

  if (suite.fixtureGlobs !== undefined) {
    assertStringArray(suite.fixtureGlobs, `${prefix}.fixtureGlobs`);
  }

  if (suite.fixtureIds !== undefined) {
    assertStringArray(suite.fixtureIds, `${prefix}.fixtureIds`);
  }

  if (suite.tags !== undefined) {
    assertStringArray(suite.tags, `${prefix}.tags`);
  }
}

function validateCorpusConfig(corpus: CorpusConfig, index: number): void {
  const prefix = `corpora[${index}]`;
  assertString(corpus.name, `${prefix}.name`);
  assertOptionalString(corpus.description, `${prefix}.description`);

  if (corpus.fixtureIds !== undefined) {
    assertStringArray(corpus.fixtureIds, `${prefix}.fixtureIds`);
  }

  if (corpus.tags !== undefined) {
    assertStringArray(corpus.tags, `${prefix}.tags`);
  }

  if (corpus.languages !== undefined) {
    assertStringArray(corpus.languages, `${prefix}.languages`);
  }

  if (corpus.projects !== undefined) {
    assertStringArray(corpus.projects, `${prefix}.projects`);
  }
}

export function validateConfig(config: ValidationHarnessConfig): ValidationHarnessConfig {
  assertString(config.fixturesDir, "fixturesDir");
  assertString(config.resultsDir, "resultsDir");
  validateComparisonMode(config.comparisonMode, "comparisonMode");
  validateRunnerConfig(config.runners);
  if (typeof config.regressions !== "object" || config.regressions === null) {
    throw new ConfigValidationError("regressions must be an object");
  }
  if (
    typeof config.regressions.durationThresholdRatio !== "number" ||
    config.regressions.durationThresholdRatio < 0
  ) {
    throw new ConfigValidationError("regressions.durationThresholdRatio must be a non-negative number");
  }
  if (config.regressions.durationThresholdAbsoluteMs !== undefined) {
    if (
      typeof config.regressions.durationThresholdAbsoluteMs !== "number" ||
      !Number.isFinite(config.regressions.durationThresholdAbsoluteMs) ||
      config.regressions.durationThresholdAbsoluteMs < 0
    ) {
      throw new ConfigValidationError(
        "regressions.durationThresholdAbsoluteMs must be a non-negative number when provided"
      );
    }
  }

  if (config.browser !== undefined) {
    if (typeof config.browser !== "object" || config.browser === null) {
      throw new ConfigValidationError("browser must be an object when provided");
    }
    assertOptionalString(config.browser.launcherModule, "browser.launcherModule");
    assertOptionalString(config.browser.launcherExport, "browser.launcherExport");
  }

  if (!Array.isArray(config.fixtures)) {
    throw new ConfigValidationError("fixtures must be an array");
  }

  if (!Array.isArray(config.suites)) {
    throw new ConfigValidationError("suites must be an array");
  }

  if (!Array.isArray(config.corpora)) {
    throw new ConfigValidationError("corpora must be an array");
  }

  config.fixtures.forEach((fixture, index) => validateFixtureConfig(fixture, index));
  config.suites.forEach((suite, index) => validateSuiteConfig(suite, index));
  config.corpora.forEach((corpus, index) => validateCorpusConfig(corpus, index));

  return config;
}
