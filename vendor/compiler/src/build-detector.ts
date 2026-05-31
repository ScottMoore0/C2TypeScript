/**
 * Phase 8.1: Build system detector.
 * Detects CMake, Make, Autotools, Meson, or single-file projects.
 */

import { existsSync, readdirSync } from "node:fs";
import { join, extname, basename } from "node:path";

export interface BuildInfo {
  system: "cmake" | "make" | "autotools" | "meson" | "single-file" | "unknown";
  buildCommand: string;
  executablePath: string | null;
  sourceFile?: string;
}

export function detectBuildSystem(projectDir: string): BuildInfo {
  if (existsSync(join(projectDir, "CMakeLists.txt"))) {
    const buildDir = join(projectDir, "build");
    return {
      system: "cmake",
      buildCommand: `cmake -B "${buildDir}" -S "${projectDir}" && cmake --build "${buildDir}"`,
      executablePath: buildDir,
    };
  }

  if (existsSync(join(projectDir, "Makefile")) || existsSync(join(projectDir, "makefile"))) {
    return { system: "make", buildCommand: `make -C "${projectDir}"`, executablePath: projectDir };
  }

  if (existsSync(join(projectDir, "configure")) || existsSync(join(projectDir, "configure.ac"))) {
    return {
      system: "autotools",
      buildCommand: `cd "${projectDir}" && ./configure && make`,
      executablePath: projectDir,
    };
  }

  if (existsSync(join(projectDir, "meson.build"))) {
    const buildDir = join(projectDir, "builddir");
    return {
      system: "meson",
      buildCommand: `meson setup "${buildDir}" "${projectDir}" && ninja -C "${buildDir}"`,
      executablePath: buildDir,
    };
  }

  // Single file detection
  try {
    const files = readdirSync(projectDir);
    const sourceFile = files.find(f => [".c", ".cpp", ".cc", ".cxx"].includes(extname(f).toLowerCase()));
    if (sourceFile) {
      const src = join(projectDir, sourceFile);
      const ext = extname(sourceFile).toLowerCase();
      const out = join(projectDir, basename(sourceFile, ext) + (process.platform === "win32" ? ".exe" : ""));
      const compiler = ext === ".c" ? "gcc" : "g++";
      const std = ext === ".c" ? "-std=c17" : "-std=c++23";
      return {
        system: "single-file",
        buildCommand: `${compiler} ${std} -o "${out}" "${src}"`,
        executablePath: out,
        sourceFile: src,
      };
    }
  } catch {}

  return { system: "unknown", buildCommand: "", executablePath: null };
}
