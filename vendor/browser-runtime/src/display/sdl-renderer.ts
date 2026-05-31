// Prism — SDL2 renderer draw API (module-level).
// Spec: https://wiki.libsdl.org/SDL2/CategoryRender
//
// Models SDL_Renderer as a state machine plus a command queue.  This is the
// shape expected by translated C code that called SDL_CreateRenderer /
// SDL_RenderCopy / SDL_RenderPresent etc.  The existing class-based SDL
// facade in sdl.ts remains usable; this module provides the stand-alone
// functions that most translated games call directly.
//
// In Node the command queue is recorded (tests assert against it).  In a
// browser environment, an adapter can drain the queue onto a Canvas2D or
// WebGL context — the queue is the portable interface.

import { SDLSurface, SDLTexture, type SDLWindow } from "./sdl.js";

// --- Renderer flag constants (spec: SDL_RendererFlags) --------------------
// https://wiki.libsdl.org/SDL2/SDL_RendererFlags
export const SDL_RENDERER_SOFTWARE = 0x00000001;
export const SDL_RENDERER_ACCELERATED = 0x00000002;
export const SDL_RENDERER_PRESENTVSYNC = 0x00000004;
export const SDL_RENDERER_TARGETTEXTURE = 0x00000008;

// --- Flip enum (spec: SDL_RendererFlip) -----------------------------------
// https://wiki.libsdl.org/SDL2/SDL_RendererFlip
export const SDL_FLIP_NONE = 0x0;
export const SDL_FLIP_HORIZONTAL = 0x1;
export const SDL_FLIP_VERTICAL = 0x2;

export interface SDLPoint { x: number; y: number; }
export interface SDLRect { x: number; y: number; w: number; h: number; }

export type SDLRenderCommand =
  | { op: "clear"; color: [number, number, number, number] }
  | { op: "drawPoint"; x: number; y: number; color: [number, number, number, number] }
  | { op: "drawLine"; x1: number; y1: number; x2: number; y2: number; color: [number, number, number, number] }
  | { op: "drawRect"; rect: SDLRect; color: [number, number, number, number] }
  | { op: "fillRect"; rect: SDLRect; color: [number, number, number, number] }
  | { op: "copy"; texture: SDLTexture; src: SDLRect | null; dst: SDLRect | null }
  | { op: "copyEx"; texture: SDLTexture; src: SDLRect | null; dst: SDLRect | null; angle: number; center: SDLPoint | null; flip: number }
  | { op: "present" }
  | { op: "setTarget"; texture: SDLTexture | null }
  | { op: "setViewport"; rect: SDLRect | null }
  | { op: "setClipRect"; rect: SDLRect | null };

/** Renderer state (spec: SDL_Renderer) — https://wiki.libsdl.org/SDL2/SDL_Renderer */
export interface SDLRenderer2 {
  window: SDLWindow | null;
  flags: number;
  drawColor: [number, number, number, number];
  target: SDLTexture | null;
  viewport: SDLRect | null;
  clipRect: SDLRect | null;
  commands: SDLRenderCommand[];
  destroyed: boolean;
}

// --- SDL_CreateRenderer (spec) -------------------------------------------
// https://wiki.libsdl.org/SDL2/SDL_CreateRenderer
export function SDL_CreateRenderer(window: SDLWindow | null, _index: number, flags: number): SDLRenderer2 {
  return {
    window,
    flags,
    drawColor: [0, 0, 0, 255],
    target: null,
    viewport: null,
    clipRect: null,
    commands: [],
    destroyed: false,
  };
}

// https://wiki.libsdl.org/SDL2/SDL_DestroyRenderer
export function SDL_DestroyRenderer(r: SDLRenderer2): void {
  r.destroyed = true;
  r.commands.length = 0;
}

// https://wiki.libsdl.org/SDL2/SDL_SetRenderDrawColor
export function SDL_SetRenderDrawColor(r: SDLRenderer2, red: number, green: number, blue: number, alpha: number): number {
  r.drawColor = [red & 0xFF, green & 0xFF, blue & 0xFF, alpha & 0xFF];
  return 0;
}

// https://wiki.libsdl.org/SDL2/SDL_GetRenderDrawColor
export function SDL_GetRenderDrawColor(r: SDLRenderer2): { r: number; g: number; b: number; a: number } {
  return { r: r.drawColor[0], g: r.drawColor[1], b: r.drawColor[2], a: r.drawColor[3] };
}

// https://wiki.libsdl.org/SDL2/SDL_RenderClear
export function SDL_RenderClear(r: SDLRenderer2): number {
  r.commands.push({ op: "clear", color: [...r.drawColor] });
  return 0;
}

// https://wiki.libsdl.org/SDL2/SDL_RenderDrawPoint
export function SDL_RenderDrawPoint(r: SDLRenderer2, x: number, y: number): number {
  r.commands.push({ op: "drawPoint", x, y, color: [...r.drawColor] });
  return 0;
}
// https://wiki.libsdl.org/SDL2/SDL_RenderDrawPoints
export function SDL_RenderDrawPoints(r: SDLRenderer2, points: SDLPoint[], count: number): number {
  for (let i = 0; i < count; i++) {
    const p = points[i]!;
    r.commands.push({ op: "drawPoint", x: p.x, y: p.y, color: [...r.drawColor] });
  }
  return 0;
}

// https://wiki.libsdl.org/SDL2/SDL_RenderDrawLine
export function SDL_RenderDrawLine(r: SDLRenderer2, x1: number, y1: number, x2: number, y2: number): number {
  r.commands.push({ op: "drawLine", x1, y1, x2, y2, color: [...r.drawColor] });
  return 0;
}
// https://wiki.libsdl.org/SDL2/SDL_RenderDrawLines
export function SDL_RenderDrawLines(r: SDLRenderer2, points: SDLPoint[], count: number): number {
  // A polyline through count points == count-1 line segments.
  for (let i = 0; i + 1 < count; i++) {
    const a = points[i]!, b = points[i + 1]!;
    r.commands.push({ op: "drawLine", x1: a.x, y1: a.y, x2: b.x, y2: b.y, color: [...r.drawColor] });
  }
  return 0;
}

// https://wiki.libsdl.org/SDL2/SDL_RenderDrawRect
export function SDL_RenderDrawRect(r: SDLRenderer2, rect: SDLRect | null): number {
  const rr = rect ?? fullRect(r);
  r.commands.push({ op: "drawRect", rect: rr, color: [...r.drawColor] });
  return 0;
}
// https://wiki.libsdl.org/SDL2/SDL_RenderDrawRects
export function SDL_RenderDrawRects(r: SDLRenderer2, rects: SDLRect[], count: number): number {
  for (let i = 0; i < count; i++) {
    r.commands.push({ op: "drawRect", rect: rects[i]!, color: [...r.drawColor] });
  }
  return 0;
}

// https://wiki.libsdl.org/SDL2/SDL_RenderFillRect
export function SDL_RenderFillRect(r: SDLRenderer2, rect: SDLRect | null): number {
  const rr = rect ?? fullRect(r);
  r.commands.push({ op: "fillRect", rect: rr, color: [...r.drawColor] });
  return 0;
}
// https://wiki.libsdl.org/SDL2/SDL_RenderFillRects
export function SDL_RenderFillRects(r: SDLRenderer2, rects: SDLRect[], count: number): number {
  for (let i = 0; i < count; i++) {
    r.commands.push({ op: "fillRect", rect: rects[i]!, color: [...r.drawColor] });
  }
  return 0;
}

// https://wiki.libsdl.org/SDL2/SDL_RenderCopy
export function SDL_RenderCopy(r: SDLRenderer2, texture: SDLTexture, srcrect: SDLRect | null, dstrect: SDLRect | null): number {
  r.commands.push({ op: "copy", texture, src: srcrect, dst: dstrect });
  return 0;
}
// https://wiki.libsdl.org/SDL2/SDL_RenderCopyEx
export function SDL_RenderCopyEx(r: SDLRenderer2, texture: SDLTexture, srcrect: SDLRect | null, dstrect: SDLRect | null, angle: number, center: SDLPoint | null, flip: number): number {
  r.commands.push({ op: "copyEx", texture, src: srcrect, dst: dstrect, angle, center, flip });
  return 0;
}

// https://wiki.libsdl.org/SDL2/SDL_RenderPresent
export function SDL_RenderPresent(r: SDLRenderer2): void {
  r.commands.push({ op: "present" });
}

// https://wiki.libsdl.org/SDL2/SDL_SetRenderTarget
export function SDL_SetRenderTarget(r: SDLRenderer2, texture: SDLTexture | null): number {
  r.target = texture;
  r.commands.push({ op: "setTarget", texture });
  return 0;
}
// https://wiki.libsdl.org/SDL2/SDL_GetRenderTarget
export function SDL_GetRenderTarget(r: SDLRenderer2): SDLTexture | null {
  return r.target;
}

// https://wiki.libsdl.org/SDL2/SDL_RenderReadPixels
export function SDL_RenderReadPixels(_r: SDLRenderer2, rect: SDLRect | null, _format: number, pixels: Uint8Array, _pitch: number): number {
  // No actual framebuffer in headless Node — zero-fill the output buffer for
  // the requested region so callers can verify dimensions and pitch.
  const bytes = rect ? rect.w * rect.h * 4 : pixels.length;
  for (let i = 0; i < Math.min(bytes, pixels.length); i++) pixels[i] = 0;
  return 0;
}

// https://wiki.libsdl.org/SDL2/SDL_RenderSetViewport
export function SDL_RenderSetViewport(r: SDLRenderer2, rect: SDLRect | null): number {
  r.viewport = rect;
  r.commands.push({ op: "setViewport", rect });
  return 0;
}
// https://wiki.libsdl.org/SDL2/SDL_RenderGetViewport
export function SDL_RenderGetViewport(r: SDLRenderer2, out: SDLRect): void {
  const v = r.viewport ?? fullRect(r);
  out.x = v.x; out.y = v.y; out.w = v.w; out.h = v.h;
}
// https://wiki.libsdl.org/SDL2/SDL_RenderSetClipRect
export function SDL_RenderSetClipRect(r: SDLRenderer2, rect: SDLRect | null): number {
  r.clipRect = rect;
  r.commands.push({ op: "setClipRect", rect });
  return 0;
}
// https://wiki.libsdl.org/SDL2/SDL_RenderGetClipRect
export function SDL_RenderGetClipRect(r: SDLRenderer2, out: SDLRect): void {
  const c = r.clipRect ?? fullRect(r);
  out.x = c.x; out.y = c.y; out.w = c.w; out.h = c.h;
}

function fullRect(r: SDLRenderer2): SDLRect {
  if (r.target) return { x: 0, y: 0, w: r.target.w, h: r.target.h };
  const w = r.window?.width ?? 0;
  const h = r.window?.height ?? 0;
  return { x: 0, y: 0, w, h };
}

// --- Texture lifecycle (minimal; full surface/pixel-format set lives in sdl.ts) ---
// https://wiki.libsdl.org/SDL2/SDL_CreateTexture
export function SDL_CreateTexture(_r: SDLRenderer2, _format: number, _access: number, w: number, h: number): SDLTexture {
  return new SDLTexture(w, h);
}
// https://wiki.libsdl.org/SDL2/SDL_CreateTextureFromSurface
export function SDL_CreateTextureFromSurface(_r: SDLRenderer2, surface: SDLSurface): SDLTexture {
  return new SDLTexture(surface.w, surface.h, surface.pixels);
}
// https://wiki.libsdl.org/SDL2/SDL_DestroyTexture
export function SDL_DestroyTexture(_t: SDLTexture): void { /* no-op */ }
