import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';

export function findQObjectHeaders(projectDir: string): string[] {
  const headers: string[] = [];
  function scan(dir: string) {
    try {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        try {
          const stat = require('fs').statSync(full);
          if (stat.isDirectory() && !['node_modules', '.git', 'build', 'dist'].includes(entry)) {
            scan(full);
          } else if (/\.(h|hpp|hxx)$/.test(entry)) {
            const content = readFileSync(full, 'utf-8');
            if (/\bQ_OBJECT\b/.test(content)) {
              headers.push(full);
            }
          }
        } catch {}
      }
    } catch {}
  }
  scan(projectDir);
  return headers;
}

export function runMoc(headerFile: string, outDir: string): string | null {
  const outFile = join(outDir, `moc_${basename(headerFile).replace(/\.(h|hpp|hxx)$/, '.cpp')}`);
  try {
    execSync(`moc "${headerFile}" -o "${outFile}"`, { timeout: 30000, stdio: 'pipe' });
    return outFile;
  } catch {
    console.warn(`Qt moc not available or failed for ${headerFile}. Skipping moc generation.`);
    return null;
  }
}

export function processQtHeaders(projectDir: string): string[] {
  const headers = findQObjectHeaders(projectDir);
  if (headers.length === 0) return [];

  const outDir = join(projectDir, '_generated');
  try { require('fs').mkdirSync(outDir, { recursive: true }); } catch {}

  const results: string[] = [];
  for (const header of headers) {
    const out = runMoc(header, outDir);
    if (out) results.push(out);
  }
  return results;
}
