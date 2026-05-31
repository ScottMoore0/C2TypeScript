import type { BrowserExecutionMode } from "../browser/types.js";

export type ComparisonMode =
  | "exact-text"
  | "normalized-text"
  | "exit-code"
  | "expect-failure"
  | "expected-reject"
  | "numeric-tolerance"
  | "line-wise"
  | "unordered-line"
  | "file-content"
  | "regex";

export type RejectStage = "parse" | "translate" | "pre-run";

export interface ArtifactConfig {
  retention: "all" | "failures-only" | "none";
  rootDir?: string;
}

export interface RunnerConfig {
  baselineCommand?: string;
  translatedCommand?: string;
  shell: boolean;
  cwd?: string;
  timeoutMs: number;
  concurrency: number;
  env: Record<string, string>;
}

export interface RegressionConfig {
  durationThresholdRatio: number;
  durationThresholdAbsoluteMs?: number;
}

export interface BrowserConfig {
  launcherModule?: string;
  launcherExport?: string;
}

export interface FixtureConfig {
  id?: string;
  description?: string;
  language?: string;
  category?: string;
  tags?: string[];
  suite?: string;
  path?: string;
  expectedOutputFile?: string;
  metadataFile?: string;
  assetsDir?: string;
  comparisonMode?: ComparisonMode;
  timeoutMs?: number;
  env?: Record<string, string>;
  baselineCommand?: string;
  translatedCommand?: string;
  generatedFileGlobs?: string[];
  outputFiles?: string[];
  numericTolerance?: number;
  regexPattern?: string;
  expectedFailureTarget?: "baseline" | "translated";
  expectedRejectStage?: RejectStage;
  browserExecutionMode?: BrowserExecutionMode;
  browserTimeoutMs?: number;
}

export interface SuiteConfig {
  name: string;
  fixtureGlobs?: string[];
  fixtureIds?: string[];
  tags?: string[];
}

export interface CorpusConfig {
  name: string;
  description?: string;
  fixtureIds?: string[];
  tags?: string[];
  languages?: string[];
  projects?: string[];
}

export interface ValidationHarnessConfig {
  fixturesDir: string;
  resultsDir: string;
  runners: RunnerConfig;
  artifacts: ArtifactConfig;
  regressions: RegressionConfig;
  comparisonMode: ComparisonMode;
  fixtures: FixtureConfig[];
  suites: SuiteConfig[];
  corpora: CorpusConfig[];
  browser?: BrowserConfig;
}

export interface ValidationHarnessConfigInput {
  fixturesDir?: string;
  resultsDir?: string;
  runners?: Partial<RunnerConfig>;
  artifacts?: Partial<ArtifactConfig>;
  regressions?: Partial<RegressionConfig>;
  comparisonMode?: ComparisonMode;
  fixtures?: FixtureConfig[];
  suites?: SuiteConfig[];
  corpora?: CorpusConfig[];
  browser?: BrowserConfig;
}

export interface ConfigLoadResult {
  path: string;
  config: ValidationHarnessConfig;
}
