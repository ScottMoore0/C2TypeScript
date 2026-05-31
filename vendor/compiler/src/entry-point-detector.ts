/**
 * Phase R1: Entry point detector.
 * Scans translated .ts files to find the project's entry point,
 * classify it as CLI/GUI/library, and identify the entry function.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface EntryPoint {
  entryFile: string;       // path relative to projectDir
  entryFunction: string;   // "main", "WinMain", "SDL_main", etc.
  type: "cli" | "gui" | "library";
}

const ENTRY_FUNCTIONS = [
  "main", "WinMain", "wWinMain", "SDL_main", "wmain", "_tmain",
];

const GUI_INDICATORS = [
  "SDL_Init", "SDL_CreateWindow", "SDL_CreateRenderer",
  "glutInit", "glutCreateWindow", "glutMainLoop",
  "glfwInit", "glfwCreateWindow",
  "QApplication", "QMainWindow", "QWidget",
  "initscr", "newwin", "endwin",
  "glBegin", "glVertex", "glClear", "glEnable",
  "GLUT_", "GL_",
  "CreateWindowEx", "ShowWindow", "GetMessage",
  "XOpenDisplay", "XCreateWindow",
  "cairo_create", "gtk_init",
];

/**
 * Detect the entry point of a translated TypeScript project.
 */
export function detectEntryPoint(projectDir: string): EntryPoint {
  const tsFiles = listTsFiles(projectDir);
  if (tsFiles.length === 0) {
    return { entryFile: "main.ts", entryFunction: "main", type: "cli" };
  }

  // Read all files once
  const fileContents = new Map<string, string>();
  for (const f of tsFiles) {
    try { fileContents.set(f, readFileSync(f, "utf-8")); } catch { /* skip */ }
  }

  // Pass 1: find explicit entry function definitions
  let entryFile: string | null = null;
  let entryFunction = "main";

  for (const funcName of ENTRY_FUNCTIONS) {
    for (const [f, code] of fileContents) {
      const re = new RegExp(`(?:export\\s+)?function\\s+${funcName}\\s*\\(`);
      if (re.test(code)) {
        entryFile = f;
        entryFunction = funcName;
        break;
      }
    }
    if (entryFile) break;
  }

  // Pass 2: look for process.exit(main()) pattern (common in our translations)
  if (!entryFile) {
    for (const [f, code] of fileContents) {
      if (/process\.exit\(\w+\(/.test(code)) {
        entryFile = f;
        break;
      }
    }
  }

  // Pass 3: file named main.ts
  if (!entryFile) {
    for (const f of tsFiles) {
      if (f.replace(/\\/g, "/").endsWith("/main.ts")) {
        entryFile = f;
        break;
      }
    }
  }

  // Pass 4: file with the most top-level executable statements
  if (!entryFile) {
    let best = tsFiles[0];
    let bestScore = 0;
    for (const [f, code] of fileContents) {
      const score = countTopLevelStatements(code);
      if (score > bestScore) { bestScore = score; best = f; }
    }
    entryFile = best;
  }

  // Classify as GUI or CLI
  const allCode = [...fileContents.values()].join("\n");
  const isGui = GUI_INDICATORS.some(g => allCode.includes(g));

  // Detect library: no entry function and no top-level executable code
  const entryCode = fileContents.get(entryFile!) ?? "";
  const hasEntryFunc = ENTRY_FUNCTIONS.some(fn =>
    new RegExp(`function\\s+${fn}\\s*\\(`).test(entryCode)
  );
  const hasTopLevel = countTopLevelStatements(entryCode) > 2;
  const isLibrary = !hasEntryFunc && !hasTopLevel;

  const type: EntryPoint["type"] = isLibrary ? "library" : isGui ? "gui" : "cli";

  return {
    entryFile: relative(projectDir, entryFile!).replace(/\\/g, "/"),
    entryFunction,
    type,
  };
}

/**
 * Count top-level executable statements (heuristic).
 * Excludes imports, exports, type/interface declarations, and function/class definitions.
 */
function countTopLevelStatements(code: string): number {
  const lines = code.split("\n");
  let count = 0;
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (depth === 0) {
      const isDecl = /^(import |export (type |interface |function |class |const |let |var |enum |default ))/.test(trimmed);
      const isFuncOrClass = /^(function |class |interface |type |enum |\/\*|\/\/|\*|$)/.test(trimmed);
      const isExport = trimmed === "}" || trimmed === "";
      if (!isDecl && !isFuncOrClass && !isExport && trimmed.length > 0) {
        count++;
      }
    }
    depth += (line.match(/\{/g) || []).length;
    depth -= (line.match(/\}/g) || []).length;
    if (depth < 0) depth = 0;
  }
  return count;
}

/** Legacy compatibility: generate a runner import line. */
export function generateRunner(entry: EntryPoint): string {
  return `import "./${entry.entryFile.replace(/\.ts$/, ".js")}";\n`;
}

function listTsFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (["node_modules", "dist", "shims", "runtime", ".git"].includes(entry)) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) results.push(...listTsFiles(full));
      else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) results.push(full);
    }
  } catch { /* directory unreadable */ }
  return results;
}
