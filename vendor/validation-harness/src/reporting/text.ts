import type { FixtureRecord } from "../fixtures/types.js";
import type { HarnessRunResult } from "../results/types.js";
import { summarizeCacheStatuses } from "../cache/core.js";

function regressionStatusCounts(result: HarnessRunResult): Map<string, number> {
  const counts = new Map<string, number>();
  for (const fixture of result.fixtureResults) {
    for (const regression of fixture.regressions) {
      counts.set(regression.status, (counts.get(regression.status) ?? 0) + 1);
    }
  }
  return counts;
}

export function renderFixtureList(fixtures: FixtureRecord[]): string {
  if (fixtures.length === 0) {
    return "No fixtures found.";
  }

  return fixtures
    .map((fixture) => {
      const tags = fixture.tags.length > 0 ? ` [${fixture.tags.join(",")}]` : "";
      const suite = fixture.suite ? ` suite=${fixture.suite}` : "";
      const category = fixture.category ? ` category=${fixture.category}` : "";
      return `${fixture.id} language=${fixture.language}${suite}${category}${tags}`;
    })
    .join("\n");
}

export function renderRunSummary(result: HarnessRunResult): string {
  const lines = [
    `Run ${result.runId}`,
    `Fixtures: ${result.fixtureCount}`,
    `Pass: ${result.passCount}`,
    `Fail: ${result.failCount}`,
    `Regressions: ${result.regressionCount}`,
    "",
    "Per-category:"
  ];

  const counts = new Map<string, { total: number; pass: number; fail: number }>();
  for (const fixture of result.fixtureResults) {
    const key = fixture.category ?? "uncategorized";
    const bucket = counts.get(key) ?? { total: 0, pass: 0, fail: 0 };
    bucket.total += 1;
    if (fixture.success) {
      bucket.pass += 1;
    } else {
      bucket.fail += 1;
    }
    counts.set(key, bucket);
  }

  for (const [category, bucket] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`- ${category}: total=${bucket.total} pass=${bucket.pass} fail=${bucket.fail}`);
  }

  const regressions = regressionStatusCounts(result);
  if (regressions.size > 0) {
    lines.push("", "Regression summary:");
    for (const [status, count] of [...regressions.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`- ${status}: ${count}`);
    }
  }

  const cache = summarizeCacheStatuses(result);
  if (cache.hit > 0 || cache.miss > 0) {
    lines.push("", `Cache: hit=${cache.hit} miss=${cache.miss}`);
  }

  return lines.join("\n");
}

export function renderFixtureResult(result: HarnessRunResult, fixtureId: string): string {
  const fixture = result.fixtureResults.find((entry) => entry.fixtureId === fixtureId);
  if (!fixture) {
    return `Fixture result not found: ${fixtureId}`;
  }

  const lines = [
    `Fixture ${fixture.fixtureId}`,
    `Success: ${fixture.success}`,
    `Language: ${fixture.language}`,
    `Mode: ${fixture.comparison.mode}`,
    `Failure category: ${fixture.failureCategory ?? "none"}`,
    `Cache: ${fixture.cacheStatus ?? "none"}${fixture.cacheKey ? ` (${fixture.cacheKey.slice(0, 12)})` : ""}`,
    `Regressions: ${fixture.regressions.map((entry) => entry.status).join(", ") || "none"}`,
    `Baseline command: ${fixture.baseline.command}`,
    `Translated command: ${fixture.translated.command}`,
    `Checks:`
  ];

  for (const check of fixture.comparison.checks) {
    lines.push(`- ${check.name}: ${check.passed ? "pass" : "fail"}`);
  }

  if (fixture.browser) {
    lines.push(
      `Browser run: outcome=${fixture.browser.outcome} success=${fixture.browser.success} timedOut=${fixture.browser.timedOut} durationMs=${fixture.browser.durationMs}`,
      `Browser execution mode: ${fixture.browser.launchRequest.executionMode}`,
      `Browser events: ${fixture.browser.events.length}`
    );
  }

  const artifactLines = [
    ...fixture.baseline.artifacts.map((artifact) => `- baseline ${artifact.kind} ${artifact.label}: ${artifact.relativePath}`),
    ...fixture.translated.artifacts.map((artifact) => `- translated ${artifact.kind} ${artifact.label}: ${artifact.relativePath}`),
    ...(fixture.browser?.artifacts ?? []).map(
      (artifact) => `- browser ${artifact.kind} ${artifact.label}: ${artifact.relativePath}`
    )
  ];
  if (artifactLines.length > 0) {
    lines.push("Artifacts:", ...artifactLines);
  }

  if (fixture.comparison.firstDifference) {
    lines.push(
      `First difference: line ${fixture.comparison.firstDifference.line}, column ${fixture.comparison.firstDifference.column}`,
      `Expected fragment: ${fixture.comparison.firstDifference.expectedFragment}`,
      `Actual fragment: ${fixture.comparison.firstDifference.actualFragment}`
    );
  }

  return lines.join("\n");
}
