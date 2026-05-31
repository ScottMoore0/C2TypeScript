/**
 * Protobuf direct translation: converts .proto files to TypeScript
 * using protobufjs-cli, bypassing C++ codegen entirely.
 */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

export function translateProtoToTS(protoPath: string, outDir: string): string | null {
  // protobufjs can generate TS directly from .proto files
  // This avoids needing protoc + C++ codegen entirely
  const outBase = basename(protoPath).replace(/\.proto$/, '');
  const jsOut = join(outDir, `${outBase}.js`);
  const tsOut = join(outDir, `${outBase}.ts`);
  try {
    // Try pbjs (protobufjs CLI) first
    execSync(`npx pbjs -t static-module -w es6 -o "${jsOut}" "${protoPath}"`, { timeout: 30000 });
    execSync(`npx pbts -o "${tsOut}" "${jsOut}"`, { timeout: 30000 });
    return tsOut;
  } catch {
    // If protobufjs not available, generate a basic stub
    return null;
  }
}

export function detectProtoFiles(projectDir: string): string[] {
  const protos: string[] = [];
  function scan(dir: string) {
    try {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        try {
          const s = statSync(full);
          if (s.isDirectory() && !['node_modules', '.git', 'build'].includes(entry)) scan(full);
          else if (entry.endsWith('.proto')) protos.push(full);
        } catch {}
      }
    } catch {}
  }
  scan(projectDir);
  return protos;
}
