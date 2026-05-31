import { spawn } from "node:child_process";

import type { CommandInvocation, CommandRunResult } from "./types.js";

export async function runCommand(invocation: CommandInvocation): Promise<CommandRunResult> {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const child = spawn(invocation.command, invocation.args ?? [], {
      cwd: invocation.cwd,
      env: { ...process.env, ...invocation.env },
      shell: invocation.shell
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let resolved = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, invocation.timeoutMs);

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      if (resolved) {
        return;
      }
      resolved = true;
      clearTimeout(timer);
      resolve({
        invocation,
        exitCode: null,
        stdout,
        stderr: `${stderr}${error.message}`,
        durationMs: Date.now() - startedAt,
        failureKind: "spawn-error",
        timedOut: false,
        ok: false
      });
    });

    child.on("close", (exitCode) => {
      if (resolved) {
        return;
      }
      resolved = true;
      clearTimeout(timer);
      resolve({
        invocation,
        exitCode,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
        failureKind: timedOut ? "timeout" : exitCode === 0 ? "success" : "nonzero-exit",
        timedOut,
        ok: !timedOut && exitCode === 0
      });
    });
  });
}
