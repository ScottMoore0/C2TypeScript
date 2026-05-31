import { ConfigValidationError } from "../config/validation.js";
import { FixtureValidationError } from "../fixtures/errors.js";
import type { ComparisonResult } from "../comparison/types.js";
import type { CommandFailureKind } from "../command/types.js";
import type { FailureCategory, FixtureResultRecord } from "../results/types.js";

function categoryForExecution(kind: "baseline" | "translated" | "browser"): FailureCategory {
  if (kind === "baseline") {
    return "baseline-execution";
  }
  if (kind === "translated") {
    return "translated-execution";
  }
  return "browser-execution";
}

export function classifyConfigurationError(error: unknown): FailureCategory {
  if (error instanceof ConfigValidationError) {
    return "config";
  }
  if (error instanceof FixtureValidationError) {
    return "ingestion";
  }
  return "internal";
}

export function classifyCommandFailure(options: {
  kind: "baseline" | "translated" | "browser";
  failureKind: CommandFailureKind;
}): FailureCategory | undefined {
  if (options.failureKind === "timeout") {
    return "timeout";
  }
  if (options.failureKind === "spawn-error" || options.failureKind === "nonzero-exit") {
    return categoryForExecution(options.kind);
  }
  return undefined;
}

export function classifyComparisonFailure(comparison: ComparisonResult): FailureCategory | undefined {
  if (!comparison.passed) {
    return "comparison";
  }
  return undefined;
}

export function classifyFixtureFailure(result: FixtureResultRecord): FailureCategory | undefined {
  const precedence: Array<FailureCategory | undefined> = [
    classifyCommandFailure({
      kind: "baseline",
      failureKind: result.baseline.commandResult.failureKind
    }),
    classifyCommandFailure({
      kind: "translated",
      failureKind: result.translated.commandResult.failureKind
    }),
    classifyComparisonFailure(result.comparison)
  ];

  return precedence.find((entry) => entry !== undefined);
}
