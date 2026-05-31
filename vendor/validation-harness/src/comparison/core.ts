import { readFileSync } from "node:fs";

import type { ComparisonMode } from "../config/types.js";
import type { FixtureRecord } from "../fixtures/types.js";
import type { BaselineRunResult, TranslatedRunResult } from "../runs/types.js";
import type { ComparisonCheckResult, ComparisonResult, TextDifference } from "./types.js";

const REJECT_STAGE_PATTERN = /\b(?:vh-reject-stage[:=]|reject-stage[:=])\s*(parse|translate|pre-run)\b/i;

function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function normalizedLines(value: string): string[] {
  return normalizeText(value).split("\n");
}

function isNumericToken(value: string): boolean {
  return /^(?:[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|NaN|Infinity|-Infinity)$/.test(value.trim());
}

function parseNumericToken(value: string): number | undefined {
  const trimmed = value.trim();
  if (!isNumericToken(trimmed)) {
    return undefined;
  }
  return Number(trimmed);
}

export function locateFirstDifference(expected: string, actual: string): TextDifference | undefined {
  if (expected === actual) {
    return undefined;
  }

  let index = 0;
  while (index < expected.length && index < actual.length && expected[index] === actual[index]) {
    index += 1;
  }

  const expectedPrefix = expected.slice(0, index);
  const line = expectedPrefix.split("\n").length;
  const lastNewline = expectedPrefix.lastIndexOf("\n");
  const column = index - lastNewline;

  return {
    index,
    line,
    column,
    expectedFragment: expected.slice(index, index + 40),
    actualFragment: actual.slice(index, index + 40)
  };
}

export function compareExactText(expected: string, actual: string, name = "stdout"): ComparisonCheckResult {
  const passed = expected === actual;
  return {
    name,
    passed,
    expected,
    actual,
    difference: passed ? undefined : locateFirstDifference(expected, actual)
  };
}

export function compareNormalizedText(expected: string, actual: string, name = "stdout"): ComparisonCheckResult {
  const normalizedExpected = normalizeText(expected);
  const normalizedActual = normalizeText(actual);
  const passed = normalizedExpected === normalizedActual;
  return {
    name,
    passed,
    expected: normalizedExpected,
    actual: normalizedActual,
    difference: passed ? undefined : locateFirstDifference(normalizedExpected, normalizedActual)
  };
}

export function compareExitCode(expected: number | null, actual: number | null): ComparisonCheckResult {
  return {
    name: "exit-code",
    passed: expected === actual,
    expected,
    actual
  };
}

export function compareStderr(expected: string, actual: string): ComparisonCheckResult {
  const passed = expected === actual;
  return {
    name: "stderr",
    passed,
    expected,
    actual,
    difference: passed ? undefined : locateFirstDifference(expected, actual)
  };
}

export function compareNumericTolerance(expected: string, actual: string, tolerance: number): ComparisonCheckResult {
  const expectedValue = parseNumericToken(expected);
  const actualValue = parseNumericToken(actual);

  if (expectedValue === undefined || actualValue === undefined) {
    return {
      name: "numeric-tolerance",
      passed: false,
      expected,
      actual,
      message: "numeric parse failure"
    };
  }

  let passed = false;
  if (Number.isNaN(expectedValue) || Number.isNaN(actualValue)) {
    passed = Number.isNaN(expectedValue) && Number.isNaN(actualValue);
  } else if (!Number.isFinite(expectedValue) || !Number.isFinite(actualValue)) {
    passed = Object.is(expectedValue, actualValue);
  } else {
    passed = Math.abs(expectedValue - actualValue) <= tolerance;
  }

  return {
    name: "numeric-tolerance",
    passed,
    expected: expectedValue,
    actual: actualValue,
    message: `tolerance=${tolerance}`
  };
}

export function compareLineWise(expected: string, actual: string): ComparisonCheckResult {
  const expectedLines = normalizedLines(expected);
  const actualLines = normalizedLines(actual);
  const expectedJoined = expectedLines.join("\n");
  const actualJoined = actualLines.join("\n");
  const passed = expectedJoined === actualJoined;
  return {
    name: "line-wise",
    passed,
    expected: expectedLines,
    actual: actualLines,
    difference: passed ? undefined : locateFirstDifference(expectedJoined, actualJoined)
  };
}

export function compareUnorderedLines(expected: string, actual: string): ComparisonCheckResult {
  const expectedLines = normalizedLines(expected).sort();
  const actualLines = normalizedLines(actual).sort();
  const expectedJoined = expectedLines.join("\n");
  const actualJoined = actualLines.join("\n");
  const passed = expectedJoined === actualJoined;
  return {
    name: "unordered-line",
    passed,
    expected: expectedLines,
    actual: actualLines,
    difference: passed ? undefined : locateFirstDifference(expectedJoined, actualJoined)
  };
}

function collectComparableArtifacts(run: BaselineRunResult | TranslatedRunResult): Map<string, string> {
  const map = new Map<string, string>();
  for (const artifact of [...run.generatedArtifacts, ...run.outputArtifacts]) {
    map.set(artifact.label, readFileSync(artifact.absolutePath, "utf8"));
  }
  return map;
}

export function compareFileContent(
  baseline: BaselineRunResult,
  translated: TranslatedRunResult
): ComparisonCheckResult {
  const expectedFiles = collectComparableArtifacts(baseline);
  const actualFiles = collectComparableArtifacts(translated);
  const labels = [...new Set([...expectedFiles.keys(), ...actualFiles.keys()])].sort();

  for (const label of labels) {
    const expected = expectedFiles.get(label);
    const actual = actualFiles.get(label);
    if (expected === undefined || actual === undefined) {
      return {
        name: "file-content",
        passed: false,
        expected: expected === undefined ? "missing" : label,
        actual: actual === undefined ? "missing" : label,
        message: `file mismatch for ${label}`
      };
    }
    const check = compareExactText(normalizeText(expected), normalizeText(actual), `file:${label}`);
    if (!check.passed) {
      return {
        ...check,
        name: "file-content",
        message: `file content mismatch for ${label}`
      };
    }
  }

  return {
    name: "file-content",
    passed: true,
    expected: labels,
    actual: labels
  };
}

export function compareRegexExpectation(pattern: string, actual: string): ComparisonCheckResult {
  const regex = new RegExp(pattern);
  return {
    name: "regex",
    passed: regex.test(actual),
    expected: pattern,
    actual
  };
}

export function detectRejectStage(translated: TranslatedRunResult): string | undefined {
  const streams = [translated.commandResult.stderr, translated.commandResult.stdout];
  for (const stream of streams) {
    const match = REJECT_STAGE_PATTERN.exec(stream);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
  }

  if (translated.commandResult.failureKind === "spawn-error") {
    return "pre-run";
  }

  return undefined;
}

export function compareExpectedReject(
  translated: TranslatedRunResult,
  expectedStage: FixtureRecord["expectedRejectStage"]
): ComparisonCheckResult {
  const actualStage = detectRejectStage(translated) ?? "unknown";
  const rejected = !translated.commandResult.ok;

  if (!expectedStage) {
    return {
      name: "expected-reject",
      passed: false,
      expected: "configured reject stage",
      actual: "missing",
      message: "expectedRejectStage is required for expected-reject mode"
    };
  }

  return {
    name: "expected-reject",
    passed: rejected && actualStage === expectedStage,
    expected: expectedStage,
    actual: actualStage,
    message: rejected ? undefined : "translated command succeeded unexpectedly"
  };
}

export function composeComparisonResults(mode: ComparisonMode, checks: ComparisonCheckResult[]): ComparisonResult {
  const firstDifference = checks.find((check) => check.difference)?.difference;
  return {
    mode,
    passed: checks.every((check) => check.passed),
    checks,
    firstDifference
  };
}

export function compareRuns(
  mode: ComparisonMode,
  baseline: BaselineRunResult,
  translated: TranslatedRunResult,
  fixture?: FixtureRecord
): ComparisonResult {
  if (mode === "exit-code") {
    return composeComparisonResults(mode, [
      compareExitCode(baseline.commandResult.exitCode, translated.commandResult.exitCode)
    ]);
  }

  if (mode === "expect-failure") {
    const target = fixture?.expectedFailureTarget ?? "translated";
    const targetedRun = target === "baseline" ? baseline : translated;
    return composeComparisonResults(mode, [
      {
        name: `${target}-failure`,
        passed: !targetedRun.commandResult.ok,
        expected: "non-success",
        actual: targetedRun.commandResult.failureKind,
        message: `target=${target}`
      }
    ]);
  }

  if (mode === "expected-reject") {
    return composeComparisonResults(mode, [
      compareExpectedReject(translated, fixture?.expectedRejectStage)
    ]);
  }

  if (mode === "numeric-tolerance") {
    return composeComparisonResults(mode, [
      compareNumericTolerance(
        baseline.commandResult.stdout,
        translated.commandResult.stdout,
        fixture?.numericTolerance ?? 0
      )
    ]);
  }

  if (mode === "line-wise") {
    return composeComparisonResults(mode, [
      compareLineWise(baseline.commandResult.stdout, translated.commandResult.stdout)
    ]);
  }

  if (mode === "unordered-line") {
    return composeComparisonResults(mode, [
      compareUnorderedLines(baseline.commandResult.stdout, translated.commandResult.stdout)
    ]);
  }

  if (mode === "file-content") {
    return composeComparisonResults(mode, [compareFileContent(baseline, translated)]);
  }

  if (mode === "regex") {
    return composeComparisonResults(mode, [
      compareRegexExpectation(fixture?.regexPattern ?? "", translated.commandResult.stdout)
    ]);
  }

  const stdoutCheck =
    mode === "normalized-text"
      ? compareNormalizedText(baseline.commandResult.stdout, translated.commandResult.stdout, "stdout")
      : compareExactText(baseline.commandResult.stdout, translated.commandResult.stdout, "stdout");

  return composeComparisonResults(mode, [
    stdoutCheck,
    compareStderr(baseline.commandResult.stderr, translated.commandResult.stderr),
    compareExitCode(baseline.commandResult.exitCode, translated.commandResult.exitCode)
  ]);
}
