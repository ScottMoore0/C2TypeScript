// Prism M.2 — SDL2 Events.
// Module-level SDL_* event API with a shared event queue that may be fed
// either by InputManager (internal) or by DOM listeners (browser).
//
// In Node, the DOM-listener wiring is a no-op; the queue can still be driven
// via SDL_PushEvent / pollEvent for tests.

import type { InputEvent } from "../adapters.js";

// --- SDL event type constants (match ../display/sdl.ts) ---
export const SDL_FIRSTEVENT = 0x0;
export const SDL_QUIT = 0x100;
export const SDL_WINDOWEVENT = 0x200;
export const SDL_KEYDOWN = 0x300;
export const SDL_KEYUP = 0x301;
export const SDL_TEXTINPUT = 0x303;
export const SDL_MOUSEMOTION = 0x400;
export const SDL_MOUSEBUTTONDOWN = 0x401;
export const SDL_MOUSEBUTTONUP = 0x402;
export const SDL_MOUSEWHEEL = 0x403;

// --- Window event sub-types (SDL_WindowEventID) ---
export const SDL_WINDOWEVENT_SHOWN = 1;
export const SDL_WINDOWEVENT_HIDDEN = 2;
export const SDL_WINDOWEVENT_EXPOSED = 3;
export const SDL_WINDOWEVENT_MOVED = 4;
export const SDL_WINDOWEVENT_RESIZED = 5;
export const SDL_WINDOWEVENT_SIZE_CHANGED = 6;
export const SDL_WINDOWEVENT_MINIMIZED = 7;
export const SDL_WINDOWEVENT_MAXIMIZED = 8;
export const SDL_WINDOWEVENT_RESTORED = 9;
export const SDL_WINDOWEVENT_FOCUS_GAINED = 12;
export const SDL_WINDOWEVENT_FOCUS_LOST = 13;
export const SDL_WINDOWEVENT_CLOSE = 14;

/** SDL_Event union shape (fields populated by event type). */
export interface SDLEvent {
  type: number;
  /** SDL_KEYDOWN / SDL_KEYUP — SDL scancode. */
  key?: number;
  /** Repeat flag for key events. */
  repeat?: number;
  /** SDL_MOUSEMOTION / SDL_MOUSEBUTTON*. */
  x?: number;
  y?: number;
  /** SDL_MOUSEMOTION — relative motion. */
  xrel?: number;
  yrel?: number;
  /** SDL_MOUSEBUTTON* — button index (SDL: 1=left, 2=middle, 3=right). */
  button?: number;
  /** SDL_MOUSEBUTTON* — SDL_PRESSED / SDL_RELEASED. */
  state?: number;
  /** SDL_MOUSEWHEEL — horizontal / vertical scroll amount. */
  wheelX?: number;
  wheelY?: number;
  /** SDL_WINDOWEVENT — sub-event id. */
  windowEvent?: number;
  windowData1?: number;
  windowData2?: number;
  /** SDL_TEXTINPUT — UTF-8 text. */
  text?: string;
  /** Monotonic event timestamp in ms (SDL_GetTicks units). */
  timestamp?: number;
}

// Module-level event queue (shared across SDL_* module API calls).
const eventQueue: SDLEvent[] = [];
/** Optional listener invoked whenever an event is pushed. */
let onPushed: ((ev: SDLEvent) => void) | null = null;

/**
 * SDL_PushEvent — inject an event into the queue.
 * Spec: https://wiki.libsdl.org/SDL2/SDL_PushEvent
 * Returns 1 on success, 0 if dropped by a filter (we have none), -1 on error.
 */
export function SDL_PushEvent(ev: SDLEvent): number {
  if (!ev || typeof ev.type !== "number") return -1;
  const copy: SDLEvent = { ...ev };
  if (copy.timestamp === undefined) copy.timestamp = Math.floor(performance.now());
  eventQueue.push(copy);
  if (onPushed) {
    try { onPushed(copy); } catch { /* ignore listener faults */ }
  }
  return 1;
}

/**
 * SDL_PollEvent — dequeue the next event into `out`. Returns 1 if an event was
 * returned, 0 if the queue was empty.
 * Spec: https://wiki.libsdl.org/SDL2/SDL_PollEvent
 */
export function SDL_PollEvent(out?: SDLEvent): number {
  const ev = eventQueue.shift();
  if (!ev) return 0;
  if (out) Object.assign(out, ev);
  return 1;
}

/**
 * SDL_WaitEvent — cooperative wait: resolves when the next event is pushed.
 * Blocking APIs don't translate directly to JS; we return a Promise that
 * resolves to the next event (matching how translated C code should await).
 * Spec: https://wiki.libsdl.org/SDL2/SDL_WaitEvent
 */
export function SDL_WaitEvent(): Promise<SDLEvent> {
  return new Promise<SDLEvent>((resolve) => {
    if (eventQueue.length > 0) {
      resolve(eventQueue.shift()!);
      return;
    }
    const prev = onPushed;
    onPushed = (ev) => {
      onPushed = prev;
      // Remove from queue (SDL_WaitEvent semantically consumes it).
      const idx = eventQueue.indexOf(ev);
      if (idx >= 0) eventQueue.splice(idx, 1);
      resolve(ev);
      if (prev) { try { prev(ev); } catch { /* ignore */ } }
    };
  });
}

/**
 * SDL_WaitEventTimeout — like SDL_WaitEvent but resolves to 0 on timeout.
 * Spec: https://wiki.libsdl.org/SDL2/SDL_WaitEventTimeout
 */
export function SDL_WaitEventTimeout(timeoutMs: number): Promise<SDLEvent | 0> {
  return new Promise<SDLEvent | 0>((resolve) => {
    if (eventQueue.length > 0) { resolve(eventQueue.shift()!); return; }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const prev = onPushed;
    const restore = () => { onPushed = prev; if (timer) clearTimeout(timer); };
    onPushed = (ev) => {
      restore();
      const idx = eventQueue.indexOf(ev);
      if (idx >= 0) eventQueue.splice(idx, 1);
      resolve(ev);
      if (prev) { try { prev(ev); } catch { /* ignore */ } }
    };
    timer = setTimeout(() => { restore(); resolve(0); }, Math.max(0, timeoutMs));
  });
}

/**
 * SDL_FlushEvent — remove every queued event of the given type.
 * Spec: https://wiki.libsdl.org/SDL2/SDL_FlushEvent
 */
export function SDL_FlushEvent(type: number): void {
  for (let i = eventQueue.length - 1; i >= 0; i--) {
    if (eventQueue[i]!.type === type) eventQueue.splice(i, 1);
  }
}

/**
 * SDL_FlushEvents — remove queued events in [minType, maxType].
 * Spec: https://wiki.libsdl.org/SDL2/SDL_FlushEvents
 */
export function SDL_FlushEvents(minType: number, maxType: number): void {
  for (let i = eventQueue.length - 1; i >= 0; i--) {
    const t = eventQueue[i]!.type;
    if (t >= minType && t <= maxType) eventQueue.splice(i, 1);
  }
}

/**
 * SDL_HasEvent — 1 if queue contains an event of the given type, else 0.
 * Spec: https://wiki.libsdl.org/SDL2/SDL_HasEvent
 */
export function SDL_HasEvent(type: number): number {
  return eventQueue.some(e => e.type === type) ? 1 : 0;
}

/**
 * SDL_HasEvents — 1 if any queued event falls in [minType, maxType].
 * Spec: https://wiki.libsdl.org/SDL2/SDL_HasEvents
 */
export function SDL_HasEvents(minType: number, maxType: number): number {
  return eventQueue.some(e => e.type >= minType && e.type <= maxType) ? 1 : 0;
}

/** Return queued event count (not part of SDL API — internal/test helper). */
export function sdlEventQueueLength(): number {
  return eventQueue.length;
}

/** Drop all events (not part of SDL API — test helper). */
export function sdlEventQueueClear(): void {
  eventQueue.length = 0;
}

// --- InputManager bridge ---
// Convert adapter-level InputEvent to SDLEvent and push onto the SDL queue.
const KEYSYM_REPEAT_FLAG = 1;
function mapInputEvent(ev: InputEvent): SDLEvent | null {
  switch (ev.type) {
    case "quit": return { type: SDL_QUIT };
    case "keydown": return { type: SDL_KEYDOWN, key: ev.key ?? 0, state: 1, repeat: 0 };
    case "keyup": return { type: SDL_KEYUP, key: ev.key ?? 0, state: 0, repeat: 0 };
    case "mousemove": return { type: SDL_MOUSEMOTION, x: ev.x ?? 0, y: ev.y ?? 0, xrel: 0, yrel: 0 };
    case "mousedown": return { type: SDL_MOUSEBUTTONDOWN, x: ev.x ?? 0, y: ev.y ?? 0, button: (ev.button ?? 0) + 1, state: 1 };
    case "mouseup": return { type: SDL_MOUSEBUTTONUP, x: ev.x ?? 0, y: ev.y ?? 0, button: (ev.button ?? 0) + 1, state: 0 };
    default: return null;
  }
}

/**
 * Drain InputManager events into the SDL queue.
 * Useful when both APIs are in use or when bridging DOM listeners.
 */
export function drainInputToSDL(source: { pollEvent(): InputEvent | null }): number {
  let n = 0;
  // Cap at 256 to avoid pathological infinite loops.
  for (let i = 0; i < 256; i++) {
    const ev = source.pollEvent();
    if (!ev) break;
    const sdl = mapInputEvent(ev);
    if (sdl) { SDL_PushEvent(sdl); n++; }
  }
  return n;
}

// --- DOM listener wiring (browser only) ---
export interface DOMEventTargetLike {
  addEventListener(type: string, listener: (ev: any) => void, options?: any): void;
  removeEventListener(type: string, listener: (ev: any) => void, options?: any): void;
}

export interface SDLEventListenerHandle {
  detach(): void;
}

/**
 * Attach DOM keyboard/mouse/window listeners and forward to SDL queue.
 * In Node (no window/document), emits a warning and returns a no-op handle.
 * Spec: SDL2 EventQueue via W3C UI Events — https://www.w3.org/TR/uievents/
 */
export function attachDOMEventListeners(
  windowTarget?: DOMEventTargetLike,
  documentTarget?: DOMEventTargetLike,
  domKeyToScancode?: (code: string) => number,
): SDLEventListenerHandle {
  const G: any = (globalThis as any);
  const win = windowTarget ?? G.window;
  const doc = documentTarget ?? G.document;
  if (!win || !doc) {
    // Node — warn but succeed.
    if (!G.__prismSuppressDOMWarnings) {
      try { (G.console ?? console).warn("[prism] attachDOMEventListeners: no window/document — no-op"); } catch { /* ignore */ }
    }
    return { detach() { /* no-op */ } };
  }
  const keyMap = domKeyToScancode ?? ((_c: string) => 0);

  const onKeyDown = (e: any) => {
    SDL_PushEvent({ type: SDL_KEYDOWN, key: keyMap(e.code ?? ""), state: 1, repeat: e.repeat ? 1 : 0 });
  };
  const onKeyUp = (e: any) => {
    SDL_PushEvent({ type: SDL_KEYUP, key: keyMap(e.code ?? ""), state: 0, repeat: 0 });
  };
  const onMouseMove = (e: any) => {
    SDL_PushEvent({ type: SDL_MOUSEMOTION, x: e.clientX ?? 0, y: e.clientY ?? 0, xrel: e.movementX ?? 0, yrel: e.movementY ?? 0 });
  };
  const onMouseDown = (e: any) => {
    SDL_PushEvent({ type: SDL_MOUSEBUTTONDOWN, x: e.clientX ?? 0, y: e.clientY ?? 0, button: (e.button ?? 0) + 1, state: 1 });
  };
  const onMouseUp = (e: any) => {
    SDL_PushEvent({ type: SDL_MOUSEBUTTONUP, x: e.clientX ?? 0, y: e.clientY ?? 0, button: (e.button ?? 0) + 1, state: 0 });
  };
  const onWheel = (e: any) => {
    SDL_PushEvent({ type: SDL_MOUSEWHEEL, wheelX: e.deltaX ?? 0, wheelY: -(e.deltaY ?? 0) });
  };
  const onClose = () => {
    SDL_PushEvent({ type: SDL_QUIT });
  };
  const onBlur = () => {
    SDL_PushEvent({ type: SDL_WINDOWEVENT, windowEvent: SDL_WINDOWEVENT_FOCUS_LOST });
  };
  const onFocus = () => {
    SDL_PushEvent({ type: SDL_WINDOWEVENT, windowEvent: SDL_WINDOWEVENT_FOCUS_GAINED });
  };
  const onResize = () => {
    SDL_PushEvent({ type: SDL_WINDOWEVENT, windowEvent: SDL_WINDOWEVENT_RESIZED });
  };

  doc.addEventListener("keydown", onKeyDown);
  doc.addEventListener("keyup", onKeyUp);
  doc.addEventListener("mousemove", onMouseMove);
  doc.addEventListener("mousedown", onMouseDown);
  doc.addEventListener("mouseup", onMouseUp);
  doc.addEventListener("wheel", onWheel);
  win.addEventListener("beforeunload", onClose);
  win.addEventListener("blur", onBlur);
  win.addEventListener("focus", onFocus);
  win.addEventListener("resize", onResize);

  return {
    detach() {
      doc.removeEventListener("keydown", onKeyDown);
      doc.removeEventListener("keyup", onKeyUp);
      doc.removeEventListener("mousemove", onMouseMove);
      doc.removeEventListener("mousedown", onMouseDown);
      doc.removeEventListener("mouseup", onMouseUp);
      doc.removeEventListener("wheel", onWheel);
      win.removeEventListener("beforeunload", onClose);
      win.removeEventListener("blur", onBlur);
      win.removeEventListener("focus", onFocus);
      win.removeEventListener("resize", onResize);
    },
  };
}
