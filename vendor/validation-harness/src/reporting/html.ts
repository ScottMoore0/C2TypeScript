import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { FixtureResultRecord, HarnessRunResult } from "../results/types.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function regressionStatusCounts(result: HarnessRunResult): Map<string, number> {
  const counts = new Map<string, number>();
  for (const fixture of result.fixtureResults) {
    for (const regression of fixture.regressions) {
      counts.set(regression.status, (counts.get(regression.status) ?? 0) + 1);
    }
  }
  return counts;
}

function fixtureFilename(fixtureId: string): string {
  return `${fixtureId}.html`;
}

function renderArtifactLinks(fixture: FixtureResultRecord): string {
  const artifacts = [
    ...fixture.baseline.artifacts.map((artifact) => ({
      scope: "baseline",
      label: artifact.label,
      href: `../../${artifact.relativePath}`,
      kind: artifact.kind
    })),
    ...fixture.translated.artifacts.map((artifact) => ({
      scope: "translated",
      label: artifact.label,
      href: `../../${artifact.relativePath}`,
      kind: artifact.kind
    })),
    ...(fixture.browser?.artifacts ?? []).map((artifact) => ({
      scope: "browser",
      label: artifact.label,
      href: `../../${artifact.relativePath}`,
      kind: artifact.kind
    }))
  ];

  if (artifacts.length === 0) {
    return "<li>none</li>";
  }

  return artifacts
    .map(
      (artifact) =>
        `<li><a href="${escapeHtml(artifact.href)}">${escapeHtml(artifact.scope)} ${escapeHtml(artifact.kind)} ${escapeHtml(artifact.label)}</a></li>`
    )
    .join("");
}

export function renderRunSummaryHtml(result: HarnessRunResult): string {
  const fixtureRows = result.fixtureResults
    .map(
      (fixture) => `
        <tr>
          <td><a href="./fixtures/${escapeHtml(fixtureFilename(fixture.fixtureId))}">${escapeHtml(fixture.fixtureId)}</a></td>
          <td>${escapeHtml(fixture.language)}</td>
          <td>${escapeHtml(fixture.category ?? "uncategorized")}</td>
          <td>${fixture.success ? "pass" : "fail"}</td>
          <td>${escapeHtml(fixture.failureCategory ?? "none")}</td>
        </tr>`
    )
    .join("");

  const regressionRows = [...regressionStatusCounts(result).entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([status, count]) => `<li><strong>${escapeHtml(status)}</strong>: ${count}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Twinsight Report ${escapeHtml(result.runId)}</title>
    <style>
      body { font-family: sans-serif; margin: 2rem; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
      pre { background: #f6f8fa; padding: 1rem; overflow: auto; }
    </style>
  </head>
  <body>
    <h1>Run ${escapeHtml(result.runId)}</h1>
    <p>Fixtures: ${result.fixtureCount} | Pass: ${result.passCount} | Fail: ${result.failCount} | Regressions: ${result.regressionCount}</p>
    <section>
      <h2>Regression summary</h2>
      <ul>${regressionRows || "<li>none</li>"}</ul>
    </section>
    <section>
      <h2>Fixtures</h2>
      <table>
        <thead>
          <tr><th>Fixture</th><th>Language</th><th>Category</th><th>Status</th><th>Failure Category</th></tr>
        </thead>
        <tbody>${fixtureRows}</tbody>
      </table>
    </section>
  </body>
</html>`;
}

export function renderFixtureResultHtml(result: HarnessRunResult, fixtureId: string): string {
  const fixture = result.fixtureResults.find((entry) => entry.fixtureId === fixtureId);
  if (!fixture) {
    return `<!doctype html><html lang="en"><body><p>Fixture result not found: ${escapeHtml(fixtureId)}</p></body></html>`;
  }

  const checkRows = fixture.comparison.checks
    .map(
      (check) => `
        <tr>
          <td>${escapeHtml(check.name)}</td>
          <td>${check.passed ? "pass" : "fail"}</td>
          <td><pre>${escapeHtml(JSON.stringify(check.expected, null, 2))}</pre></td>
          <td><pre>${escapeHtml(JSON.stringify(check.actual, null, 2))}</pre></td>
        </tr>`
    )
    .join("");

  const regressionRows = fixture.regressions
    .map(
      (regression) => `
        <li>
          <strong>${escapeHtml(regression.status)}</strong>
          <pre>${escapeHtml(JSON.stringify(regression.details ?? {}, null, 2))}</pre>
        </li>`
    )
    .join("");

  const browserSection = fixture.browser
    ? `<section>
        <h2>Browser run</h2>
        <ul>
          <li>Execution mode: ${escapeHtml(fixture.browser.launchRequest.executionMode)}</li>
          <li>Outcome: ${escapeHtml(fixture.browser.outcome)}</li>
          <li>Success: ${fixture.browser.success}</li>
          <li>Timed out: ${fixture.browser.timedOut}</li>
          <li>Duration: ${fixture.browser.durationMs} ms</li>
          <li>Events: ${fixture.browser.events.length}</li>
          <li>Lifecycle: ${fixture.browser.lifecycleTrace
            .map((entry) => escapeHtml(entry.state))
            .join(" &rarr; ")}</li>
        </ul>
      </section>`
    : "";

  const diffSection = fixture.comparison.firstDifference
    ? `<section>
        <h2>First difference</h2>
        <p>Line ${fixture.comparison.firstDifference.line}, column ${fixture.comparison.firstDifference.column}</p>
        <h3>Expected fragment</h3>
        <pre>${escapeHtml(fixture.comparison.firstDifference.expectedFragment)}</pre>
        <h3>Actual fragment</h3>
        <pre>${escapeHtml(fixture.comparison.firstDifference.actualFragment)}</pre>
      </section>`
    : "";

  const middleSections = [browserSection, diffSection]
    .filter((section) => section.length > 0)
    .map((section) => `\n    ${section}`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Fixture ${escapeHtml(fixture.fixtureId)}</title>
    <style>
      body { font-family: sans-serif; margin: 2rem; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; vertical-align: top; }
      pre { background: #f6f8fa; padding: 1rem; overflow: auto; }
    </style>
  </head>
  <body>
    <p><a href="../index.html">Back to summary</a></p>
    <h1>Fixture ${escapeHtml(fixture.fixtureId)}</h1>
    <p>Language: ${escapeHtml(fixture.language)} | Success: ${fixture.success} | Failure category: ${escapeHtml(fixture.failureCategory ?? "none")}</p>
    <section>
      <h2>Checks</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Status</th><th>Expected</th><th>Actual</th></tr>
        </thead>
        <tbody>${checkRows}</tbody>
      </table>
    </section>${middleSections}
    <section>
      <h2>Regressions</h2>
      <ul>${regressionRows || "<li>none</li>"}</ul>
    </section>
    <section>
      <h2>Artifacts</h2>
      <ul>${renderArtifactLinks(fixture)}</ul>
    </section>
  </body>
</html>`;
}

export function writeHtmlReport(resultsDir: string, result: HarnessRunResult): { summaryPath: string; fixturePaths: string[] } {
  const root = join(resolve(resultsDir), "reports", result.runId);
  const fixturesRoot = join(root, "fixtures");
  mkdirSync(fixturesRoot, { recursive: true });

  const summaryPath = join(root, "index.html");
  writeFileSync(summaryPath, renderRunSummaryHtml(result), "utf8");

  const fixturePaths = result.fixtureResults.map((fixture) => {
    const pathname = join(fixturesRoot, fixtureFilename(fixture.fixtureId));
    writeFileSync(pathname, renderFixtureResultHtml(result, fixture.fixtureId), "utf8");
    return pathname;
  });

  return { summaryPath, fixturePaths };
}
