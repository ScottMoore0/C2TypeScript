/**
 * Phase L1-L2: Self-improving fix pattern database.
 * Stores discovered fix patterns with confidence scoring.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface FixPattern {
  id: string;
  astPattern: string;     // description of the AST context
  fixType: string;        // which fix candidate was applied
  description: string;    // human-readable description
  confidence: number;     // 0.0 - 1.0
  applications: number;   // times applied
  successes: number;      // times it improved the result
  failures: number;       // times it made things worse
  createdFrom: string;    // which project first discovered this
  createdAt: string;      // ISO date
}

const DB_PATH = join(__dirname, "..", "fix-patterns.json");

/**
 * Load the pattern database from disk.
 */
export function loadPatterns(): FixPattern[] {
  if (!existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8"));
  } catch {
    return [];
  }
}

/**
 * Save the pattern database to disk.
 */
export function savePatterns(patterns: FixPattern[]): void {
  writeFileSync(DB_PATH, JSON.stringify(patterns, null, 2));
}

/**
 * Add a new pattern to the database.
 */
export function addPattern(
  astPattern: string,
  fixType: string,
  description: string,
  projectName: string,
): FixPattern {
  const patterns = loadPatterns();

  // Check for duplicate
  const existing = patterns.find(p => p.fixType === fixType && p.astPattern === astPattern);
  if (existing) {
    existing.applications++;
    existing.successes++;
    existing.confidence = Math.min(1.0, existing.confidence + 0.1);
    savePatterns(patterns);
    return existing;
  }

  const newPattern: FixPattern = {
    id: `fix_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    astPattern,
    fixType,
    description,
    confidence: 0.5,
    applications: 1,
    successes: 1,
    failures: 0,
    createdFrom: projectName,
    createdAt: new Date().toISOString(),
  };

  patterns.push(newPattern);
  savePatterns(patterns);
  return newPattern;
}

/**
 * Record a successful application of a pattern.
 */
export function recordSuccess(patternId: string): void {
  const patterns = loadPatterns();
  const p = patterns.find(x => x.id === patternId);
  if (p) {
    p.applications++;
    p.successes++;
    p.confidence = Math.min(1.0, p.confidence + 0.1);
    savePatterns(patterns);
  }
}

/**
 * Record a failed application of a pattern.
 */
export function recordFailure(patternId: string): void {
  const patterns = loadPatterns();
  const p = patterns.find(x => x.id === patternId);
  if (p) {
    p.applications++;
    p.failures++;
    p.confidence = Math.max(0.0, p.confidence - 0.2);
    savePatterns(patterns);
  }
}

/**
 * Get all high-confidence patterns (>= 0.8) that should be applied eagerly.
 */
export function getEagerPatterns(): FixPattern[] {
  return loadPatterns().filter(p => p.confidence >= 0.8);
}

/**
 * Get patterns sorted by confidence for use during fix search.
 */
export function getSearchPatterns(): FixPattern[] {
  return loadPatterns()
    .filter(p => p.confidence >= 0.3)
    .sort((a, b) => b.confidence - a.confidence);
}
