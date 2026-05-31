/**
 * Phase 8.2: Project builder.
 * Executes build commands and locates the output executable.
 */

import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { BuildInfo } from "./build-detector.js";

export interface BuildResult {
  success: boolean;
  executable: string | null;
  output: string;
  error: string;
}

export function buildProject(info: BuildInfo): BuildResult {
  if (!info.buildCommand) {
    return { success: false, executable: null, output: "", error: "No build command" };
  }

  const result = spawnSync(info.buildCommand, [], {
    shell: true,
    timeout: 120000,
    encoding: "utf-8",
  });

  const success = result.status === 0;
  const output = (result.stdout ?? "").toString();
  const error = (result.stderr ?? "").toString();

  let executable = info.executablePath;

  // For cmake/make/meson, find the executable in the build directory
  if (success && executable && info.system !== "single-file") {
    executable = findExecutable(executable);
  }

  return { success, executable, output, error };
}

function findExecutable(dir: string): string | null {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isFile()) {
        const isExe = entry.endsWith(".exe") || (!entry.includes(".") && (stat.mode & 0o111) !== 0);
        if (isExe) return full;
      }
      if (stat.isDirectory()) {
        const found = findExecutable(full);
        if (found) return found;
      }
    }
  } catch {}
  return null;
}
