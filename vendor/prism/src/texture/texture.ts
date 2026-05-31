// Tier 3 Category A — SDL_Texture emulation.
// Maps SDL2 texture APIs to Canvas2D / ImageData operations.
// Gracefully no-ops rendering calls when no canvas renderer is present (Node tests).

// --- Pixel format constants (matching SDL2 values) ---
export const SDL_PIXELFORMAT_RGBA32 = 0x16462004;
export const SDL_PIXELFORMAT_ARGB32 = 0x16362004;
export const SDL_PIXELFORMAT_RGB24  = 0x17101803;
export const SDL_PIXELFORMAT_INDEX8 = 0x13000801;

// --- Texture access mode constants ---
export const SDL_TEXTUREACCESS_STATIC = 0;
export const SDL_TEXTUREACCESS_STREAMING = 1;
export const SDL_TEXTUREACCESS_TARGET = 2;

// --- Types ---

export interface SDLRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SDLPoint {
  x: number;
  y: number;
}

export const SDL_FLIP_NONE = 0;
export const SDL_FLIP_HORIZONTAL = 1;
export const SDL_FLIP_VERTICAL = 2;

export interface TextureRenderer {
  // Minimal renderer abstraction: a 2D drawing context plus size.
  drawImageData?(data: ImageDataLike, sx: number, sy: number, sw: number, sh: number,
                 dx: number, dy: number, dw: number, dh: number): void;
  drawImageDataEx?(data: ImageDataLike, sx: number, sy: number, sw: number, sh: number,
                   dx: number, dy: number, dw: number, dh: number,
                   angle: number, cx: number, cy: number, flip: number): void;
}

export interface ImageDataLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Minimal ImageData polyfill for Node.
 */
function makeImageData(width: number, height: number): ImageDataLike {
  // Use global ImageData if available (browser / Node w/ canvas polyfill); otherwise polyfill.
  const G: any = (globalThis as any);
  if (typeof G.ImageData === "function") {
    try {
      return new G.ImageData(width, height) as ImageDataLike;
    } catch {
      // Fall through to polyfill
    }
  }
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  };
}

/**
 * SDLTexture — wraps an ImageData-like buffer representing RGBA pixels.
 */
export class SDLTexture {
  private _width: number;
  private _height: number;
  private _format: number;
  private _access: number;
  private _image: ImageDataLike;
  private _destroyed = false;

  constructor(width: number, height: number,
              format: number = SDL_PIXELFORMAT_RGBA32,
              access: number = SDL_TEXTUREACCESS_STATIC) {
    if (width < 0 || height < 0) throw new Error("SDLTexture: negative dimensions");
    this._width = width;
    this._height = height;
    this._format = format;
    this._access = access;
    this._image = makeImageData(Math.max(1, width), Math.max(1, height));
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get format(): number { return this._format; }
  get access(): number { return this._access; }
  get destroyed(): boolean { return this._destroyed; }

  /** Copy RGBA pixels into internal ImageData (row-major). */
  updatePixels(pixels: Uint8Array | Uint8ClampedArray): void {
    if (this._destroyed) return;
    const dst = this._image.data;
    const n = Math.min(dst.length, pixels.length);
    for (let i = 0; i < n; i++) dst[i] = pixels[i]!;
  }

  /** Retrieve internal ImageData for rendering. */
  getImageData(): ImageDataLike {
    return this._image;
  }

  _destroy(): void {
    this._destroyed = true;
  }
}

// --- Standalone API functions (module-level SDL_* style) ---

export function SDL_CreateTexture(
  _renderer: TextureRenderer | null,
  format: number,
  access: number,
  w: number,
  h: number
): SDLTexture {
  return new SDLTexture(w, h, format, access);
}

export interface SurfaceLike {
  w: number;
  h: number;
  pixels: Uint8Array | Uint8ClampedArray;
}

export function SDL_CreateTextureFromSurface(
  _renderer: TextureRenderer | null,
  surface: SurfaceLike
): SDLTexture {
  const tex = new SDLTexture(surface.w, surface.h, SDL_PIXELFORMAT_RGBA32, SDL_TEXTUREACCESS_STATIC);
  tex.updatePixels(surface.pixels instanceof Uint8Array
    ? surface.pixels
    : new Uint8Array(surface.pixels.buffer, surface.pixels.byteOffset, surface.pixels.byteLength));
  return tex;
}

export function SDL_UpdateTexture(
  tex: SDLTexture,
  rect: SDLRect | null,
  pixels: Uint8Array | Uint8ClampedArray,
  pitch: number
): number {
  if (!tex || tex.destroyed) return -1;
  if (rect === null) {
    tex.updatePixels(pixels);
    return 0;
  }
  // Partial update within rect (row-major, pitch bytes per source row).
  const img = tex.getImageData();
  const dst = img.data;
  const rowBytes = rect.w * 4;
  for (let y = 0; y < rect.h; y++) {
    const srcOff = y * pitch;
    const dstOff = ((rect.y + y) * tex.width + rect.x) * 4;
    for (let i = 0; i < rowBytes; i++) {
      if (srcOff + i >= pixels.length || dstOff + i >= dst.length) break;
      dst[dstOff + i] = pixels[srcOff + i]!;
    }
  }
  return 0;
}

export function SDL_QueryTexture(tex: SDLTexture): { format: number; access: number; w: number; h: number } {
  return { format: tex.format, access: tex.access, w: tex.width, h: tex.height };
}

export function SDL_RenderCopy(
  renderer: TextureRenderer | null,
  tex: SDLTexture,
  srcRect: SDLRect | null,
  dstRect: SDLRect | null
): number {
  if (!tex || tex.destroyed) return -1;
  if (!renderer || typeof renderer.drawImageData !== "function") {
    // Graceful no-op when running without a canvas renderer (Node tests).
    return 0;
  }
  const sx = srcRect?.x ?? 0;
  const sy = srcRect?.y ?? 0;
  const sw = srcRect?.w ?? tex.width;
  const sh = srcRect?.h ?? tex.height;
  const dx = dstRect?.x ?? 0;
  const dy = dstRect?.y ?? 0;
  const dw = dstRect?.w ?? tex.width;
  const dh = dstRect?.h ?? tex.height;
  renderer.drawImageData(tex.getImageData(), sx, sy, sw, sh, dx, dy, dw, dh);
  return 0;
}

export function SDL_RenderCopyEx(
  renderer: TextureRenderer | null,
  tex: SDLTexture,
  srcRect: SDLRect | null,
  dstRect: SDLRect | null,
  angle: number,
  center: SDLPoint | null,
  flip: number
): number {
  if (!tex || tex.destroyed) return -1;
  if (!renderer) return 0;
  const sx = srcRect?.x ?? 0;
  const sy = srcRect?.y ?? 0;
  const sw = srcRect?.w ?? tex.width;
  const sh = srcRect?.h ?? tex.height;
  const dx = dstRect?.x ?? 0;
  const dy = dstRect?.y ?? 0;
  const dw = dstRect?.w ?? tex.width;
  const dh = dstRect?.h ?? tex.height;
  const cx = center?.x ?? dw / 2;
  const cy = center?.y ?? dh / 2;
  if (typeof renderer.drawImageDataEx === "function") {
    renderer.drawImageDataEx(tex.getImageData(), sx, sy, sw, sh, dx, dy, dw, dh, angle, cx, cy, flip);
  } else if (typeof renderer.drawImageData === "function") {
    // Fallback: render without rotation/flip.
    renderer.drawImageData(tex.getImageData(), sx, sy, sw, sh, dx, dy, dw, dh);
  }
  return 0;
}

export function SDL_DestroyTexture(tex: SDLTexture): void {
  if (!tex) return;
  tex._destroy();
}
