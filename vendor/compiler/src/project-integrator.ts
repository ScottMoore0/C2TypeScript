/**
 * Phase R: Project integrator — orchestrates all Phase R components.
 * Detects entry points, transforms loops, connects rendering, resolves
 * data paths, and generates preload manifests for any C++/C/Lua project.
 */

import { detectEntryPoint, type EntryPoint } from "./entry-point-detector.js";
import { transformMainLoop } from "./loop-transformer.js";
import { detectRenderingLib, generateRenderingInit } from "./rendering-connector.js";
import { resolveDataPaths } from "./data-path-resolver.js";
import { generatePreloadManifest } from "./preload-generator.js";

export interface IntegrationResult {
  entryPoint: EntryPoint;
  loopTransformed: boolean;
  renderingLib: string;
  dataPath: string;
  preloadManifest: string[];
  generatedCode: string;
}

/**
 * Run the full integration pipeline on a translated project.
 * Returns everything needed to wire the project for browser execution.
 */
export async function integrateProject(projectDir: string): Promise<IntegrationResult> {
  // R1: Detect entry point
  const entryPoint = detectEntryPoint(projectDir);

  // R2: Transform main loop (GUI projects only)
  const loopResult = transformMainLoop(projectDir, entryPoint);

  // R3: Detect and generate rendering initialization
  const renderingLib = detectRenderingLib(projectDir);
  const renderingInit = generateRenderingInit(renderingLib);

  // R4: Resolve data paths
  const dataResult = resolveDataPaths(projectDir);

  // R5: Generate preload manifest
  const preloadResult = generatePreloadManifest(projectDir, entryPoint, dataResult.basePath);

  // Assemble the generated bootstrap code in correct order:
  // 1. Rendering init (canvas/WebGL/DOM setup)
  // 2. Data path config
  // 3. Asset preloader
  // 4. (loop transform is applied directly to the entry file)
  const codeParts: string[] = [
    "// === Phase R: Auto-generated project integration ===\n",
    renderingInit,
    dataResult.generatedCode,
    preloadResult.generatedCode,
  ];

  if (entryPoint.type !== "library") {
    codeParts.push(
      "// Wait for preload before starting the application\n" +
      "await (globalThis as any).__preloadPromise;\n"
    );
  }

  return {
    entryPoint,
    loopTransformed: loopResult.transformed,
    renderingLib,
    dataPath: dataResult.basePath,
    preloadManifest: preloadResult.manifest,
    generatedCode: codeParts.join("\n"),
  };
}
