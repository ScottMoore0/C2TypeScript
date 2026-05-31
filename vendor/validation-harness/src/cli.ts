#!/usr/bin/env node

import { resolve } from "node:path";

import { executeRun } from "./app/run.js";
import { mapRunResultToExitCode, renderCiSummary } from "./ci/summary.js";
import { loadConfig } from "./config/loader.js";
import { loadBrowserLauncher } from "./browser/loader.js";
import { discoverCorpora, expandCorpusFixtureIds } from "./corpora/registry.js";
import { discoverFixtures, discoverSuites, filterFixtures } from "./fixtures/registry.js";
import { renderHelp } from "./help.js";
import { loadRunResult, loadSummaryIndex } from "./results/store.js";
import { writeHtmlReport } from "./reporting/html.js";
import { renderRunReportJson } from "./reporting/json.js";
import { renderFixtureList, renderFixtureResult, renderRunSummary } from "./reporting/text.js";
import { HARNESS_VERSION } from "./version.js";

export interface CliResult {
  exitCode: number;
  output: string;
}

interface ParsedOptions {
  command?: string;
  configPath?: string;
  runId?: string;
  againstRunId?: string;
  fixtureId?: string;
  ids: string[];
  tags: string[];
  suites: string[];
  languages: string[];
  corpora: string[];
  showSuites: boolean;
  json: boolean;
  html: boolean;
  ci: boolean;
  artifactDir?: string;
  concurrency?: number;
}

function parseArgs(argv: string[]): ParsedOptions {
  const options: ParsedOptions = {
    ids: [],
    tags: [],
    suites: [],
    languages: [],
    corpora: [],
    showSuites: false,
    json: false,
    html: false,
    ci: false
  };

  let index = 0;
  if (argv[0] && !argv[0].startsWith("--")) {
    options.command = argv[0];
    index = 1;
  }

  while (index < argv.length) {
    const token = argv[index];
    const next = argv[index + 1];

    switch (token) {
      case "--config":
        options.configPath = next;
        index += 2;
        break;
      case "--id":
        options.ids.push(next);
        index += 2;
        break;
      case "--tag":
        options.tags.push(next);
        index += 2;
        break;
      case "--suite":
        options.suites.push(next);
        index += 2;
        break;
      case "--language":
        options.languages.push(next);
        index += 2;
        break;
      case "--corpus":
        options.corpora.push(next);
        index += 2;
        break;
      case "--run-id":
        options.runId = next;
        index += 2;
        break;
      case "--against-run-id":
        options.againstRunId = next;
        index += 2;
        break;
      case "--fixture":
        options.fixtureId = next;
        index += 2;
        break;
      case "--artifact-dir":
        options.artifactDir = next;
        index += 2;
        break;
      case "--concurrency":
        options.concurrency = Number(next);
        index += 2;
        break;
      case "--suites":
        options.showSuites = true;
        index += 1;
        break;
      case "--json":
        options.json = true;
        index += 1;
        break;
      case "--html":
        options.html = true;
        index += 1;
        break;
      case "--ci":
        options.ci = true;
        index += 1;
        break;
      default:
        throw new Error(`Unknown arguments: ${argv.slice(index).join(" ")}`);
    }
  }

  return options;
}

async function getConfig(configPath?: string) {
  if (configPath) {
    return (await loadConfig(configPath)).config;
  }
  return (await loadConfig(resolve("validation-harness.json"))).config;
}

function getSelection(options: ParsedOptions) {
  return {
    ids: options.ids,
    tags: options.tags,
    suites: options.suites,
    languages: options.languages,
    corpora: options.corpora
  };
}

async function handleList(options: ParsedOptions): Promise<CliResult> {
  const config = await getConfig(options.configPath);
  const allFixtures = discoverFixtures({
    fixturesDir: config.fixturesDir,
    comparisonMode: config.comparisonMode,
    fixtures: config.fixtures,
    suites: config.suites
  });
  if (options.showSuites) {
    const suites = discoverSuites(config.suites);
    return {
      exitCode: 0,
      output: suites.length === 0 ? "No suites found." : suites.map((suite) => suite.name).join("\n")
    };
  }

  const corpora = discoverCorpora(config.corpora, allFixtures);
  const corpusFixtureIds = expandCorpusFixtureIds(corpora, options.corpora);
  const ids = corpusFixtureIds.length > 0 ? [...options.ids, ...corpusFixtureIds] : options.ids;
  const fixtures = filterFixtures(allFixtures, { ...getSelection(options), ids });

  return { exitCode: 0, output: renderFixtureList(fixtures) };
}

async function handleRun(options: ParsedOptions): Promise<CliResult> {
  const configPath = options.configPath ?? resolve("validation-harness.json");
  const config = (await loadConfig(configPath)).config;
  if (options.concurrency !== undefined && (!Number.isInteger(options.concurrency) || options.concurrency <= 0)) {
    return { exitCode: 1, output: "Invalid --concurrency value" };
  }
  const fixtures = discoverFixtures({
    fixturesDir: config.fixturesDir,
    comparisonMode: config.comparisonMode,
    fixtures: config.fixtures,
    suites: config.suites
  });
  const corpora = discoverCorpora(config.corpora, fixtures);
  const corpusFixtureIds = expandCorpusFixtureIds(corpora, options.corpora);
  const ids = corpusFixtureIds.length > 0 ? [...options.ids, ...corpusFixtureIds] : options.ids;

  let browserLauncher;
  try {
    browserLauncher = await loadBrowserLauncher(config, configPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { exitCode: 1, output: `Browser launcher load failed: ${message}` };
  }

  const result = await executeRun({
    fixtures,
    selection: { ...getSelection(options), ids },
    resultsDir: config.resultsDir,
    runners: {
      ...config.runners,
      concurrency: options.concurrency ?? config.runners.concurrency
    },
    artifacts: config.artifacts,
    regressions: config.regressions,
    browserLauncher
  });

  return {
    exitCode: result.failCount === 0 ? 0 : 1,
    output: renderRunSummary(result)
  };
}

async function resolveRunResultPath(configPath: string | undefined, runId: string | undefined): Promise<string | undefined> {
  const config = await getConfig(configPath);
  if (runId) {
    return resolve(config.resultsDir, "runs", `${runId}.json`);
  }
  return loadSummaryIndex(config.resultsDir)[0]?.resultPath;
}

async function resolveNamedRunResultPath(configPath: string | undefined, runId: string): Promise<string | undefined> {
  const config = await getConfig(configPath);
  return loadSummaryIndex(config.resultsDir).find((entry) => entry.runId === runId)?.resultPath;
}

function renderRegressionComparison(options: {
  currentRunId: string;
  previousRunId: string;
  currentPassCount: number;
  currentFailCount: number;
  statusCounts: Map<string, number>;
}): string {
  const lines = [
    `Compare ${options.currentRunId} vs ${options.previousRunId}`,
    `Current pass: ${options.currentPassCount}`,
    `Current fail: ${options.currentFailCount}`,
    "Regression status counts:"
  ];

  for (const [status, count] of [...options.statusCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`- ${status}: ${count}`);
  }

  return lines.join("\n");
}

async function handleShow(options: ParsedOptions): Promise<CliResult> {
  if (!options.fixtureId) {
    return { exitCode: 1, output: "Missing required --fixture value" };
  }

  const resultPath = await resolveRunResultPath(options.configPath, options.runId);
  if (!resultPath) {
    return { exitCode: 1, output: "No stored run result found" };
  }

  const result = loadRunResult(resultPath);
  return {
    exitCode: 0,
    output: options.json ? renderRunReportJson({
      ...result,
      fixtureResults: result.fixtureResults.filter((entry) => entry.fixtureId === options.fixtureId)
    }) : renderFixtureResult(result, options.fixtureId)
  };
}

async function handleReport(options: ParsedOptions): Promise<CliResult> {
  const resultPath = await resolveRunResultPath(options.configPath, options.runId);
  if (!resultPath) {
    return { exitCode: 1, output: "No stored run result found" };
  }

  const result = loadRunResult(resultPath);
  if (options.html) {
    const rootDir = options.artifactDir ? resolve(options.artifactDir) : undefined;
    const output = writeHtmlReport(rootDir ?? resolve(resultPath, "..", ".."), result);
    return {
      exitCode: mapRunResultToExitCode(result),
      output: output.summaryPath
    };
  }
  return {
    exitCode: mapRunResultToExitCode(result),
    output: options.json ? renderRunReportJson(result) : renderRunSummary(result)
  };
}

async function handleCompare(options: ParsedOptions): Promise<CliResult> {
  if (!options.runId) {
    return { exitCode: 1, output: "Missing required --run-id value" };
  }

  const currentPath = await resolveNamedRunResultPath(options.configPath, options.runId);
  if (!currentPath) {
    return { exitCode: 1, output: `Stored run result not found: ${options.runId}` };
  }

  const current = loadRunResult(currentPath);
  const previousRunId =
    options.againstRunId ??
    current.fixtureResults
      .flatMap((fixture) => fixture.regressions.map((entry) => entry.baselineRunId))
      .find((value): value is string => typeof value === "string");

  if (!previousRunId) {
    return { exitCode: 1, output: "No previous run available for comparison" };
  }

  const previousPath = await resolveNamedRunResultPath(options.configPath, previousRunId);
  if (!previousPath) {
    return { exitCode: 1, output: `Stored baseline run result not found: ${previousRunId}` };
  }

  const previous = loadRunResult(previousPath);
  const statusCounts = new Map<string, number>();
  for (const fixture of current.fixtureResults) {
    for (const regression of fixture.regressions) {
      statusCounts.set(regression.status, (statusCounts.get(regression.status) ?? 0) + 1);
    }
  }

  return {
    exitCode: mapRunResultToExitCode(current),
    output: options.ci
      ? renderCiSummary(current)
      : renderRegressionComparison({
          currentRunId: current.runId,
          previousRunId: previous.runId,
          currentPassCount: current.passCount,
          currentFailCount: current.failCount,
          statusCounts
        })
  };
}

export async function runCli(argv: string[]): Promise<CliResult> {
  if (argv.includes("--version")) {
    return { exitCode: 0, output: HARNESS_VERSION };
  }

  if (argv.length === 0 || argv.includes("--help")) {
    return { exitCode: 0, output: renderHelp() };
  }

  try {
    const options = parseArgs(argv);
    switch (options.command) {
      case "list":
        return handleList(options);
      case "run":
        return handleRun(options);
      case "show":
        return handleShow(options);
      case "report":
        return handleReport(options);
      case "compare":
        return handleCompare(options);
      default:
        return {
          exitCode: 1,
          output: `Unknown arguments: ${argv.join(" ")}\n\n${renderHelp()}`
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      exitCode: 1,
      output: `${message}\n\n${renderHelp()}`
    };
  }
}

async function main(): Promise<void> {
  const result = await runCli(process.argv.slice(2));
  const stream = result.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${result.output}\n`);
  process.exitCode = result.exitCode;
}

void main();
