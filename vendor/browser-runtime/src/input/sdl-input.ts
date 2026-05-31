// Prism — SDL2 input + timing primitives (module-level).
// Spec: https://wiki.libsdl.org/SDL2/CategoryKeyboard
//       https://wiki.libsdl.org/SDL2/CategoryMouse
//       https://wiki.libsdl.org/SDL2/CategoryTimer
//
// These functions share state with InputManager / sdl-events.ts when a
// specific InputManager is attached (setSDLInputSource).  For tests that
// don't wire an InputManager, they fall back to a module-local state.

import type { InputAdapter, InputEvent } from "../adapters.js";

// --- Module-local fallback state -----------------------------------------
const NUM_SCANCODES = 512;
const localKeyState = new Uint8Array(NUM_SCANCODES);
let localMouseX = 0;
let localMouseY = 0;
let localMouseButtons = 0;

// --- Bound InputAdapter (optional) ---------------------------------------
let source: InputAdapter | null = null;

/** Attach an InputAdapter so SDL_GetKeyboardState / SDL_GetMouseState read
 * from the same state that SDL events are generated from. */
export function setSDLInputSource(adapter: InputAdapter | null): void {
  source = adapter;
}

/** Apply an input event to the module-local fallback state (used by tests
 * that exercise these functions directly without an InputManager). */
export function feedSDLInputEvent(ev: InputEvent): void {
  switch (ev.type) {
    case "keydown":
      if (ev.key !== undefined && ev.key >= 0 && ev.key < NUM_SCANCODES) localKeyState[ev.key] = 1;
      break;
    case "keyup":
      if (ev.key !== undefined && ev.key >= 0 && ev.key < NUM_SCANCODES) localKeyState[ev.key] = 0;
      break;
    case "mousemove":
      if (ev.x !== undefined) localMouseX = ev.x;
      if (ev.y !== undefined) localMouseY = ev.y;
      break;
    case "mousedown":
      if (ev.x !== undefined) localMouseX = ev.x;
      if (ev.y !== undefined) localMouseY = ev.y;
      if (ev.button !== undefined) localMouseButtons |= (1 << ev.button);
      break;
    case "mouseup":
      if (ev.x !== undefined) localMouseX = ev.x;
      if (ev.y !== undefined) localMouseY = ev.y;
      if (ev.button !== undefined) localMouseButtons &= ~(1 << ev.button);
      break;
  }
}

/** Reset the module-local fallback state (tests). */
export function resetSDLInputState(): void {
  localKeyState.fill(0);
  localMouseX = 0;
  localMouseY = 0;
  localMouseButtons = 0;
}

// --- SDL_GetKeyboardState (spec) ------------------------------------------
// https://wiki.libsdl.org/SDL2/SDL_GetKeyboardState
// Returns a pointer to a static array of key states, one byte per scancode.
// "numkeys" is written if non-null; in our shim it's the out-parameter
// callers can read via the returned array's length.
export function SDL_GetKeyboardState(numkeys?: { value: number } | null): Uint8Array {
  if (source) {
    const src = source.getKeyboardState();
    const out = new Uint8Array(NUM_SCANCODES);
    for (let i = 0; i < src.length && i < NUM_SCANCODES; i++) out[i] = src[i] ? 1 : 0;
    if (numkeys) numkeys.value = NUM_SCANCODES;
    return out;
  }
  if (numkeys) numkeys.value = NUM_SCANCODES;
  return localKeyState;
}

// --- SDL_GetMouseState (spec) ---------------------------------------------
// https://wiki.libsdl.org/SDL2/SDL_GetMouseState
// Writes mouse x/y into the out-pointers (if provided) and returns a button
// bitmask.
export function SDL_GetMouseState(x?: { value: number } | null, y?: { value: number } | null): number {
  let mx = localMouseX, my = localMouseY, buttons = localMouseButtons;
  if (source) {
    const s = source.getMouseState();
    mx = s.x; my = s.y; buttons = s.buttons;
  }
  if (x) x.value = mx;
  if (y) y.value = my;
  return buttons;
}

// --- SDL_GetTicks (spec) --------------------------------------------------
// https://wiki.libsdl.org/SDL2/SDL_GetTicks
const ticksEpoch = (typeof performance !== "undefined" && performance.now)
  ? performance.now()
  : Date.now();
export function SDL_GetTicks(): number {
  const now = (typeof performance !== "undefined" && performance.now)
    ? performance.now()
    : Date.now();
  return Math.floor(now - ticksEpoch) >>> 0;
}
// https://wiki.libsdl.org/SDL2/SDL_GetTicks64
export function SDL_GetTicks64(): bigint {
  const now = (typeof performance !== "undefined" && performance.now)
    ? performance.now()
    : Date.now();
  return BigInt(Math.floor(now - ticksEpoch));
}

// --- SDL_Delay (spec) -----------------------------------------------------
// https://wiki.libsdl.org/SDL2/SDL_Delay
// True busy-wait per SDL's contract: blocks for approximately ms milliseconds.
// In JS this must be finite; we clamp to a generous upper bound.
export function SDL_Delay(ms: number): void {
  const clamped = Math.min(Math.max(0, ms | 0), 1000);
  const end = Date.now() + clamped;
  // eslint-disable-next-line no-empty
  while (Date.now() < end) { /* spin */ }
}

// --- SDL_GetPerformanceCounter / SDL_GetPerformanceFrequency --------------
// https://wiki.libsdl.org/SDL2/SDL_GetPerformanceCounter
export function SDL_GetPerformanceCounter(): bigint {
  const now = (typeof performance !== "undefined" && performance.now)
    ? performance.now()
    : Date.now();
  // Use nanosecond-ish resolution.
  return BigInt(Math.floor(now * 1_000_000));
}
// https://wiki.libsdl.org/SDL2/SDL_GetPerformanceFrequency
export function SDL_GetPerformanceFrequency(): bigint {
  return 1_000_000_000n;
}
