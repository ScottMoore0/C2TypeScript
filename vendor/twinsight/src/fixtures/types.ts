import type { ComparisonMode, FixtureConfig, RejectStage, SuiteConfig } from "../config/types.js";
import type { BrowserExecutionMode } from "../browser/types.js";

export interface FixtureMetadata {
  id?: string;
  description?: string;
  language?: string;
  category?: string;
  tags?: string[];
  suite?: string;
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

export interface FixtureSourceFile {
  relativePath: string;
  absolutePath: string;
}

export interface FixtureRecord {
  id: string;
  description?: string;
  language: string;
  category?: string;
  tags: string[];
  suite?: string;
  rootDir: string;
  sourceFiles: FixtureSourceFile[];
  expectedOutputFile?: string;
  metadataFile?: string;
  assetsDir?: string;
  comparisonMode: ComparisonMode;
  timeoutMs?: number;
  env: Record<string, string>;
  baselineCommand?: string;
  translatedCommand?: string;
  generatedFileGlobs: string[];
  outputFiles: string[];
  numericTolerance?: number;
  regexPattern?: string;
  expectedFailureTarget: "baseline" | "translated";
  expectedRejectStage?: RejectStage;
  browserExecutionMode?: BrowserExecutionMode;
  browserTimeoutMs?: number;
  config: FixtureConfig;
}

export interface SuiteRecord {
  name: string;
  fixtureIds: string[];
  fixtureGlobs: string[];
  tags: string[];
  config: SuiteConfig;
}

export interface FixtureDiscoveryOptions {
  fixturesDir: string;
  fixtures?: FixtureConfig[];
  suites?: SuiteConfig[];
  comparisonMode: ComparisonMode;
}

export interface FixtureSelection {
  ids?: string[];
  tags?: string[];
  suites?: string[];
  languages?: string[];
  corpora?: string[];
}

export interface IngestedFixture {
  fixture: FixtureRecord;
  metadata: FixtureMetadata;
  sourceFiles: FixtureSourceFile[];
  expectedOutputFile?: string;
  assetsDir?: string;
}
