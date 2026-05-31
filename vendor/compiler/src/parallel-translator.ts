/**
 * Parallel file translator.
 * Processes multiple C++ files simultaneously with result caching.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { dumpASTStreaming } from "./clang-runner-streaming.js";
import { Emitter } from "./emitter.js";
import { cleanupTranslatedFile } from "./post-translation-cleanup.js";
import { computeRecommendedConcurrency } from "./iteration-speed.js";

export interface TranslationResult {
  file: string;
  tsCode: string;
  success: boolean;
  error?: string;
  cached: boolean;
  timeMs: number;
}

export interface ParallelOptions {
  concurrency?: number;
  cacheDir?: string;         // default: <outputDir>/.cache
  includeFlags?: string[];
  wrapIntegers?: boolean;
  onProgress?: (done: number, total: number, file: string, cached: boolean, timeMs: number) => void;
}

/**
 * Compute a SHA-256 cache key from file content and include flags.
 */
function computeCacheKey(filePath: string, includeFlags: string[]): string {
  const content = readFileSync(filePath, "utf-8");
  const hash = createHash("sha256")
    .update(content)
    .update(includeFlags.join("\0"))
    .digest("hex");
  return hash;
}

/**
 * Translate a single C++ file to TypeScript.
 * Checks cache first; on miss, runs the full pipeline.
 */
async function translateOne(
  file: string,
  outputDir: string,
  cacheDir: string,
  includeFlags: string[],
  wrapIntegers: boolean,
): Promise<TranslationResult> {
  const start = performance.now();
  const outName = basename(file).replace(/\.(cpp|cxx|cc|c|hpp|hxx|h)$/i, ".ts");
  const outPath = join(outputDir, outName);

  try {
    // Check cache
    const hash = computeCacheKey(file, includeFlags);
    const cachePath = join(cacheDir, hash + ".ts");

    if (existsSync(cachePath)) {
      const tsCode = readFileSync(cachePath, "utf-8");
      writeFileSync(outPath, tsCode, "utf-8");
      return { file, tsCode, success: true, cached: true, timeMs: performance.now() - start };
    }

    // Cache miss — run full translation pipeline
    const { ast } = await dumpASTStreaming(file, includeFlags);
    const emitter = new Emitter({ wrapIntegers });
    let tsCode = emitter.emit(ast);
    const cleaned = cleanupTranslatedFile(tsCode);
    tsCode = cleaned.code;

    // Write output and cache
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, tsCode, "utf-8");
    writeFileSync(cachePath, tsCode, "utf-8");

    return { file, tsCode, success: true, cached: false, timeMs: performance.now() - start };
  } catch (err: any) {
    return {
      file,
      tsCode: "",
      success: false,
      error: err?.message ?? String(err),
      cached: false,
      timeMs: performance.now() - start,
    };
  }
}

/**
 * Translate multiple C++ files in parallel batches with caching.
 */
export async function translateFilesParallel(
  files: string[],
  outputDir: string,
  options: ParallelOptions = {},
): Promise<TranslationResult[]> {
  const concurrency = computeRecommendedConcurrency({
    requested: options.concurrency,
    windowsCap: 12,
    memoryPerWorkerMB: 160,
  });
  const cacheDir = options.cacheDir ?? join(outputDir, ".cache");
  const includeFlags = options.includeFlags ?? [];
  const wrapIntegers = options.wrapIntegers ?? true;
  const onProgress = options.onProgress;

  // Ensure output and cache directories exist
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  const results: TranslationResult[] = [];
  let done = 0;

  // Process in batches of `concurrency`
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((file) => translateOne(file, outputDir, cacheDir, includeFlags, wrapIntegers)),
    );

    for (const result of batchResults) {
      results.push(result);
      done++;
      onProgress?.(done, files.length, result.file, result.cached, result.timeMs);
    }
  }

  return results;
}

/**
 * Delete all cached translation files in the given cache directory.
 */
export function clearCache(cacheDir: string): void {
  if (!existsSync(cacheDir)) return;
  for (const entry of readdirSync(cacheDir)) {
    if (entry.endsWith(".ts")) {
      unlinkSync(join(cacheDir, entry));
    }
  }
}
