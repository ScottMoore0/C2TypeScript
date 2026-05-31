import { filterFixtures } from "../fixtures/registry.js";
import type { FixtureRecord, FixtureSelection } from "../fixtures/types.js";
import { buildCacheKeyRecord, computeCacheKey, detectCacheStatus } from "../cache/core.js";
import { classifyFixtureFailure } from "../classification/core.js";
import { compareRuns } from "../comparison/core.js";
import { runBaseline } from "../runs/baseline.js";
import { runBrowser } from "../runs/browser.js";
import { runTranslated } from "../runs/translated.js";
import { createRunWorkspace } from "../workspace/manager.js";
import type { ArtifactConfig, RegressionConfig, RunnerConfig } from "../config/types.js";
import type { BrowserLauncher } from "../browser/launcher.js";
import type { BrowserRunResult } from "../browser/types.js";
import { attachRegressionRecords } from "../regressions/core.js";
import { selectPreviousRun } from "../regressions/lookup.js";
import { persistRunResult, updateSummaryIndex } from "../results/store.js";
import type { FixtureResultRecord, HarnessRunResult } from "../results/types.js";

function createRunId(): string {
  return `run-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function computeBaseTranslatedSuccess(options: {
  comparisonPassed: boolean;
  baselineSuccess: boolean;
  translatedSuccess: boolean;
  comparisonMode: FixtureRecord["comparisonMode"];
  expectedFailureTarget: FixtureRecord["expectedFailureTarget"];
}): boolean {
  if (!options.comparisonPassed) {
    return false;
  }

  if (options.comparisonMode === "expect-failure") {
    return options.expectedFailureTarget === "baseline"
      ? !options.baselineSuccess
      : !options.translatedSuccess;
  }

  if (options.comparisonMode === "expected-reject") {
    return !options.translatedSuccess;
  }

  return options.baselineSuccess && options.translatedSuccess;
}

// CH-13: browser runs are additive — when a fixture has a browser run, the fixture
// succeeds iff both the baseline-vs-translated comparison AND the browser run succeed.
function computeFixtureSuccess(options: {
  baseTranslatedSuccess: boolean;
  browser?: BrowserRunResult;
}): boolean {
  if (!options.baseTranslatedSuccess) {
    return false;
  }
  if (options.browser && !options.browser.success) {
    return false;
  }
  return true;
}

export async function executeRun(options: {
  fixtures: FixtureRecord[];
  selection?: FixtureSelection;
  resultsDir: string;
  runners: RunnerConfig;
  artifacts: ArtifactConfig;
  regressions: RegressionConfig;
  browserLauncher?: BrowserLauncher;
}): Promise<HarnessRunResult> {
  const selected = filterFixtures(options.fixtures, options.selection);
  const runId = createRunId();
  const createdAt = new Date().toISOString();
  const fixtureResults: FixtureResultRecord[] = [];
  const previousRun = selectPreviousRun(options.resultsDir, runId);

  async function executeFixture(fixture: FixtureRecord): Promise<FixtureResultRecord> {
    const workspace = createRunWorkspace(options.resultsDir, fixture);
    const baseline = await runBaseline({
      fixture,
      workspace,
      runners: options.runners,
      artifacts: options.artifacts
    });
    const translated = await runTranslated({
      fixture,
      workspace,
      runners: options.runners,
      artifacts: options.artifacts
    });
    const comparison = compareRuns(fixture.comparisonMode, baseline, translated, fixture);
    const baseTranslatedSuccess = computeBaseTranslatedSuccess({
      comparisonPassed: comparison.passed,
      baselineSuccess: baseline.success,
      translatedSuccess: translated.success,
      comparisonMode: fixture.comparisonMode,
      expectedFailureTarget: fixture.expectedFailureTarget
    });

    // CH-13: browser runs are opt-in per fixture. Presence of `browserExecutionMode`
    // signals the fixture wants browser validation; the runner only fires if the
    // caller also supplied a launcher (CH-14: transport-agnostic, pluggable).
    let browser: BrowserRunResult | undefined;
    if (options.browserLauncher && fixture.browserExecutionMode) {
      browser = await runBrowser({
        fixtureId: fixture.id,
        workspaceDir: workspace.fixtureDir,
        browserArtifactsDir: workspace.browserArtifactsDir,
        launcher: options.browserLauncher,
        executionMode: fixture.browserExecutionMode,
        timeoutMs:
          fixture.browserTimeoutMs ??
          fixture.timeoutMs ??
          options.runners.timeoutMs,
        artifactRetention: options.artifacts.retention
      });
    }

    const success = computeFixtureSuccess({
      baseTranslatedSuccess,
      browser
    });

    const fixtureResult: FixtureResultRecord = {
      fixtureId: fixture.id,
      language: fixture.language,
      category: fixture.category,
      tags: fixture.tags,
      suite: fixture.suite,
      baseline,
      translated,
      browser,
      comparison,
      success,
      failureCategory: undefined,
      cacheKey: undefined,
      cacheStatus: undefined,
      regressions: []
    };
    const cacheKey = computeCacheKey(buildCacheKeyRecord(fixture, options.runners, options.artifacts));
    fixtureResult.cacheKey = cacheKey;
    fixtureResult.cacheStatus = detectCacheStatus({
      currentKey: cacheKey,
      previousRun,
      fixtureId: fixture.id
    });
    fixtureResult.failureCategory = classifyFixtureFailure(fixtureResult);
    return fixtureResult;
  }

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < selected.length) {
      const index = cursor;
      cursor += 1;
      const fixture = selected[index];
      if (!fixture) {
        return;
      }
      const fixtureResult = await executeFixture(fixture);
      fixtureResults.push(fixtureResult);
    }
  }

  const workers = Array.from({ length: Math.min(options.runners.concurrency, Math.max(selected.length, 1)) }, () => worker());
  await Promise.all(workers);
  fixtureResults.sort((left, right) => left.fixtureId.localeCompare(right.fixtureId));

  const passCount = fixtureResults.filter((result) => result.success).length;
  const rawResult: HarnessRunResult = {
    schemaVersion: "1",
    runId,
    createdAt,
    fixtureCount: fixtureResults.length,
    passCount,
    failCount: fixtureResults.length - passCount,
    regressionCount: 0,
    fixtureResults
  };
  const result = attachRegressionRecords({
    current: rawResult,
    previous: previousRun,
    durationThresholdRatio: options.regressions.durationThresholdRatio,
    durationThresholdAbsoluteMs: options.regressions.durationThresholdAbsoluteMs
  });

  const resultPath = persistRunResult(options.resultsDir, result);
  updateSummaryIndex(options.resultsDir, result, resultPath);
  return result;
}
