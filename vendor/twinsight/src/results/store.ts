import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { HarnessRunResult, RunSummaryIndexEntry } from "./types.js";

export function serializeRunResult(result: HarnessRunResult): string {
  return JSON.stringify(result, null, 2);
}

export function deserializeRunResult(raw: string): HarnessRunResult {
  return JSON.parse(raw) as HarnessRunResult;
}

export function loadRunResult(pathname: string): HarnessRunResult {
  return deserializeRunResult(readFileSync(pathname, "utf8"));
}

function runsDir(resultsDir: string): string {
  return join(resolve(resultsDir), "runs");
}

export function persistRunResult(resultsDir: string, result: HarnessRunResult): string {
  const root = runsDir(resultsDir);
  mkdirSync(root, { recursive: true });
  const pathname = join(root, `${result.runId}.json`);
  writeFileSync(pathname, serializeRunResult(result), "utf8");
  return pathname;
}

export function loadSummaryIndex(resultsDir: string): RunSummaryIndexEntry[] {
  const pathname = join(resolve(resultsDir), "index.json");
  try {
    return JSON.parse(readFileSync(pathname, "utf8")) as RunSummaryIndexEntry[];
  } catch {
    return [];
  }
}

export function persistSummaryIndex(resultsDir: string, entries: RunSummaryIndexEntry[]): string {
  const pathname = join(resolve(resultsDir), "index.json");
  writeFileSync(pathname, JSON.stringify(entries, null, 2), "utf8");
  return pathname;
}

export function updateSummaryIndex(resultsDir: string, result: HarnessRunResult, resultPath: string): RunSummaryIndexEntry[] {
  const entries = loadSummaryIndex(resultsDir).filter((entry) => entry.runId !== result.runId);
  entries.push({
    runId: result.runId,
    createdAt: result.createdAt,
    fixtureCount: result.fixtureCount,
    passCount: result.passCount,
    failCount: result.failCount,
    resultPath
  });
  entries.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  persistSummaryIndex(resultsDir, entries);
  return entries;
}
