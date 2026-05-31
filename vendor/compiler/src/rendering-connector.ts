/**
 * Phase R3: Rendering shim connector.
 * Detects which rendering library the translated project uses and generates
 * the appropriate browser initialization code (canvas, WebGL, DOM, xterm).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export type RenderingLib = "sdl2" | "glut" | "glfw" | "opengl" | "qt" | "ncurses" | "none";

interface DetectionRule {
  lib: RenderingLib;
  indicators: string[];
}

const DETECTION_RULES: DetectionRule[] = [
  { lib: "sdl2",    indicators: ["SDL_CreateWindow", "SDL_Init", "SDL_CreateRenderer", "SDL_SetVideoMode"] },
  { lib: "glut",    indicators: ["glutInit", "glutCreateWindow", "glutMainLoop", "glutDisplayFunc"] },
  { lib: "glfw",    indicators: ["glfwInit", "glfwCreateWindow", "glfwMakeContextCurrent"] },
  { lib: "qt",      indicators: ["QApplication", "QMainWindow", "QWidget", "QDialog"] },
  { lib: "ncurses", indicators: ["initscr", "newwin", "endwin", "mvprintw", "wprintw"] },
  { lib: "opengl",  indicators: ["glBegin", "glVertex", "glClear", "glEnable", "glMatrixMode"] },
];

/**
 * Detect which rendering library the project uses by scanning all .ts files.
 */
export function detectRenderingLib(projectDir: string): RenderingLib {
  const allCode = readAllCode(projectDir);
  if (!allCode) return "none";

  // Score each library by how many of its indicators appear
  let bestLib: RenderingLib = "none";
  let bestScore = 0;

  for (const rule of DETECTION_RULES) {
    const score = rule.indicators.filter(ind => allCode.includes(ind)).length;
    if (score > bestScore) {
      bestScore = score;
      bestLib = rule.lib;
    }
  }

  return bestLib;
}

/**
 * Generate browser initialization code for the detected rendering library.
 * This code is prepended to the bootstrap file.
 */
export function generateRenderingInit(lib: RenderingLib, options?: {
  canvasId?: string;
  width?: number;
  height?: number;
  title?: string;
}): string {
  const canvasId = options?.canvasId ?? "canvas";
  const width = options?.width ?? 800;
  const height = options?.height ?? 600;
  const title = options?.title ?? "src2ts App";

  switch (lib) {
    case "sdl2":
      return generateSdl2Init(canvasId, width, height, title);
    case "glut":
    case "glfw":
    case "opengl":
      return generateWebGLInit(canvasId, width, height, title, lib);
    case "qt":
      return generateQtDomInit(title);
    case "ncurses":
      return generateNcursesInit(width, height);
    case "none":
      return "// No rendering library detected — no initialization needed.\n";
  }
}

function generateSdl2Init(canvasId: string, width: number, height: number, title: string): string {
  return `// SDL2 browser initialization
(() => {
  const canvas = document.getElementById("${canvasId}") as HTMLCanvasElement;
  if (!canvas) throw new Error("Canvas element #${canvasId} not found");
  canvas.width = ${width};
  canvas.height = ${height};
  document.title = ${JSON.stringify(title)};

  const ctx = canvas.getContext("2d")!;
  (globalThis as any).__sdl_canvas = canvas;
  (globalThis as any).__sdl_ctx = ctx;
  (globalThis as any).__sdl_event_queue = [];

  // Capture browser events into SDL-compatible event queue
  const eq = (globalThis as any).__sdl_event_queue;
  canvas.addEventListener("mousedown", e => eq.push({ type: 0x401, button: e.button, x: e.offsetX, y: e.offsetY }));
  canvas.addEventListener("mouseup", e => eq.push({ type: 0x402, button: e.button, x: e.offsetX, y: e.offsetY }));
  canvas.addEventListener("mousemove", e => eq.push({ type: 0x400, x: e.offsetX, y: e.offsetY }));
  document.addEventListener("keydown", e => eq.push({ type: 0x300, key: e.key, code: e.code, repeat: e.repeat }));
  document.addEventListener("keyup", e => eq.push({ type: 0x301, key: e.key, code: e.code }));
  canvas.addEventListener("wheel", e => eq.push({ type: 0x403, deltaX: e.deltaX, deltaY: e.deltaY }));

  // Prevent context menu on right-click
  canvas.addEventListener("contextmenu", e => e.preventDefault());
  // Focus canvas for keyboard events
  canvas.tabIndex = 0;
  canvas.focus();
})();
`;
}

function generateWebGLInit(canvasId: string, width: number, height: number, title: string, lib: string): string {
  return `// ${lib.toUpperCase()} → WebGL browser initialization
(() => {
  const canvas = document.getElementById("${canvasId}") as HTMLCanvasElement;
  if (!canvas) throw new Error("Canvas element #${canvasId} not found");
  canvas.width = ${width};
  canvas.height = ${height};
  document.title = ${JSON.stringify(title)};

  const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  if (!gl) throw new Error("WebGL not supported");
  (globalThis as any).__gl_canvas = canvas;
  (globalThis as any).__gl_context = gl;
  (globalThis as any).__gl_event_queue = [];

  // Capture input events
  const eq = (globalThis as any).__gl_event_queue;
  canvas.addEventListener("mousedown", e => eq.push({ type: "mousedown", button: e.button, x: e.offsetX, y: e.offsetY }));
  canvas.addEventListener("mouseup", e => eq.push({ type: "mouseup", button: e.button, x: e.offsetX, y: e.offsetY }));
  canvas.addEventListener("mousemove", e => eq.push({ type: "mousemove", x: e.offsetX, y: e.offsetY }));
  document.addEventListener("keydown", e => { eq.push({ type: "keydown", key: e.key, code: e.code }); });
  document.addEventListener("keyup", e => { eq.push({ type: "keyup", key: e.key, code: e.code }); });
  canvas.tabIndex = 0;
  canvas.focus();
})();
`;
}

function generateQtDomInit(title: string): string {
  return `// Qt → DOM browser initialization
(() => {
  document.title = ${JSON.stringify(title)};
  const container = document.createElement("div");
  container.id = "qt-root";
  container.style.cssText = "width:100%;height:100vh;position:relative;overflow:auto;font-family:sans-serif;";
  document.body.appendChild(container);
  (globalThis as any).__qt_root = container;
  (globalThis as any).__qt_widgets = new Map();
  (globalThis as any).__qt_widget_id = 0;
})();
`;
}

function generateNcursesInit(width: number, height: number): string {
  return `// ncurses → xterm.js browser initialization
(() => {
  const termDiv = document.createElement("div");
  termDiv.id = "terminal";
  termDiv.style.cssText = "width:100%;height:100vh;background:#000;";
  document.body.innerHTML = "";
  document.body.style.margin = "0";
  document.body.appendChild(termDiv);

  // Grid-based terminal buffer
  const cols = ${Math.floor(width / 8)};
  const rows = ${Math.floor(height / 16)};
  const buffer: string[][] = Array.from({ length: rows }, () => Array(cols).fill(" "));
  const attrBuffer: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  let cursorX = 0, cursorY = 0;

  (globalThis as any).__ncurses_buffer = buffer;
  (globalThis as any).__ncurses_attrs = attrBuffer;
  (globalThis as any).__ncurses_cursor = { x: cursorX, y: cursorY };
  (globalThis as any).__ncurses_cols = cols;
  (globalThis as any).__ncurses_rows = rows;
  (globalThis as any).__ncurses_input_queue = [];
  (globalThis as any).__ncurses_div = termDiv;

  document.addEventListener("keydown", e => {
    (globalThis as any).__ncurses_input_queue.push(e.key);
  });

  // Render function — call after each frame
  (globalThis as any).__ncurses_render = () => {
    const lines = buffer.map(row => row.join(""));
    termDiv.innerHTML = "<pre style='color:#0f0;font-size:14px;line-height:1.2;margin:0;'>" +
      lines.map(l => l.replace(/</g, "&lt;")).join("\\n") + "</pre>";
  };
})();
`;
}

function readAllCode(projectDir: string): string {
  const parts: string[] = [];
  function walk(dir: string): void {
    try {
      for (const entry of readdirSync(dir)) {
        if (["node_modules", "dist", "shims", "runtime", ".git"].includes(entry)) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (!entry.endsWith(".ts") || entry.endsWith(".d.ts")) continue;
        try { parts.push(readFileSync(full, "utf-8")); } catch { /* skip */ }
      }
    } catch { /* unreadable dir */ }
  }
  walk(projectDir);
  return parts.join("\n");
}
