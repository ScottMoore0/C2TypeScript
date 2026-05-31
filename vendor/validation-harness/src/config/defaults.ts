import type {
  ArtifactConfig,
  ComparisonMode,
  RegressionConfig,
  RunnerConfig,
  ValidationHarnessConfig,
  ValidationHarnessConfigInput
} from "./types.js";

export const DEFAULT_COMPARISON_MODE: ComparisonMode = "exact-text";

export const DEFAULT_ARTIFACT_CONFIG: ArtifactConfig = {
  retention: "all"
};

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  shell: true,
  timeoutMs: 30_000,
  concurrency: 1,
  env: {}
};

export const DEFAULT_REGRESSION_CONFIG: RegressionConfig = {
  durationThresholdRatio: 0.2
};

export const DEFAULT_CONFIG: ValidationHarnessConfig = {
  fixturesDir: "fixtures",
  resultsDir: "results",
  runners: DEFAULT_RUNNER_CONFIG,
  artifacts: DEFAULT_ARTIFACT_CONFIG,
  regressions: DEFAULT_REGRESSION_CONFIG,
  comparisonMode: DEFAULT_COMPARISON_MODE,
  fixtures: [],
  suites: [],
  corpora: []
};

export function mergeConfig(
  base: ValidationHarnessConfig,
  override: ValidationHarnessConfigInput
): ValidationHarnessConfig {
  return {
    fixturesDir: override.fixturesDir ?? base.fixturesDir,
    resultsDir: override.resultsDir ?? base.resultsDir,
    runners: {
      ...base.runners,
      ...override.runners,
      env: {
        ...base.runners.env,
        ...(override.runners?.env ?? {})
      }
    },
    artifacts: {
      ...base.artifacts,
      ...override.artifacts
    },
    regressions: {
      ...base.regressions,
      ...override.regressions
    },
    comparisonMode: override.comparisonMode ?? base.comparisonMode,
    fixtures: override.fixtures ?? base.fixtures,
    suites: override.suites ?? base.suites,
    corpora: override.corpora ?? base.corpora,
    browser: override.browser ?? base.browser
  };
}
