import { readFileSync } from "node:fs";

import type { FixtureResultRecord, HarnessRunResult, RegressionRecord } from "../results/types.js";

function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function loadArtifactContents(fixture: FixtureResultRecord): Record<string, string> {
  const contents: Record<string, string> = {};
  for (const artifact of [
    ...fixture.baseline.generatedArtifacts,
    ...fixture.baseline.outputArtifacts,
    ...fixture.translated.generatedArtifacts,
    ...fixture.translated.outputArtifacts
  ]) {
    contents[`${artifact.kind}:${artifact.label}`] = normalizeText(readFileSync(artifact.absolutePath, "utf8"));
  }
  return contents;
}

function buildObservableSignature(fixture: FixtureResultRecord): string {
  return JSON.stringify({
    comparisonMode: fixture.comparison.mode,
    comparisonPassed: fixture.comparison.passed,
    checks: fixture.comparison.checks.map((check) => ({
      name: check.name,
      passed: check.passed,
      expected: check.expected,
      actual: check.actual,
      message: check.message
    })),
    baseline: {
      stdout: normalizeText(fixture.baseline.commandResult.stdout),
      stderr: normalizeText(fixture.baseline.commandResult.stderr),
      exitCode: fixture.baseline.commandResult.exitCode
    },
    translated: {
      stdout: normalizeText(fixture.translated.commandResult.stdout),
      stderr: normalizeText(fixture.translated.commandResult.stderr),
      exitCode: fixture.translated.commandResult.exitCode
    },
    artifacts: loadArtifactContents(fixture)
  });
}

export function detectFixtureRegressions(options: {
  current: FixtureResultRecord;
  previous?: FixtureResultRecord;
  previousRunId?: string;
  durationThresholdRatio: number;
  durationThresholdAbsoluteMs?: number;
}): RegressionRecord[] {
  const { current, previous, previousRunId, durationThresholdRatio, durationThresholdAbsoluteMs } = options;

  if (!previous) {
    return [
      {
        status: previousRunId ? "new-fixture" : "missing-baseline",
        fixtureId: current.fixtureId,
        baselineRunId: previousRunId,
        currentSuccess: current.success
      }
    ];
  }

  const regressions: RegressionRecord[] = [];
  const previousSuccess = previous.success;

  if (previousSuccess && !current.success) {
    regressions.push({
      status: "pass-to-fail",
      fixtureId: current.fixtureId,
      baselineRunId: previousRunId,
      previousSuccess,
      currentSuccess: current.success,
      details: {
        previousComparisonPassed: previous.comparison.passed,
        currentComparisonPassed: current.comparison.passed
      }
    });
  } else if (!previousSuccess && current.success) {
    regressions.push({
      status: "fail-to-pass",
      fixtureId: current.fixtureId,
      baselineRunId: previousRunId,
      previousSuccess,
      currentSuccess: current.success,
      details: {
        previousComparisonPassed: previous.comparison.passed,
        currentComparisonPassed: current.comparison.passed
      }
    });
  } else {
    const previousSignature = buildObservableSignature(previous);
    const currentSignature = buildObservableSignature(current);
    if (previousSignature !== currentSignature) {
      regressions.push({
        status: "changed-output",
        fixtureId: current.fixtureId,
        baselineRunId: previousRunId,
        previousSuccess,
        currentSuccess: current.success,
        details: {
          previousComparisonPassed: previous.comparison.passed,
          currentComparisonPassed: current.comparison.passed
        }
      });
    } else {
      regressions.push({
        status: current.success ? "stable-pass" : "stable-fail",
        fixtureId: current.fixtureId,
        baselineRunId: previousRunId,
        previousSuccess,
        currentSuccess: current.success
      });
    }
  }

  // CH-10: duration regressions must compare against a *compatible* prior fixture run.
  // When the fixture's cacheKey differs, the previous timing was produced by a different
  // command/env/comparison-mode and is not a meaningful baseline — skip the duration check.
  const cacheKeyCompatible = previous.cacheKey === current.cacheKey;

  const previousDuration = previous.translated.commandResult.durationMs;
  const currentDuration = current.translated.commandResult.durationMs;
  const durationDelta = currentDuration - previousDuration;
  const thresholdDuration = previousDuration * (1 + durationThresholdRatio);
  const ratioExceeded = previousDuration > 0 && currentDuration > thresholdDuration;
  const absoluteFloorSet =
    durationThresholdAbsoluteMs !== undefined && durationThresholdAbsoluteMs > 0;
  const absoluteExceeded = !absoluteFloorSet || durationDelta > (durationThresholdAbsoluteMs ?? 0);
  if (cacheKeyCompatible && ratioExceeded && absoluteExceeded) {
    const details: Record<string, unknown> = {
      previousDurationMs: previousDuration,
      currentDurationMs: currentDuration,
      durationDeltaMs: durationDelta,
      thresholdRatio: durationThresholdRatio
    };
    if (absoluteFloorSet) {
      details.absoluteThresholdMs = durationThresholdAbsoluteMs;
    }
    regressions.push({
      status: "duration-regression",
      fixtureId: current.fixtureId,
      baselineRunId: previousRunId,
      previousSuccess,
      currentSuccess: current.success,
      details
    });
  }

  return regressions;
}

export function attachRegressionRecords(options: {
  current: HarnessRunResult;
  previous?: HarnessRunResult;
  durationThresholdRatio: number;
  durationThresholdAbsoluteMs?: number;
}): HarnessRunResult {
  const previousFixtures = new Map(
    (options.previous?.fixtureResults ?? []).map((fixture) => [fixture.fixtureId, fixture])
  );

  const fixtureResults = options.current.fixtureResults.map((fixture) => ({
    ...fixture,
    regressions: detectFixtureRegressions({
      current: fixture,
      previous: previousFixtures.get(fixture.fixtureId),
      previousRunId: options.previous?.runId,
      durationThresholdRatio: options.durationThresholdRatio,
      durationThresholdAbsoluteMs: options.durationThresholdAbsoluteMs
    })
  }));

  return {
    ...options.current,
    fixtureResults,
    regressionCount: fixtureResults.reduce((count, fixture) => count + fixture.regressions.length, 0)
  };
}
