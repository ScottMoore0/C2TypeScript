import type { BrowserRunResult } from "../browser/types.js";
import type { ComparisonResult } from "../comparison/types.js";
import type { BaselineRunResult, TranslatedRunResult } from "../runs/types.js";

export const RESULT_SCHEMA_VERSION = "1";

export type FailureCategory =
  | "config"
  | "ingestion"
  | "baseline-execution"
  | "translated-execution"
  | "comparison"
  | "timeout"
  | "browser-execution"
  | "internal";

export type RegressionStatus =
  | "stable-pass"
  | "stable-fail"
  | "pass-to-fail"
  | "fail-to-pass"
  | "changed-output"
  | "duration-regression"
  | "new-fixture"
  | "missing-baseline";

export interface RegressionRecord {
  status: RegressionStatus;
  fixtureId: string;
  baselineRunId?: string;
  previousSuccess?: boolean;
  currentSuccess: boolean;
  details?: Record<string, unknown>;
}

export interface FixtureResultRecord {
  fixtureId: string;
  language: string;
  category?: string;
  tags: string[];
  suite?: string;
  failureCategory?: FailureCategory;
  cacheKey?: string;
  cacheStatus?: "hit" | "miss";
  baseline: BaselineRunResult;
  translated: TranslatedRunResult;
  browser?: BrowserRunResult;
  comparison: ComparisonResult;
  success: boolean;
  regressions: RegressionRecord[];
}

export interface HarnessRunResult {
  schemaVersion: typeof RESULT_SCHEMA_VERSION;
  runId: string;
  createdAt: string;
  fixtureCount: number;
  passCount: number;
  failCount: number;
  regressionCount: number;
  fixtureResults: FixtureResultRecord[];
}

export interface RunSummaryIndexEntry {
  runId: string;
  createdAt: string;
  fixtureCount: number;
  passCount: number;
  failCount: number;
  resultPath: string;
}
