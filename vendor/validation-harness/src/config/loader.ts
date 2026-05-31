import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { DEFAULT_CONFIG, mergeConfig } from "./defaults.js";
import type { ConfigLoadResult, ValidationHarnessConfig, ValidationHarnessConfigInput } from "./types.js";
import { ConfigValidationError, validateConfig } from "./validation.js";

export async function loadConfig(configPath: string): Promise<ConfigLoadResult> {
  const resolvedPath = resolve(configPath);
  const contents = await readFile(resolvedPath, "utf8");

  let parsed: ValidationHarnessConfigInput;
  try {
    parsed = JSON.parse(contents) as ValidationHarnessConfigInput;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigValidationError(`Failed to parse config JSON: ${message}`);
  }

  const merged = mergeConfig(DEFAULT_CONFIG, parsed);
  const validated = validateConfig(merged);

  return {
    path: resolvedPath,
    config: validated
  };
}

export function resolveConfig(input?: ValidationHarnessConfigInput): ValidationHarnessConfig {
  return validateConfig(mergeConfig(DEFAULT_CONFIG, input ?? {}));
}
