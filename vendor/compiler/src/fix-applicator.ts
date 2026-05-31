/**
 * fix-applicator.ts - Applies fixes to TypeScript source code
 */

import { Fix, Diagnosis } from './fix-table';

/**
 * Apply a single fix to the given TypeScript code at the diagnosed line.
 * Lines are 1-indexed (matching source map / diagnosis conventions).
 */
export function applyFix(tsCode: string, fix: Fix, diagnosis: Diagnosis): string {
  const lines = tsCode.split('\n');
  const lineIndex = diagnosis.line - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) {
    // Line out of range, return code unchanged
    return tsCode;
  }

  const originalLine = lines[lineIndex];
  const fixedLine = fix.transform(originalLine, diagnosis.line);
  lines[lineIndex] = fixedLine;

  return lines.join('\n');
}

/**
 * Apply multiple fixes to the given TypeScript code.
 * Fixes are sorted by line number (descending) so that line-number shifts
 * from multi-line transforms do not invalidate subsequent fix targets.
 */
export function applyAllFixes(
  tsCode: string,
  fixes: Array<{ fix: Fix; diagnosis: Diagnosis }>
): string {
  // Sort by line descending so later fixes don't shift earlier line numbers
  const sorted = [...fixes].sort((a, b) => b.diagnosis.line - a.diagnosis.line);

  let result = tsCode;
  for (const { fix, diagnosis } of sorted) {
    result = applyFix(result, fix, diagnosis);
  }

  return result;
}
