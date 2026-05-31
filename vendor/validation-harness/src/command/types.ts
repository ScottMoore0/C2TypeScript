export type CommandFailureKind = "success" | "nonzero-exit" | "spawn-error" | "timeout";

export interface CommandInvocation {
  command: string;
  args?: string[];
  shell: boolean;
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
}

export interface CommandRunResult {
  invocation: CommandInvocation;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  failureKind: CommandFailureKind;
  timedOut: boolean;
  ok: boolean;
}
