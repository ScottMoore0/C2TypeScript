import type { HarnessRunResult } from "../results/types.js";

export function renderBenchmarkSummary(result: HarnessRunResult): string {
  const durations = result.fixtureResults.map((fixture) => fixture.translated.commandResult.durationMs);
  const total = durations.reduce((sum, value) => sum + value, 0);
  const average = durations.length > 0 ? total / durations.length : 0;
  const max = durations.length > 0 ? Math.max(...durations) : 0;

  return [
    `benchmark-run=${result.runId}`,
    `fixtures=${result.fixtureCount}`,
    `totalDurationMs=${total.toFixed(2)}`,
    `averageDurationMs=${average.toFixed(2)}`,
    `maxDurationMs=${max.toFixed(2)}`
  ].join(" ");
}
