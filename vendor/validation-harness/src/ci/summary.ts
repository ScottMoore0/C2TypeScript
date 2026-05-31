import type { HarnessRunResult } from "../results/types.js";

export function mapRunResultToExitCode(result: HarnessRunResult): number {
  return result.failCount === 0 ? 0 : 1;
}

export function renderCiSummary(result: HarnessRunResult): string {
  const failedFixtures = result.fixtureResults
    .filter((fixture) => !fixture.success)
    .map((fixture) => fixture.fixtureId)
    .sort();

  const regressions = result.fixtureResults
    .flatMap((fixture) => fixture.regressions.map((regression) => `${fixture.fixtureId}:${regression.status}`))
    .sort();

  return [
    `run=${result.runId}`,
    `fixtures=${result.fixtureCount}`,
    `pass=${result.passCount}`,
    `fail=${result.failCount}`,
    `regressions=${result.regressionCount}`,
    `failedFixtures=${failedFixtures.join(",") || "none"}`,
    `regressionStatuses=${regressions.join(",") || "none"}`
  ].join(" ");
}
