import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname, basename } from 'path';

export function runFlex(lexFile: string, outDir: string): string | null {
  const outFile = join(outDir, 'lex.yy.c');
  try {
    execSync(`flex -o "${outFile}" "${lexFile}"`, { timeout: 30000, stdio: 'pipe' });
    return outFile;
  } catch {
    console.warn(`flex not available or failed for ${lexFile}`);
    return null;
  }
}

export function runBison(yaccFile: string, outDir: string): { source: string | null; header: string | null } {
  const baseName = basename(yaccFile).replace(/\.(y|yacc|yy)$/, '');
  const outSource = join(outDir, `${baseName}.tab.c`);
  const outHeader = join(outDir, `${baseName}.tab.h`);
  try {
    execSync(`bison -d -o "${outSource}" "${yaccFile}"`, { timeout: 30000, stdio: 'pipe' });
    return {
      source: existsSync(outSource) ? outSource : null,
      header: existsSync(outHeader) ? outHeader : null
    };
  } catch {
    console.warn(`bison not available or failed for ${yaccFile}`);
    return { source: null, header: null };
  }
}

export function processGeneratedSources(projectDir: string, generatedFiles: string[]): string[] {
  const results: string[] = [];
  const outDir = join(projectDir, '_generated');
  try { require('fs').mkdirSync(outDir, { recursive: true }); } catch {}

  for (const file of generatedFiles) {
    if (file.endsWith('.l') || file.endsWith('.lex')) {
      const out = runFlex(file, outDir);
      if (out) results.push(out);
    }
    if (file.endsWith('.y') || file.endsWith('.yacc') || file.endsWith('.yy')) {
      const { source, header } = runBison(file, outDir);
      if (source) results.push(source);
      if (header) results.push(header);
    }
  }

  return results;
}
