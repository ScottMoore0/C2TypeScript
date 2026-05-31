/**
 * Q1: Thread Pattern Classifier
 *
 * Scans translated TypeScript files for thread creation patterns from C++/C,
 * classifies them, and identifies shared state and synchronization primitives.
 */

export type ThreadPattern = "independent" | "async_io" | "shared_state";

export interface ThreadInfo {
  functionName: string;
  file: string;
  pattern: ThreadPattern;
  sharedVars: string[];
  syncPrimitives: string[];
}

/** Patterns that indicate thread creation in the original C++/C code */
const THREAD_CREATION_PATTERNS = [
  /std::thread\s+\w+\s*\(\s*(\w+)/g,
  /std_thread\s*\(\s*(\w+)/g,
  /pthread_create\s*\([^,]*,\s*[^,]*,\s*(\w+)/g,
  /CreateThread\s*\([^,]*,\s*[^,]*,\s*(\w+)/g,
  /std::async\s*\([^,]*,?\s*(\w+)/g,
  /std_async\s*\([^,]*,?\s*(\w+)/g,
  /new\s+Worker\s*\(\s*["']([^"']+)/g,
];

/** Patterns indicating synchronization primitives */
const SYNC_PATTERNS = [
  /std::mutex/g,
  /std::lock_guard/g,
  /std::unique_lock/g,
  /std::shared_mutex/g,
  /std::condition_variable/g,
  /std::atomic/g,
  /pthread_mutex/g,
  /pthread_cond/g,
  /CRITICAL_SECTION/g,
  /EnterCriticalSection/g,
  /LeaveCriticalSection/g,
  /Atomics\./g,
];

/** Patterns indicating blocking I/O calls */
const IO_PATTERNS = [
  /\bread\b/g,
  /\bwrite\b/g,
  /\brecv\b/g,
  /\bsend\b/g,
  /\bsleep\b/g,
  /\baccept\b/g,
  /\bconnect\b/g,
  /\bselect\b/g,
  /\bpoll\b/g,
  /\bfread\b/g,
  /\bfwrite\b/g,
  /\bfgets\b/g,
];

/**
 * Extract all function bodies from a TypeScript source.
 * Returns a map of function name to its body text.
 */
function extractFunctions(source: string): Map<string, string> {
  const functions = new Map<string, string>();
  const funcRegex = /(?:async\s+)?function\*?\s+(\w+)\s*\([^)]*\)[^{]*\{/g;
  let match: RegExpExecArray | null;

  while ((match = funcRegex.exec(source)) !== null) {
    const name = match[1];
    const startIdx = match.index + match[0].length;
    let braceCount = 1;
    let i = startIdx;
    while (i < source.length && braceCount > 0) {
      if (source[i] === "{") braceCount++;
      else if (source[i] === "}") braceCount--;
      i++;
    }
    functions.set(name, source.slice(startIdx, i - 1));
  }

  return functions;
}

/**
 * Find all variable names accessed in a block of code.
 */
function findAccessedVars(code: string): Set<string> {
  const vars = new Set<string>();
  const varRegex = /\b([a-zA-Z_]\w*)\b/g;
  const keywords = new Set([
    "function", "const", "let", "var", "if", "else", "for", "while", "do",
    "return", "break", "continue", "switch", "case", "default", "class",
    "new", "delete", "typeof", "instanceof", "void", "null", "undefined",
    "true", "false", "this", "super", "import", "export", "async", "await",
    "yield", "try", "catch", "finally", "throw", "number", "string", "boolean",
  ]);
  let m: RegExpExecArray | null;
  while ((m = varRegex.exec(code)) !== null) {
    if (!keywords.has(m[1])) {
      vars.add(m[1]);
    }
  }
  return vars;
}

/**
 * Count regex matches in a string.
 */
function countMatches(code: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) count++;
  }
  return count;
}

/**
 * Scan a translated TypeScript file for thread creation patterns and classify them.
 */
export function classifyThreads(source: string, filePath: string): ThreadInfo[] {
  const results: ThreadInfo[] = [];
  const functions = extractFunctions(source);
  const threadFuncNames = new Set<string>();

  // Find all thread function names
  for (const pattern of THREAD_CREATION_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) {
      threadFuncNames.add(match[1]);
    }
  }

  if (threadFuncNames.size === 0) return results;

  // Build a map of all variables accessed by non-thread functions
  const nonThreadVars = new Set<string>();
  for (const [name, body] of functions) {
    if (!threadFuncNames.has(name)) {
      for (const v of findAccessedVars(body)) {
        nonThreadVars.add(v);
      }
    }
  }

  // Classify each thread function
  for (const threadFuncName of threadFuncNames) {
    const body = functions.get(threadFuncName) ?? "";
    const accessedVars = findAccessedVars(body);

    // Find shared variables (accessed by both thread func and other functions)
    const sharedVars: string[] = [];
    for (const v of accessedVars) {
      if (nonThreadVars.has(v)) {
        sharedVars.push(v);
      }
    }

    // Find sync primitives used
    const syncPrimitives: string[] = [];
    for (const pattern of SYNC_PATTERNS) {
      const re = new RegExp(pattern.source, pattern.flags);
      if (re.test(body) || re.test(source)) {
        syncPrimitives.push(pattern.source.replace(/\\b/g, "").replace(/\\\./g, "."));
      }
    }

    // Classify the pattern
    let threadPattern: ThreadPattern;
    if (sharedVars.length === 0 && syncPrimitives.length === 0) {
      threadPattern = "independent";
    } else if (countMatches(body, IO_PATTERNS) > countMatches(body, SYNC_PATTERNS)) {
      threadPattern = "async_io";
    } else {
      threadPattern = "shared_state";
    }

    results.push({
      functionName: threadFuncName,
      file: filePath,
      pattern: threadPattern,
      sharedVars,
      syncPrimitives,
    });
  }

  return results;
}
