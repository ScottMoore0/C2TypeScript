// PC-5: SDL2 function mappings.
// Maps C SDL2 function calls to CanvasDisplay operations.
// Mirrors the patterns in compiler/src/shim-database.ts SDL2 section.

import type { DisplayAdapter, InputAdapter } from "../adapters.js";

// --- SDL constants ---
export const SDL_INIT_VIDEO = 0x00000020;
export const SDL_INIT_AUDIO = 0x00000010;
export const SDL_INIT_EVENTS = 0x00004000;
export const SDL_INIT_EVERYTHING = 0x0000FFFF;

export const SDL_WINDOWPOS_CENTERED = 0x2FFF0000;
export const SDL_WINDOW_SHOWN = 0x00000004;
export const SDL_RENDERER_ACCELERATED = 0x00000002;

// Event types
export const SDL_QUIT = 0x100;
export const SDL_KEYDOWN = 0x300;
export const SDL_KEYUP = 0x301;
export const SDL_MOUSEMOTION = 0x400;
export const SDL_MOUSEBUTTONDOWN = 0x401;
export const SDL_MOUSEBUTTONUP = 0x402;

// --- SDL state ---

export interface SDLWindow {
  title: string;
  width: number;
  height: number;
}

export interface SDLRenderer {
  window: SDLWindow;
  display: DisplayAdapter;
}

export class SDL {
  private initialized = false;
  private window: SDLWindow | null = null;
  private renderer: SDLRenderer | null = null;

  constructor(
    private display: DisplayAdapter,
    private input: InputAdapter
  ) {}

  // --- Init/Quit ---

  SDL_Init(_flags: number): number {
    this.initialized = true;
    return 0;
  }

  SDL_Quit(): void {
    this.initialized = false;
    this.display.destroy();
  }

  // --- Window ---

  SDL_CreateWindow(title: string, _x: number, _y: number, w: number, h: number, _flags: number): SDLWindow {
    this.display.init(w, h, title);
    this.window = { title, width: w, height: h };
    return this.window;
  }

  SDL_DestroyWindow(_win: SDLWindow): void {
    this.window = null;
  }

  // --- Renderer ---

  SDL_CreateRenderer(win: SDLWindow, _index: number, _flags: number): SDLRenderer {
    this.renderer = { window: win, display: this.display };
    return this.renderer;
  }

  SDL_SetRenderDrawColor(r: SDLRenderer, red: number, green: number, blue: number, alpha: number): number {
    r.display.setDrawColor(red, green, blue, alpha);
    return 0;
  }

  SDL_RenderClear(r: SDLRenderer): number {
    r.display.clear();
    return 0;
  }

  SDL_RenderFillRect(r: SDLRenderer, rect: { x: number; y: number; w: number; h: number } | null): number {
    if (rect) {
      r.display.fillRect(rect.x, rect.y, rect.w, rect.h);
    } else {
      const { width, height } = r.display.getSize();
      r.display.fillRect(0, 0, width, height);
    }
    return 0;
  }

  SDL_RenderDrawLine(r: SDLRenderer, x1: number, y1: number, x2: number, y2: number): number {
    r.display.drawLine(x1, y1, x2, y2);
    return 0;
  }

  SDL_RenderDrawPoint(r: SDLRenderer, x: number, y: number): number {
    r.display.drawPoint(x, y);
    return 0;
  }

  SDL_RenderPresent(r: SDLRenderer): void {
    r.display.present();
  }

  // --- Color helpers ---

  SDL_MapRGB(_fmt: unknown, r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
  }

  SDL_GetRGB(pixel: number): { r: number; g: number; b: number } {
    return {
      r: (pixel >> 16) & 0xFF,
      g: (pixel >> 8) & 0xFF,
      b: pixel & 0xFF
    };
  }

  // --- Events ---

  SDL_PollEvent(): { type: number; key?: number; x?: number; y?: number; button?: number } | null {
    const ev = this.input.pollEvent();
    if (!ev) return null;
    switch (ev.type) {
      case "quit": return { type: SDL_QUIT };
      case "keydown": return { type: SDL_KEYDOWN, key: ev.key };
      case "keyup": return { type: SDL_KEYUP, key: ev.key };
      case "mousemove": return { type: SDL_MOUSEMOTION, x: ev.x, y: ev.y };
      case "mousedown": return { type: SDL_MOUSEBUTTONDOWN, button: ev.button, x: ev.x, y: ev.y };
      case "mouseup": return { type: SDL_MOUSEBUTTONUP, button: ev.button, x: ev.x, y: ev.y };
      default: return null;
    }
  }

  SDL_GetKeyboardState(): boolean[] {
    return this.input.getKeyboardState();
  }

  SDL_GetMouseState(): { x: number; y: number; buttons: number } {
    return this.input.getMouseState();
  }

  // --- Timing ---

  SDL_GetTicks(): number {
    return Math.floor(performance.now());
  }

  SDL_Delay(_ms: number): void {
    // No-op in async JS context.
  }

  // --- Textures & Surfaces ---

  SDL_CreateRGBSurface(flags: number, w: number, h: number, depth: number): SDLSurface {
    return new SDLSurface(w, h, depth);
  }

  SDL_FreeSurface(_surface: SDLSurface): void { /* no-op */ }

  SDL_CreateTextureFromSurface(surface: SDLSurface): SDLTexture {
    return new SDLTexture(surface.w, surface.h, surface.pixels);
  }

  SDL_DestroyTexture(_texture: SDLTexture): void { /* no-op */ }

  SDL_RenderCopy(texture: SDLTexture, srcRect: any, dstRect: any): void {
    if (!this.display) return;
    const sx = srcRect?.x ?? 0, sy = srcRect?.y ?? 0;
    const sw = srcRect?.w ?? texture.w, sh = srcRect?.h ?? texture.h;
    const dx = dstRect?.x ?? 0, dy = dstRect?.y ?? 0;
    const dw = dstRect?.w ?? texture.w, dh = dstRect?.h ?? texture.h;
    this.display.drawTexture?.(texture.pixels, texture.w, texture.h, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  SDL_BlitSurface(src: SDLSurface, srcRect: any, dst: SDLSurface, dstRect: any): number {
    const sx = srcRect?.x ?? 0, sy = srcRect?.y ?? 0;
    const sw = srcRect?.w ?? src.w, sh = srcRect?.h ?? src.h;
    const dx = dstRect?.x ?? 0, dy = dstRect?.y ?? 0;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const si = ((sy + y) * src.w + (sx + x)) * 4;
        const di = ((dy + y) * dst.w + (dx + x)) * 4;
        dst.pixels[di] = src.pixels[si]!;
        dst.pixels[di + 1] = src.pixels[si + 1]!;
        dst.pixels[di + 2] = src.pixels[si + 2]!;
        dst.pixels[di + 3] = src.pixels[si + 3]!;
      }
    }
    return 0;
  }

  SDL_GetWindowSize(): { w: number; h: number } {
    const sz = this.display?.getSize();
    return sz ? { w: sz.width, h: sz.height } : { w: 640, h: 480 };
  }

  SDL_SetWindowTitle(title: string): void {
    // In browser: document.title = title
  }

  // --- SDL_image ---

  IMG_Init(_flags: number): number { return 0; }
  IMG_Quit(): void {}

  IMG_Load(filename: string): SDLSurface | null {
    // In Node.js context, we can't load images without additional deps
    // Return a placeholder
    return new SDLSurface(1, 1, 32);
  }

  // --- SDL_mixer ---

  Mix_OpenAudio(frequency: number, format: number, channels: number, chunksize: number): number { return 0; }
  Mix_CloseAudio(): void {}
  Mix_LoadWAV(_file: string): SDLMixChunk { return new SDLMixChunk(); }
  Mix_FreeChunk(_chunk: SDLMixChunk): void {}
  Mix_PlayChannel(channel: number, chunk: SDLMixChunk, loops: number): number { return channel; }
  Mix_HaltChannel(_channel: number): void {}
  Mix_Volume(channel: number, volume: number): number { return volume; }

  Mix_LoadMUS(_file: string): SDLMixMusic { return new SDLMixMusic(); }
  Mix_FreeMusic(_music: SDLMixMusic): void {}
  Mix_PlayMusic(music: SDLMixMusic, loops: number): number { return 0; }
  Mix_HaltMusic(): void {}
  Mix_VolumeMusic(volume: number): number { return volume; }
  Mix_PauseMusic(): void {}
  Mix_ResumeMusic(): void {}
  Mix_PausedMusic(): number { return 0; }

  // --- SDL_ttf (stub) ---

  TTF_Init(): number { return 0; }
  TTF_Quit(): void {}
  TTF_OpenFont(_file: string, _size: number): any { return {}; }
  TTF_CloseFont(_font: any): void {}
  TTF_RenderText_Solid(_font: any, text: string, _color: any): SDLSurface {
    return new SDLSurface(text.length * 8, 16, 32);
  }
}

// --- Surface & Texture types ---

export class SDLSurface {
  readonly w: number;
  readonly h: number;
  readonly depth: number;
  readonly pixels: Uint8Array;

  constructor(w: number, h: number, depth: number = 32) {
    this.w = w; this.h = h; this.depth = depth;
    this.pixels = new Uint8Array(w * h * 4);
  }

  setPixel(x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
    const i = (y * this.w + x) * 4;
    this.pixels[i] = r; this.pixels[i + 1] = g;
    this.pixels[i + 2] = b; this.pixels[i + 3] = a;
  }
}

export class SDLTexture {
  readonly w: number;
  readonly h: number;
  readonly pixels: Uint8Array;

  constructor(w: number, h: number, pixels?: Uint8Array) {
    this.w = w; this.h = h;
    this.pixels = pixels ?? new Uint8Array(w * h * 4);
  }
}

export class SDLMixChunk {
  volume: number = 128;
}

export class SDLMixMusic {
  volume: number = 128;
}
