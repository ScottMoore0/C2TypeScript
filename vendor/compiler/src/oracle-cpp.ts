/**
 * Phase K1: C++ Oracle — compile and run the original project.
 * Auto-detects build system, compiles, runs with test inputs, captures output.
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface OracleResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  buildTime: number;
  runTime: number;
  error?: string;
}

type BuildSystem = "cmake" | "make" | "meson" | "autotools" | "msbuild" | "unknown";

/**
 * Detect the build system of a C/C++ project.
 */
export function detectBuildSystem(projectDir: string): BuildSystem {
  if (existsSync(join(projectDir, "CMakeLists.txt"))) return "cmake";
  if (existsSync(join(projectDir, "Makefile"))) return "make";
  if (existsSync(join(projectDir, "meson.build"))) return "meson";
  if (existsSync(join(projectDir, "configure"))) return "autotools";
  if (existsSync(join(projectDir, "configure.ac"))) return "autotools";
  // Check for .sln or .vcxproj
  try {
    const files = execSync(`find "${projectDir}" -maxdepth 2 -name "*.sln" -o -name "*.vcxproj"`, { encoding: "utf-8" });
    if (files.trim()) return "msbuild";
  } catch {}
  return "unknown";
}

/**
 * Build the C++ project.
 */
export function buildProject(projectDir: string, buildDir?: string): { success: boolean; error?: string; time: number } {
  const system = detectBuildSystem(projectDir);
  const bd = buildDir ?? join(projectDir, "build");
  const t0 = Date.now();

  try {
    switch (system) {
      case "cmake":
        execSync(`cmake -S "${projectDir}" -B "${bd}" -DCMAKE_BUILD_TYPE=Release 2>&1`, { encoding: "utf-8", timeout: 120000 });
        execSync(`cmake --build "${bd}" --parallel 2>&1`, { encoding: "utf-8", timeout: 300000 });
        break;
      case "make":
        execSync(`make -C "${projectDir}" -j$(nproc) 2>&1`, { encoding: "utf-8", timeout: 300000 });
        break;
      case "meson":
        execSync(`meson setup "${bd}" "${projectDir}" 2>&1`, { encoding: "utf-8", timeout: 60000 });
        execSync(`meson compile -C "${bd}" 2>&1`, { encoding: "utf-8", timeout: 300000 });
        break;
      case "autotools":
        execSync(`cd "${projectDir}" && ./configure && make -j$(nproc) 2>&1`, { encoding: "utf-8", timeout: 300000 });
        break;
      default:
        // Try to compile all .c/.cpp files directly
        const src = execSync(`find "${projectDir}" -name "*.cpp" -o -name "*.c" | head -20`, { encoding: "utf-8" }).trim();
        if (src) {
          const files = src.split("\n").map(f => `"${f}"`).join(" ");
          execSync(`g++ -o "${bd}/a.out" ${files} -std=c++17 -O2 2>&1`, { encoding: "utf-8", timeout: 120000 });
        }
    }
    return { success: true, time: Date.now() - t0 };
  } catch (e: any) {
    return { success: false, error: e.message?.substring(0, 500), time: Date.now() - t0 };
  }
}

/**
 * Find the built executable.
 */
export function findExecutable(projectDir: string, buildDir?: string): string | null {
  const bd = buildDir ?? join(projectDir, "build");
  const candidates = [
    join(bd, "a.out"),
    join(bd, "main"),
    join(bd, "bin", "*"),
  ];

  // Search for executable files in build dir
  try {
    const result = execSync(
      `find "${bd}" -maxdepth 3 -type f -executable | head -5`,
      { encoding: "utf-8" }
    ).trim();
    if (result) return result.split("\n")[0];
  } catch {}

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

/**
 * Run the C++ executable and capture output.
 */
export function runCppOracle(
  executable: string,
  args: string[] = [],
  options: { timeout?: number; input?: string; cwd?: string } = {},
): OracleResult {
  const timeout = options.timeout ?? 30000;
  const t0 = Date.now();

  try {
    const result = spawnSync(executable, args, {
      encoding: "utf-8",
      timeout,
      input: options.input,
      cwd: options.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });

    return {
      success: true,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.status ?? -1,
      buildTime: 0,
      runTime: Date.now() - t0,
    };
  } catch (e: any) {
    return {
      success: false,
      stdout: "",
      stderr: e.message ?? "",
      exitCode: -1,
      buildTime: 0,
      runTime: Date.now() - t0,
      error: e.message,
    };
  }
}
