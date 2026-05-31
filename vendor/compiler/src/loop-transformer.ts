/**
 * Phase R2: Loop transformer.
 * Detects main-loop patterns in the entry point and transforms them
 * into requestAnimationFrame-based tick functions for browser execution.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { EntryPoint } from "./entry-point-detector.js";

export interface LoopTransformResult {
  transformed: boolean;
  originalPattern: string | null;
  tickFunctionName: string;
  code: string;  // the transformed code (full file)
}

/** Patterns that indicate an infinite/game loop */
const LOOP_PATTERNS = [
  /^(\s*)(while\s*\(\s*(true|1|running|!quit|!done|!exit_flag|gameRunning|is_running)\s*\))\s*\{/,
  /^(\s*)(for\s*\(\s*;;\s*\))\s*\{/,
  /^(\s*)(while\s*\(\s*!\s*\w+\s*\))\s*\{/,
  /^(\s*)(do\s*)\{/,
  /^(\s*)(while\s*\(\s*SDL_WaitEvent\s*\()/,
  /^(\s*)(while\s*\(\s*GetMessage\s*\()/,
  /^(\s*)(while\s*\(\s*XNextEvent\s*\()/,
];

/** Calls that indicate a rendering/event loop body */
const LOOP_BODY_INDICATORS = [
  "SDL_PollEvent", "SDL_RenderPresent", "SDL_RenderClear", "SDL_UpdateWindowSurface",
  "glutMainLoopEvent", "glutSwapBuffers", "glutPostRedisplay",
  "glfwPollEvents", "glfwSwapBuffers",
  "QApplication::processEvents", "processEvents",
  "glFlush", "glSwapBuffers", "SwapBuffers",
  "XNextEvent", "XPending",
  "refresh", "wrefresh", "doupdate",  // ncurses
  "draw", "render", "update",  // generic
];

/** Calls to remove from the loop body (blocking/delay calls) */
const DELAY_CALLS = [
  "SDL_Delay", "Sleep", "sleep", "usleep", "nanosleep",
  "glfwWaitEvents", "glutIdleFunc",
  "Atomics.wait",
];

/**
 * Transform the entry point file's main loop into a tick function.
 * For CLI apps, returns the code unchanged.
 */
export function transformMainLoop(
  projectDir: string,
  entry: EntryPoint,
): LoopTransformResult {
  if (entry.type === "cli" || entry.type === "library") {
    return { transformed: false, originalPattern: null, tickFunctionName: "", code: "" };
  }

  const filePath = join(projectDir, entry.entryFile);
  let code: string;
  try {
    code = readFileSync(filePath, "utf-8");
  } catch {
    return { transformed: false, originalPattern: null, tickFunctionName: "", code: "" };
  }

  const lines = code.split("\n");
  const detection = findMainLoop(lines);
  if (!detection) {
    return { transformed: false, originalPattern: null, tickFunctionName: "", code };
  }

  // Extract loop body
  const bodyLines = lines.slice(detection.bodyStart, detection.bodyEnd);

  // Filter out delay/sleep calls
  const filteredBody = bodyLines.filter(line => {
    const trimmed = line.trim();
    return !DELAY_CALLS.some(dc => trimmed.startsWith(dc + "(") || trimmed.includes(dc + "("));
  });

  // Determine the condition variable for stopping
  const condVar = detection.conditionVar;
  const stopCheck = condVar && condVar !== "true" && condVar !== "1"
    ? `  if (!(${condVar})) return;\n`
    : "";

  const tickName = "_tick";
  const tickFunction = [
    `function ${tickName}(): void {`,
    ...filteredBody,
    stopCheck ? stopCheck : "",
    `  requestAnimationFrame(${tickName});`,
    `}`,
    `${tickName}();`,
  ].filter(l => l !== "").join("\n");

  // Replace the loop with the tick function
  const before = lines.slice(0, detection.loopStart).join("\n");
  const after = lines.slice(detection.loopEnd + 1).join("\n");
  const transformed = before + "\n" + tickFunction + "\n" + after;

  return {
    transformed: true,
    originalPattern: detection.pattern,
    tickFunctionName: tickName,
    code: transformed,
  };
}

interface LoopDetection {
  loopStart: number;
  bodyStart: number;
  bodyEnd: number;
  loopEnd: number;
  pattern: string;
  conditionVar: string | null;
}

/** Indicators that the loop is a server/network loop (not a GUI/rendering loop) */
const SERVER_LOOP_INDICATORS = [
  "accept", "recv", "send", "listen", "select(", "poll(", "epoll_wait",
  "read(", "write(", "recvfrom", "sendto", "getaddrinfo",
];

/** Check if a code block contains server loop patterns */
function isServerLoop(code: string): boolean {
  return SERVER_LOOP_INDICATORS.some(ind => code.includes(ind)) &&
    !LOOP_BODY_INDICATORS.some(ind => code.includes(ind));
}

/**
 * Transform a server-style loop to use setTimeout instead of requestAnimationFrame.
 * Server loops don't need 60fps rendering; they just need periodic polling.
 */
export function transformServerLoop(code: string): string {
  const lines = code.split("\n");
  const detection = findMainLoop(lines);
  if (!detection) return code;

  const bodyLines = lines.slice(detection.bodyStart, detection.bodyEnd);
  const filteredBody = bodyLines.filter(line => {
    const trimmed = line.trim();
    return !DELAY_CALLS.some(dc => trimmed.startsWith(dc + "(") || trimmed.includes(dc + "("));
  });

  const condVar = detection.conditionVar;
  const stopCheck = condVar && condVar !== "true" && condVar !== "1"
    ? `  if (!(${condVar})) return;\n`
    : "";

  const tickName = "_serverTick";
  const tickFunction = [
    `function ${tickName}(): void {`,
    ...filteredBody,
    stopCheck ? stopCheck : "",
    `  setTimeout(${tickName}, 0);`,
    `}`,
    `${tickName}();`,
  ].filter(l => l !== "").join("\n");

  const before = lines.slice(0, detection.loopStart).join("\n");
  const after = lines.slice(detection.loopEnd + 1).join("\n");
  return before + "\n" + tickFunction + "\n" + after;
}

function findMainLoop(lines: string[]): LoopDetection | null {
  for (let i = 0; i < lines.length; i++) {
    for (const pat of LOOP_PATTERNS) {
      const match = lines[i].match(pat);
      if (!match) continue;

      // Find matching closing brace
      let depth = 1;
      let endLine = i;
      for (let j = i + 1; j < lines.length && depth > 0; j++) {
        depth += (lines[j].match(/\{/g) || []).length;
        depth -= (lines[j].match(/\}/g) || []).length;
        if (depth === 0) { endLine = j; break; }
      }

      // Check if body has rendering/event indicators
      const bodyText = lines.slice(i + 1, endLine).join("\n");
      const hasIndicator = LOOP_BODY_INDICATORS.some(ind => bodyText.includes(ind));

      if (hasIndicator || endLine - i > 15) {
        // Extract condition variable
        let condVar: string | null = null;
        const condMatch = match[2].match(/while\s*\(\s*(!?\w+)\s*\)/);
        if (condMatch) condVar = condMatch[1];
        if (condVar === "true" || condVar === "1") condVar = null;

        return {
          loopStart: i,
          bodyStart: i + 1,
          bodyEnd: endLine,
          loopEnd: endLine,
          pattern: match[2],
          conditionVar: condVar,
        };
      }
    }
  }
  return null;
}
