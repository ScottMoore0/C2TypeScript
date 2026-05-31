import type { HarnessRunResult } from "../results/types.js";

function regressionStatusCounts(result: HarnessRunResult): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const fixture of result.fixtureResults) {
    for (const regression of fixture.regressions) {
      counts[regression.status] = (counts[regression.status] ?? 0) + 1;
    }
  }
  return counts;
}

export function renderRunReportJson(result: HarnessRunResult): string {
  return JSON.stringify(
    {
      kind: "twinsight-report",
      schemaVersion: result.schemaVersion,
      reportVersion: "1",
      run: {
        runId: result.runId,
        createdAt: result.createdAt,
        fixtureCount: result.fixtureCount,
        passCount: result.passCount,
        failCount: result.failCount,
        regressionCount: result.regressionCount
      },
      regressionSummary: regressionStatusCounts(result),
      fixtures: result.fixtureResults.map((fixture) => ({
        fixtureId: fixture.fixtureId,
        language: fixture.language,
        category: fixture.category,
        tags: fixture.tags,
        suite: fixture.suite,
        success: fixture.success,
        failureCategory: fixture.failureCategory,
        comparison: fixture.comparison,
        baseline: {
          command: fixture.baseline.command,
          exitCode: fixture.baseline.commandResult.exitCode,
          stdout: fixture.baseline.commandResult.stdout,
          stderr: fixture.baseline.commandResult.stderr,
          durationMs: fixture.baseline.commandResult.durationMs,
          failureKind: fixture.baseline.commandResult.failureKind
        },
        translated: {
          command: fixture.translated.command,
          exitCode: fixture.translated.commandResult.exitCode,
          stdout: fixture.translated.commandResult.stdout,
          stderr: fixture.translated.commandResult.stderr,
          durationMs: fixture.translated.commandResult.durationMs,
          failureKind: fixture.translated.commandResult.failureKind
        },
        ...(fixture.browser
          ? {
              browser: {
                executionMode: fixture.browser.launchRequest.executionMode,
                outcome: fixture.browser.outcome,
                success: fixture.browser.success,
                timedOut: fixture.browser.timedOut,
                durationMs: fixture.browser.durationMs,
                eventCount: fixture.browser.events.length,
                lifecycleTrace: fixture.browser.lifecycleTrace.map((entry) => entry.state)
              }
            }
          : {}),
        regressions: fixture.regressions
      }))
    },
    null,
    2
  );
}
