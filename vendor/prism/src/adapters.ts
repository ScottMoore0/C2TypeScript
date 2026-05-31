// PC-1: Abstract adapter interfaces.
// Each bridge implements one of these interfaces. The platform provides
// concrete implementations for the browser; tests use mocks.

// --- Storage ---

export interface StorageAdapter {
  /** Save a binary blob under a key. */
  save(key: string, data: Uint8Array): Promise<void>;
  /** Load a binary blob by key. Returns null if not found. */
  load(key: string): Promise<Uint8Array | null>;
  /** Delete a key. */
  remove(key: string): Promise<void>;
  /** List all keys. */
  keys(): Promise<string[]>;
  /** Clear all stored data. */
  clear(): Promise<void>;
}

// --- Display ---

export interface Color {
  r: number; g: number; b: number; a: number;
}

export interface Rect {
  x: number; y: number; w: number; h: number;
}

export interface DisplayAdapter {
  /** Initialize the display subsystem. */
  init(width: number, height: number, title?: string): void;
  /** Get the current display dimensions. */
  getSize(): { width: number; height: number };
  /** Set the draw color. */
  setDrawColor(r: number, g: number, b: number, a: number): void;
  /** Clear the display with the current clear color. */
  clear(): void;
  /** Set the clear color. */
  setClearColor(r: number, g: number, b: number, a: number): void;
  /** Fill a rectangle. */
  fillRect(x: number, y: number, w: number, h: number): void;
  /** Draw a line. */
  drawLine(x1: number, y1: number, x2: number, y2: number): void;
  /** Draw a point. */
  drawPoint(x: number, y: number): void;
  /** Present the back buffer (flip/swap). */
  present(): void;
  /** Read a pixel color at (x, y). */
  readPixel(x: number, y: number): Color;
  /** Draw texture/image data onto the display. */
  drawTexture?(pixels: Uint8Array, tw: number, th: number, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  /** Destroy the display. */
  destroy(): void;
}

// --- Input ---

export type EventType =
  | "keydown" | "keyup"
  | "mousemove" | "mousedown" | "mouseup"
  | "quit";

export interface InputEvent {
  type: EventType;
  key?: number;        // scan code
  x?: number;          // mouse x
  y?: number;          // mouse y
  button?: number;     // mouse button
}

export interface InputAdapter {
  /** Poll the next event. Returns null if queue is empty. */
  pollEvent(): InputEvent | null;
  /** Push an event into the queue (for injection/testing). */
  pushEvent(event: InputEvent): void;
  /** Get current keyboard state (array of booleans indexed by scan code). */
  getKeyboardState(): boolean[];
  /** Get current mouse state. */
  getMouseState(): { x: number; y: number; buttons: number };
}

// --- Audio ---

export interface AudioAdapter {
  /** Initialize audio subsystem. */
  init(sampleRate?: number, channels?: number): void;
  /** Load an audio clip from raw data. Returns a clip handle. */
  loadClip(data: Uint8Array, format?: string): number;
  /** Play a clip. Returns a channel handle. */
  playClip(clipId: number, loops?: number): number;
  /** Stop a channel. */
  stopChannel(channel: number): void;
  /** Set channel volume (0.0 - 1.0). */
  setVolume(channel: number, volume: number): void;
  /** Destroy audio subsystem. */
  destroy(): void;
}

// --- Network ---

export interface NetworkAdapter {
  /** HTTP GET. Returns response body as Uint8Array. */
  httpGet(url: string, headers?: Record<string, string>): Promise<{ status: number; body: Uint8Array }>;
  /** HTTP POST. */
  httpPost(url: string, body: Uint8Array, headers?: Record<string, string>): Promise<{ status: number; body: Uint8Array }>;
}
