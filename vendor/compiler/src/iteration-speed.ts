import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import os from "node:os";
import { join, resolve } from "node:path";

export type TsRuntime = "tsx" | "bun";

const MB = 1024 * 1024;

export interface ConcurrencyOptions {
  envVar?: string;
  requested?: number;
  windowsCap?: number;
  memoryPerWorkerMB?: number;
  hardCap?: number;
  min?: number;
}

export function computeRecommendedConcurrency(options: ConcurrencyOptions = {}): number {
  const envVar = options.envVar ?? "c2ts_CONCURRENCY";
  const min = Math.max(1, options.min ?? 1);
  const windowsCap = Math.max(min, options.windowsCap ?? 12);
  const hardCap = Math.max(min, options.hardCap ?? Number.MAX_SAFE_INTEGER);
  const memoryPerWorkerMB = Math.max(1, options.memoryPerWorkerMB ?? 120);
  const cpuCount = Math.max(1, os.cpus().length || 1);
  const freeMemBound = Math.max(1, Math.floor(os.freemem() / (memoryPerWorkerMB * MB)));
  const platformCap = process.platform === "win32" ? windowsCap : hardCap;
  const requested = parsePositiveInt(process.env[envVar]) ?? options.requested ?? cpuCount;
  return Math.max(min, Math.min(requested, cpuCount, freeMemBound, platformCap, hardCap));
}

export function parseTsRuntimeArg(argv: string[]): TsRuntime {
  const explicit = argv.find((arg) => arg.startsWith("--ts-runtime="));
  const raw = explicit?.split("=", 2)[1] ?? process.env.c2ts_TS_RUNTIME ?? "tsx";
  if (raw === "tsx" || raw === "bun") return raw;
  throw new Error(`Unsupported --ts-runtime value: ${raw}`);
}

export function hasBunRuntime(): boolean {
  try {
    const result = spawnSync(resolveTsRuntimeCommand("bun"), ["--version"], { encoding: "utf-8", timeout: 5000 });
    return result.status === 0;
  } catch {
    return false;
  }
}

export function resolveTsRuntimeFromEnv(): TsRuntime {
  const raw = process.env.c2ts_TS_RUNTIME ?? "tsx";
  if (raw === "tsx" || raw === "bun") return raw;
  return "tsx";
}

export function runTypeScriptFile(
  tsFile: string,
  runtime: TsRuntime,
  timeout = 10000,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const cmd = resolveTsRuntimeCommand(runtime);
  const args = runtime === "bun" ? ["run", tsFile] : ["tsx", tsFile];
  return new Promise((resolveRun) => {
    let stdout = "";
    let stderr = "";
    let resolved = false;
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("close", (code) => {
      if (!resolved) {
        resolved = true;
        resolveRun({ stdout, stderr, exitCode: code ?? -1 });
      }
    });
    child.on("error", (err: Error) => {
      if (!resolved) {
        resolved = true;
        resolveRun({ stdout, stderr: stderr + err.message, exitCode: -1 });
      }
    });
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { child.kill(); } catch {}
        resolveRun({ stdout, stderr, exitCode: -1 });
      }
    }, timeout);
  });
}

export function runTypeScriptFileSync(
  tsFile: string,
  runtime: TsRuntime,
  timeout = 10000,
): { stdout: string; stderr: string; exitCode: number } {
  const cmd = resolveTsRuntimeCommand(runtime);
  const args = runtime === "bun" ? ["run", tsFile] : ["tsx", tsFile];
  try {
    const result = spawnSync(cmd, args, {
      encoding: "utf-8",
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      shell: process.platform === "win32",
    });
    const stdout = result.stdout ?? "";
    const stderr = result.stderr ?? "";
    // Diagnostic surfacing: if a TS run produces no stdout but did emit stderr,
    // tee a brief excerpt to console.error so flake investigations can see why
    // the harness reported "Got: ''". Previously this stderr was silently
    // swallowed by callers that only inspect stdout; flake debugging lost
    // critical signal. Set c2ts_QUIET_RUNTS=1 to suppress.
    if (!process.env.c2ts_QUIET_RUNTS && stdout === "" && stderr.length > 0 && (result.status ?? -1) !== 0) {
      const excerpt = stderr.length > 500 ? stderr.slice(0, 500) + " ...(truncated)" : stderr;
      console.error(`[runTypeScriptFileSync] ${tsFile}: empty stdout; stderr (exit=${result.status ?? -1}):\n${excerpt}`);
    }
    return { stdout, stderr, exitCode: result.status ?? -1 };
  } catch (error: any) {
    return { stdout: "", stderr: error?.message ?? "TS runtime failed", exitCode: -1 };
  }
}

export function createIsolatedTempFile(
  prefix: string,
  suffix: string,
  tempRoot?: string,
): { dir: string; filePath: string; cleanup: () => void } {
  const baseRoot = resolveTempRoot(tempRoot);
  mkdirSync(baseRoot, { recursive: true });
  const dir = mkdtempSync(join(baseRoot, `${prefix}-`));
  const filePath = join(dir, `${prefix}${suffix}`);
  return {
    dir,
    filePath,
    cleanup: () => {
      try { rmSync(dir, { recursive: true, force: true }); } catch {}
    },
  };
}

function resolveTempRoot(tempRoot?: string): string {
  const candidate = tempRoot ? resolve(tempRoot) : os.tmpdir();
  if (!existsSync(candidate)) mkdirSync(candidate, { recursive: true });
  return candidate;
}

function resolveTsRuntimeCommand(runtime: TsRuntime): string {
  if (runtime !== "bun") return "npx";
  const explicit = process.env.BUN_PATH;
  if (explicit) return explicit;
  if (process.platform === "win32") {
    const wingetBun = join(
      os.homedir(),
      "AppData",
      "Local",
      "Microsoft",
      "WinGet",
      "Packages",
      "Oven-sh.Bun_Microsoft.Winget.Source_8wekyb3d8bbwe",
      "bun-windows-x64",
      "bun.exe",
    );
    if (existsSync(wingetBun)) return wingetBun;
  }
  return "bun";
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
