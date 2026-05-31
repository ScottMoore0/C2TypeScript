/**
 * Automatic dependency resolver.
 * Detects missing headers, identifies required packages, installs them,
 * runs CMake/build system to fetch vendored dependencies.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface MissingDependency {
  header: string;
  packageName: string | null;
  packageManager: string;
}

/** Well-known header → package mappings */
const HEADER_TO_PACKAGE: Record<string, { msys2?: string; apt?: string; brew?: string }> = {
  "SDL.h": { msys2: "mingw-w64-ucrt-x86_64-SDL2", apt: "libsdl2-dev", brew: "sdl2" },
  "SDL2/SDL.h": { msys2: "mingw-w64-ucrt-x86_64-SDL2", apt: "libsdl2-dev", brew: "sdl2" },
  "SDL_mixer.h": { msys2: "mingw-w64-ucrt-x86_64-SDL2_mixer", apt: "libsdl2-mixer-dev", brew: "sdl2_mixer" },
  "SDL_image.h": { msys2: "mingw-w64-ucrt-x86_64-SDL2_image", apt: "libsdl2-image-dev", brew: "sdl2_image" },
  "lua.h": { msys2: "mingw-w64-ucrt-x86_64-lua51", apt: "liblua5.1-dev", brew: "lua@5.1" },
  "lua5.1/lua.h": { msys2: "mingw-w64-ucrt-x86_64-lua51", apt: "liblua5.1-dev", brew: "lua@5.1" },
  "zlib.h": { msys2: "mingw-w64-ucrt-x86_64-zlib", apt: "zlib1g-dev", brew: "zlib" },
  "png.h": { msys2: "mingw-w64-ucrt-x86_64-libpng", apt: "libpng-dev", brew: "libpng" },
  "curl/curl.h": { msys2: "mingw-w64-ucrt-x86_64-curl", apt: "libcurl4-openssl-dev", brew: "curl" },
  "openssl/ssl.h": { msys2: "mingw-w64-ucrt-x86_64-openssl", apt: "libssl-dev", brew: "openssl" },
  "pthread.h": { msys2: "mingw-w64-ucrt-x86_64-winpthreads", apt: "", brew: "" },
  "boost/shared_ptr.hpp": { msys2: "mingw-w64-ucrt-x86_64-boost", apt: "libboost-dev", brew: "boost" },
  "opencv2/core.hpp": { msys2: "mingw-w64-ucrt-x86_64-opencv", apt: "libopencv-dev", brew: "opencv" },
  "GL/gl.h": { msys2: "mingw-w64-ucrt-x86_64-mesa", apt: "libgl-dev", brew: "mesa" },
  "tolua++.h": { msys2: "mingw-w64-ucrt-x86_64-tolua", apt: "libtolua-dev", brew: "" },
  "guisan.hpp": { msys2: "", apt: "", brew: "" }, // vendored, needs CMake fetch
};

/**
 * Detect which package manager is available.
 */
export function detectPackageManager(): "msys2" | "apt" | "brew" | "none" {
  if (existsSync("/c/msys64/usr/bin/pacman.exe") || existsSync("C:/msys64/usr/bin/pacman.exe")) return "msys2";
  if (spawnSync("apt", ["--version"], { encoding: "utf-8" }).status === 0) return "apt";
  if (spawnSync("brew", ["--version"], { encoding: "utf-8" }).status === 0) return "brew";
  return "none";
}

/**
 * Parse Clang error output to find missing headers.
 */
export function findMissingHeaders(clangErrors: string): string[] {
  const missing: string[] = [];
  const pattern = /fatal error: '([^']+)' file not found|fatal error: ([^:]+): No such file or directory/g;
  let match;
  while ((match = pattern.exec(clangErrors)) !== null) {
    missing.push(match[1] || match[2]);
  }
  return [...new Set(missing)];
}

/**
 * Map missing headers to package names for the detected package manager.
 */
export function resolvePackages(missingHeaders: string[], pm: ReturnType<typeof detectPackageManager>): MissingDependency[] {
  return missingHeaders.map(header => {
    const mapping = HEADER_TO_PACKAGE[header];
    let packageName: string | null = null;
    if (mapping) {
      if (pm === "msys2") packageName = mapping.msys2 || null;
      else if (pm === "apt") packageName = mapping.apt || null;
      else if (pm === "brew") packageName = mapping.brew || null;
    }
    return { header, packageName, packageManager: pm };
  });
}

/**
 * Install packages using the detected package manager.
 */
export function installPackages(packages: string[], pm: ReturnType<typeof detectPackageManager>): { success: boolean; output: string } {
  if (packages.length === 0) return { success: true, output: "No packages to install" };

  let cmd: string;
  let args: string[];

  switch (pm) {
    case "msys2":
      cmd = "C:/msys64/usr/bin/pacman.exe";
      args = ["-S", "--noconfirm", ...packages];
      break;
    case "apt":
      cmd = "sudo";
      args = ["apt-get", "install", "-y", ...packages];
      break;
    case "brew":
      cmd = "brew";
      args = ["install", ...packages];
      break;
    default:
      return { success: false, output: `No package manager available. Need: ${packages.join(", ")}` };
  }

  const result = spawnSync(cmd, args, { timeout: 300000, encoding: "utf-8" });
  return {
    success: result.status === 0,
    output: (result.stdout ?? "") + (result.stderr ?? ""),
  };
}

/**
 * Check if a project needs CMake configuration to fetch vendored dependencies.
 */
export function needsCMakeFetch(projectDir: string): boolean {
  const cmake = join(projectDir, "CMakeLists.txt");
  if (!existsSync(cmake)) return false;
  const content = readFileSync(cmake, "utf-8");
  return content.includes("FetchContent") || content.includes("ExternalProject") ||
         content.includes("vendored") || content.includes("git_submodule");
}

/**
 * Run CMake configure to fetch vendored dependencies.
 */
export function runCMakeConfigure(projectDir: string): { success: boolean; output: string; buildDir: string } {
  const buildDir = join(projectDir, "build");
  const result = spawnSync("cmake", ["-B", buildDir, "-S", projectDir], {
    timeout: 300000, encoding: "utf-8",
  });
  return {
    success: result.status === 0,
    output: (result.stdout ?? "") + (result.stderr ?? ""),
    buildDir,
  };
}

/**
 * Extract include paths from a CMake build directory.
 */
export function extractCMakeIncludePaths(buildDir: string): string[] {
  const paths: string[] = [];

  // Check compile_commands.json if it exists
  const compileDb = join(buildDir, "compile_commands.json");
  if (existsSync(compileDb)) {
    try {
      const db = JSON.parse(readFileSync(compileDb, "utf-8"));
      for (const entry of db) {
        const cmd: string = entry.command ?? entry.arguments?.join(" ") ?? "";
        const matches = cmd.matchAll(/-I\s*(\S+)/g);
        for (const m of matches) {
          if (!paths.includes(m[1])) paths.push(m[1]);
        }
      }
    } catch {}
  }

  // Also check CMakeCache.txt for include dirs
  const cache = join(buildDir, "CMakeCache.txt");
  if (existsSync(cache)) {
    const content = readFileSync(cache, "utf-8");
    const matches = content.matchAll(/INCLUDE_DIR[S]?:PATH=(.+)/g);
    for (const m of matches) {
      for (const p of m[1].split(";")) {
        if (p && !paths.includes(p)) paths.push(p);
      }
    }
  }

  return paths;
}

/**
 * Full automatic dependency resolution for a project.
 * Returns include flags to pass to Clang.
 */
export async function autoResolveDependencies(
  projectDir: string,
  log: string[]
): Promise<string[]> {
  const pm = detectPackageManager();
  log.push(`Package manager: ${pm}`);

  // Step 1: Try CMake configure to fetch vendored deps
  if (needsCMakeFetch(projectDir)) {
    log.push("Project uses CMake with vendored dependencies, configuring...");
    const cmake = runCMakeConfigure(projectDir);
    if (cmake.success) {
      log.push("CMake configure succeeded");
      const cmakePaths = extractCMakeIncludePaths(cmake.buildDir);
      if (cmakePaths.length > 0) {
        log.push(`Found ${cmakePaths.length} include paths from CMake`);
        return cmakePaths.flatMap(p => ["-I", p]);
      }
    } else {
      // CMake failed — likely missing packages. Parse the error.
      log.push("CMake configure failed, checking for missing packages...");
      const missing = findMissingHeaders(cmake.output);
      if (missing.length > 0) {
        const deps = resolvePackages(missing, pm);
        const toInstall = deps.filter(d => d.packageName).map(d => d.packageName!);
        if (toInstall.length > 0) {
          log.push(`Installing: ${toInstall.join(", ")}`);
          const install = installPackages(toInstall, pm);
          if (install.success) {
            log.push("Packages installed, retrying CMake...");
            const retry = runCMakeConfigure(projectDir);
            if (retry.success) {
              const paths = extractCMakeIncludePaths(retry.buildDir);
              return paths.flatMap(p => ["-I", p]);
            }
          }
        }
      }
    }
  }

  // Step 2: Scan project for include directories
  const includeFlags: string[] = [];
  const { scanProject } = await import("./project-scanner.js");
  const project = scanProject(projectDir);
  for (const dir of project.includeDirs) {
    includeFlags.push("-I", dir);
  }

  // Step 3: Add common system include paths
  const systemPaths = [
    "/c/msys64/ucrt64/include",
    "/c/msys64/ucrt64/include/SDL2",
    "/c/msys64/ucrt64/include/lua5.1",
    "/usr/include",
    "/usr/local/include",
  ];
  for (const p of systemPaths) {
    if (existsSync(p)) includeFlags.push("-I", p);
  }

  return includeFlags;
}
