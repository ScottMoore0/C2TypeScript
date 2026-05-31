// SC-2: Fix engine — pattern-based auto-correction of translation divergences.

export interface Fix {
  name: string;
  description: string;
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  category: string;
}

export interface FixResult {
  applied: string[];
  code: string;
}

/** Apply all matching fixes to a source string. Returns modified code + list of applied fix names. */
export function applyFixes(code: string, fixes: Fix[]): FixResult {
  const applied: string[] = [];
  let current = code;

  for (const fix of fixes) {
    if (fix.pattern.test(current)) {
      current = current.replace(fix.pattern, fix.replacement as string);
      applied.push(fix.name);
    }
  }

  return { applied, code: current };
}

/** Create a fix from a simple find/replace pattern. */
export function simpleFix(name: string, find: RegExp, replace: string, category: string = "general"): Fix {
  return { name, description: name, pattern: find, replacement: replace, category };
}

// --- Built-in fix patterns (common translation divergences) ---

export const BUILTIN_FIXES: Fix[] = [
  simpleFix("integer-division", /(\d+)\s*\/\s*(\d+)/g, "Math.trunc($1 / $2)", "arithmetic"),
  simpleFix("unsigned-shift", /(\w+)\s*>>>\s*0/g, "($1 >>> 0)", "arithmetic"),
  simpleFix("null-check", /(\w+)\s*===\s*null/g, "($1 == null)", "comparison"),
  simpleFix("string-length", /strlen\((\w+)\)/g, "$1.length", "string"),
];

/** Run the self-healing loop: translate → compare → fix → repeat. */
export async function selfHealLoop(
  getTranslated: () => string,
  runOriginal: () => Promise<string>,
  runTranslated: (code: string) => Promise<string>,
  fixes: Fix[],
  maxIterations: number = 10
): Promise<{ converged: boolean; iterations: number; finalCode: string; divergences: string[] }> {
  let code = getTranslated();
  let iterations = 0;
  let lastDivergences: string[] = [];

  while (iterations < maxIterations) {
    iterations++;
    const [origOut, transOut] = await Promise.all([runOriginal(), runTranslated(code)]);

    if (origOut === transOut) {
      return { converged: true, iterations, finalCode: code, divergences: [] };
    }

    const { applied, code: fixed } = applyFixes(code, fixes);
    lastDivergences = origOut.split("\n").filter((l, i) => l !== transOut.split("\n")[i]);

    if (applied.length === 0 || fixed === code) {
      return { converged: false, iterations, finalCode: code, divergences: lastDivergences };
    }

    code = fixed;
  }

  return { converged: false, iterations, finalCode: code, divergences: lastDivergences };
}
