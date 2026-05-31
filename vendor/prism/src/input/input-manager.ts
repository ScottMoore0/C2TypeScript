// PC-6: Input manager — keyboard, mouse, event queue.
// Implements InputAdapter with an injectable event queue.

import type { InputAdapter, InputEvent } from "../adapters.js";

// SDL scan codes (subset of the most common keys).
export const SCANCODE_A = 4;
export const SCANCODE_B = 5;
export const SCANCODE_C = 6;
export const SCANCODE_D = 7;
export const SCANCODE_W = 26;
export const SCANCODE_S = 22;
export const SCANCODE_SPACE = 44;
export const SCANCODE_RETURN = 40;
export const SCANCODE_ESCAPE = 41;
export const SCANCODE_LEFT = 80;
export const SCANCODE_RIGHT = 79;
export const SCANCODE_UP = 82;
export const SCANCODE_DOWN = 81;

// Map DOM key codes to SDL scan codes.
const DOM_TO_SCANCODE: Record<string, number> = {
  KeyA: SCANCODE_A, KeyB: SCANCODE_B, KeyC: SCANCODE_C, KeyD: SCANCODE_D,
  KeyW: SCANCODE_W, KeyS: SCANCODE_S,
  Space: SCANCODE_SPACE, Enter: SCANCODE_RETURN, Escape: SCANCODE_ESCAPE,
  ArrowLeft: SCANCODE_LEFT, ArrowRight: SCANCODE_RIGHT,
  ArrowUp: SCANCODE_UP, ArrowDown: SCANCODE_DOWN
};

export function domKeyToScancode(code: string): number {
  return DOM_TO_SCANCODE[code] ?? 0;
}

export class InputManager implements InputAdapter {
  private eventQueue: InputEvent[] = [];
  private keyState: boolean[] = new Array(512).fill(false);
  private mouseX = 0;
  private mouseY = 0;
  private mouseButtons = 0;

  pollEvent(): InputEvent | null {
    return this.eventQueue.shift() ?? null;
  }

  pushEvent(event: InputEvent): void {
    this.eventQueue.push(event);
    // Update internal state based on event.
    switch (event.type) {
      case "keydown":
        if (event.key !== undefined && event.key < 512) this.keyState[event.key] = true;
        break;
      case "keyup":
        if (event.key !== undefined && event.key < 512) this.keyState[event.key] = false;
        break;
      case "mousemove":
        if (event.x !== undefined) this.mouseX = event.x;
        if (event.y !== undefined) this.mouseY = event.y;
        break;
      case "mousedown":
        if (event.x !== undefined) this.mouseX = event.x;
        if (event.y !== undefined) this.mouseY = event.y;
        if (event.button !== undefined) this.mouseButtons |= (1 << event.button);
        break;
      case "mouseup":
        if (event.x !== undefined) this.mouseX = event.x;
        if (event.y !== undefined) this.mouseY = event.y;
        if (event.button !== undefined) this.mouseButtons &= ~(1 << event.button);
        break;
    }
  }

  getKeyboardState(): boolean[] {
    return [...this.keyState];
  }

  getMouseState(): { x: number; y: number; buttons: number } {
    return { x: this.mouseX, y: this.mouseY, buttons: this.mouseButtons };
  }

  /** Clear all state (for reset). */
  reset(): void {
    this.eventQueue = [];
    this.keyState.fill(false);
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseButtons = 0;
  }

  /** How many events are queued. */
  get queueLength(): number {
    return this.eventQueue.length;
  }
}
