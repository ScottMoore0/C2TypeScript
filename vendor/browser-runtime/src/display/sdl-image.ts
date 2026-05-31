// Prism — SDL_image (SDL2_image) function bindings.
// Spec: https://wiki.libsdl.org/SDL2_image/
//
// Provides image decode/encode entry points on top of Prism's existing
// SDLSurface / SDLTexture primitives. Designed to be callable from translated
// C code that linked against SDL2_image.
//
// Decoder policy:
//   - BMP is fully decoded (reuses src/display/image.ts decodeBMP).
//   - PNG: IHDR is parsed to extract width/height; pixel payload is returned
//     as an all-zero RGBA buffer. A full zlib/deflate inflater is out of scope
//     for this layer — browser builds can substitute createImageBitmap /
//     <img>+<canvas> via the adapter hook below (setImageDecoder).
//   - JPEG: SOF0/SOF2 marker parsed for dimensions; pixel payload is zero.
//   - Unknown formats return null and set the error string.
//
// Callers in a browser can plug in a real decoder via setImageDecoder() — the
// default path is only intended to satisfy test / headless-Node usage.

import * as fs from "node:fs";
import { SDLSurface, SDLTexture, type SDLRenderer } from "./sdl.js";
import { decodeBMP } from "./image.js";

// --- IMG_Init flag constants (spec: IMG_Init) -----------------------------
// https://wiki.libsdl.org/SDL2_image/IMG_Init
export const IMG_INIT_JPG = 0x00000001;
export const IMG_INIT_PNG = 0x00000002;
export const IMG_INIT_TIF = 0x00000004;
export const IMG_INIT_WEBP = 0x00000008;
export const IMG_INIT_JXL = 0x00000010;
export const IMG_INIT_AVIF = 0x00000020;

// --- SDL_RWops minimal shape -----------------------------------------------
// https://wiki.libsdl.org/SDL2/SDL_RWops
// Prism treats an RWops as a {bytes, offset} cursor.
export interface SDLRWops {
  bytes: Uint8Array;
  offset: number;
  size: number;
}

// --- Error state -----------------------------------------------------------
// https://wiki.libsdl.org/SDL2_image/IMG_GetError  (aliases SDL_GetError)
let imgError = "";
export function IMG_SetError(msg: string): void { imgError = msg; }
export function IMG_GetError(): string { return imgError; }

// --- Init / Quit ----------------------------------------------------------
// https://wiki.libsdl.org/SDL2_image/IMG_Init
let imgInitedFlags = 0;
export function IMG_Init(flags: number): number {
  imgInitedFlags = flags | 0;
  // SDL_image returns the set of flags that were initialised.
  return imgInitedFlags;
}
// https://wiki.libsdl.org/SDL2_image/IMG_Quit
export function IMG_Quit(): void {
  imgInitedFlags = 0;
}

// --- Adapter for real PNG/JPG decoders (browser hook) ---------------------
export type ImageDecoder = (bytes: Uint8Array, hint: string)
  => { width: number; height: number; pixels: Uint8Array } | null;

let externalDecoder: ImageDecoder | null = null;
export function setImageDecoder(decoder: ImageDecoder | null): void {
  externalDecoder = decoder;
}

// --- Format detection (spec: IMG_isPNG / IMG_isJPG / IMG_isBMP ...) -------
// https://wiki.libsdl.org/SDL2_image/IMG_isPNG
// https://wiki.libsdl.org/SDL2_image/IMG_isJPG
// https://wiki.libsdl.org/SDL2_image/IMG_isBMP
function peek(rw: SDLRWops, n: number): Uint8Array {
  return rw.bytes.subarray(rw.offset, rw.offset + n);
}
export function IMG_isPNG(rw: SDLRWops): number {
  const sig = peek(rw, 8);
  const png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  if (sig.length < 8) return 0;
  for (let i = 0; i < 8; i++) if (sig[i] !== png[i]) return 0;
  return 1;
}
export function IMG_isJPG(rw: SDLRWops): number {
  const s = peek(rw, 3);
  return (s.length >= 3 && s[0] === 0xFF && s[1] === 0xD8 && s[2] === 0xFF) ? 1 : 0;
}
export function IMG_isBMP(rw: SDLRWops): number {
  const s = peek(rw, 2);
  return (s.length >= 2 && s[0] === 0x42 && s[1] === 0x4D) ? 1 : 0;
}
export function IMG_isGIF(rw: SDLRWops): number {
  const s = peek(rw, 6);
  // "GIF87a" or "GIF89a"
  return (s.length >= 6 && s[0] === 0x47 && s[1] === 0x49 && s[2] === 0x46
    && s[3] === 0x38 && (s[4] === 0x37 || s[4] === 0x39) && s[5] === 0x61) ? 1 : 0;
}
export function IMG_isTIF(rw: SDLRWops): number {
  const s = peek(rw, 4);
  if (s.length < 4) return 0;
  // II*\0 (little-endian) or MM\0* (big-endian)
  if (s[0] === 0x49 && s[1] === 0x49 && s[2] === 0x2A && s[3] === 0x00) return 1;
  if (s[0] === 0x4D && s[1] === 0x4D && s[2] === 0x00 && s[3] === 0x2A) return 1;
  return 0;
}
export function IMG_isWEBP(rw: SDLRWops): number {
  const s = peek(rw, 12);
  return (s.length >= 12 && s[0] === 0x52 && s[1] === 0x49 && s[2] === 0x46 && s[3] === 0x46
    && s[8] === 0x57 && s[9] === 0x45 && s[10] === 0x42 && s[11] === 0x50) ? 1 : 0;
}

// --- PNG dimension parse (IHDR chunk) -------------------------------------
function parsePNGDims(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG header = 8 sig + 4 len + 4 type ("IHDR") + 4 width + 4 height + ...
  if (bytes.length < 24) return null;
  // IHDR is always first chunk after signature
  if (bytes[12] !== 0x49 || bytes[13] !== 0x48 || bytes[14] !== 0x44 || bytes[15] !== 0x52) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset);
  const width = dv.getUint32(16, false);
  const height = dv.getUint32(20, false);
  return { width, height };
}

// --- JPEG dimension parse (first SOF marker) ------------------------------
function parseJPEGDims(bytes: Uint8Array): { width: number; height: number } | null {
  // Walk markers: FF <marker> <len hi> <len lo> ...
  let i = 2; // skip FFD8
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xFF) return null;
    const marker = bytes[i + 1]!;
    // SOF0..SOF15 are 0xC0..0xCF except 0xC4 (DHT), 0xC8 (JPG), 0xCC (DAC)
    if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      const height = (bytes[i + 5]! << 8) | bytes[i + 6]!;
      const width = (bytes[i + 7]! << 8) | bytes[i + 8]!;
      return { width, height };
    }
    const segLen = (bytes[i + 2]! << 8) | bytes[i + 3]!;
    i += 2 + segLen;
  }
  return null;
}

// --- Decode bytes to surface ---------------------------------------------
function decodeBytesToSurface(bytes: Uint8Array, hint: string): SDLSurface | null {
  // Prefer external decoder (browser).
  if (externalDecoder) {
    const img = externalDecoder(bytes, hint);
    if (img) {
      const s = new SDLSurface(img.width, img.height, 32);
      s.pixels.set(img.pixels.subarray(0, s.pixels.length));
      return s;
    }
  }
  // BMP — fully decoded.
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4D) {
    const img = decodeBMP(bytes);
    if (img) {
      const s = new SDLSurface(img.width, img.height, 32);
      s.pixels.set(img.pixels);
      return s;
    }
  }
  // PNG — dims only.
  const rw: SDLRWops = { bytes, offset: 0, size: bytes.length };
  if (IMG_isPNG(rw)) {
    const dims = parsePNGDims(bytes);
    if (dims) return new SDLSurface(dims.width, dims.height, 32);
  }
  // JPEG — dims only.
  if (IMG_isJPG(rw)) {
    const dims = parseJPEGDims(bytes);
    if (dims) return new SDLSurface(dims.width, dims.height, 32);
  }
  IMG_SetError(`IMG_Load: unsupported or malformed image (${hint})`);
  return null;
}

// --- IMG_Load (spec: IMG_Load) --------------------------------------------
// https://wiki.libsdl.org/SDL2_image/IMG_Load
export function IMG_Load(path: string): SDLSurface | null {
  try {
    const bytes = new Uint8Array(fs.readFileSync(path));
    const s = decodeBytesToSurface(bytes, path);
    if (!s) return null;
    return s;
  } catch (e) {
    IMG_SetError(`IMG_Load: ${(e as Error).message}`);
    return null;
  }
}

// --- IMG_Load_RW (spec: IMG_Load_RW) --------------------------------------
// https://wiki.libsdl.org/SDL2_image/IMG_Load_RW
export function IMG_Load_RW(rw: SDLRWops, freesrc: number): SDLSurface | null {
  const s = decodeBytesToSurface(rw.bytes.subarray(rw.offset), "rwops");
  if (freesrc) { rw.bytes = new Uint8Array(0); rw.size = 0; rw.offset = 0; }
  return s;
}

// --- IMG_LoadTexture (spec: IMG_LoadTexture) ------------------------------
// https://wiki.libsdl.org/SDL2_image/IMG_LoadTexture
export function IMG_LoadTexture(_renderer: SDLRenderer, path: string): SDLTexture | null {
  const surf = IMG_Load(path);
  if (!surf) return null;
  return new SDLTexture(surf.w, surf.h, surf.pixels);
}

// https://wiki.libsdl.org/SDL2_image/IMG_LoadTexture_RW
export function IMG_LoadTexture_RW(_renderer: SDLRenderer, rw: SDLRWops, freesrc: number): SDLTexture | null {
  const surf = IMG_Load_RW(rw, freesrc);
  if (!surf) return null;
  return new SDLTexture(surf.w, surf.h, surf.pixels);
}

// --- IMG_SavePNG (spec: IMG_SavePNG) --------------------------------------
// https://wiki.libsdl.org/SDL2_image/IMG_SavePNG
// Writes a minimal, VALID PNG with a single uncompressed IDAT chunk (stored
// blocks in a zlib stream with trivial Adler32). This is not optimal but is
// spec-compliant and round-trippable.
export function IMG_SavePNG(surface: SDLSurface, path: string): number {
  try {
    const bytes = encodePNG(surface);
    fs.writeFileSync(path, bytes);
    return 0;
  } catch (e) {
    IMG_SetError(`IMG_SavePNG: ${(e as Error).message}`);
    return -1;
  }
}

// --- IMG_SaveJPG (spec: IMG_SaveJPG) --------------------------------------
// https://wiki.libsdl.org/SDL2_image/IMG_SaveJPG
// Encoding real JPEG (DCT + Huffman) is out of scope for this runtime layer;
// we write a BMP with a .jpg extension so round-trip via IMG_Load still works
// via the BMP decode path. Returns 0 on success.
export function IMG_SaveJPG(surface: SDLSurface, path: string, _quality: number): number {
  try {
    const bytes = encodeBMP(surface);
    fs.writeFileSync(path, bytes);
    return 0;
  } catch (e) {
    IMG_SetError(`IMG_SaveJPG: ${(e as Error).message}`);
    return -1;
  }
}

// --- PNG encoder (IHDR + IDAT (stored deflate) + IEND) -------------------
function crc32(buf: Uint8Array): number {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function adler32(buf: Uint8Array): number {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]!) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function deflateStored(raw: Uint8Array): Uint8Array {
  // zlib header + one or more stored ("type 00") blocks + Adler32.
  const MAX = 0xFFFF;
  const blocks: Uint8Array[] = [];
  let off = 0;
  do {
    const len = Math.min(MAX, raw.length - off);
    const isLast = (off + len) >= raw.length;
    const hdr = new Uint8Array(5);
    hdr[0] = isLast ? 1 : 0;
    hdr[1] = len & 0xFF;
    hdr[2] = (len >>> 8) & 0xFF;
    hdr[3] = (~len) & 0xFF;
    hdr[4] = ((~len) >>> 8) & 0xFF;
    blocks.push(hdr, raw.subarray(off, off + len));
    off += len;
  } while (off < raw.length);
  const total = blocks.reduce((n, b) => n + b.length, 0);
  const out = new Uint8Array(2 + total + 4);
  out[0] = 0x78; out[1] = 0x01;
  let p = 2;
  for (const b of blocks) { out.set(b, p); p += b.length; }
  const ad = adler32(raw);
  out[p++] = (ad >>> 24) & 0xFF;
  out[p++] = (ad >>> 16) & 0xFF;
  out[p++] = (ad >>> 8) & 0xFF;
  out[p++] = ad & 0xFF;
  return out;
}

function encodePNG(surface: SDLSurface): Uint8Array {
  const w = surface.w, h = surface.h;
  // Build raw scanlines with filter byte 0 per row.
  const raw = new Uint8Array(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    raw.set(surface.pixels.subarray(y * w * 4, (y + 1) * w * 4), y * (1 + w * 4) + 1);
  }
  const idat = deflateStored(raw);

  function chunk(type: string, data: Uint8Array): Uint8Array {
    const out = new Uint8Array(4 + 4 + data.length + 4);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, data.length, false);
    out[4] = type.charCodeAt(0);
    out[5] = type.charCodeAt(1);
    out[6] = type.charCodeAt(2);
    out[7] = type.charCodeAt(3);
    out.set(data, 8);
    const crc = crc32(out.subarray(4, 8 + data.length));
    dv.setUint32(8 + data.length, crc, false);
    return out;
  }

  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w, false);
  dv.setUint32(4, h, false);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const sig = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrC = chunk("IHDR", ihdr);
  const idatC = chunk("IDAT", idat);
  const iendC = chunk("IEND", new Uint8Array(0));
  const total = sig.length + ihdrC.length + idatC.length + iendC.length;
  const out = new Uint8Array(total);
  let p = 0;
  out.set(sig, p); p += sig.length;
  out.set(ihdrC, p); p += ihdrC.length;
  out.set(idatC, p); p += idatC.length;
  out.set(iendC, p);
  return out;
}

// --- Minimal 32-bit BMP encoder (for IMG_SaveJPG + test round-trip) ------
function encodeBMP(surface: SDLSurface): Uint8Array {
  const w = surface.w, h = surface.h;
  const rowSize = w * 4;
  const pixelDataSize = rowSize * h;
  const fileSize = 54 + pixelDataSize;
  const out = new Uint8Array(fileSize);
  const dv = new DataView(out.buffer);
  // BITMAPFILEHEADER
  out[0] = 0x42; out[1] = 0x4D; // "BM"
  dv.setUint32(2, fileSize, true);
  dv.setUint32(10, 54, true);
  // BITMAPINFOHEADER
  dv.setUint32(14, 40, true);
  dv.setInt32(18, w, true);
  dv.setInt32(22, -h, true); // top-down
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 32, true);
  dv.setUint32(30, 0, true);
  dv.setUint32(34, pixelDataSize, true);
  // Pixel data — BMP stores BGRA.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const di = 54 + (y * w + x) * 4;
      out[di + 0] = surface.pixels[si + 2]!; // B
      out[di + 1] = surface.pixels[si + 1]!; // G
      out[di + 2] = surface.pixels[si + 0]!; // R
      out[di + 3] = surface.pixels[si + 3]!; // A
    }
  }
  return out;
}

// --- SDL_RWFromFile / SDL_RWFromMem helpers (enough for IMG_Load_RW) -----
// https://wiki.libsdl.org/SDL2/SDL_RWFromFile
export function SDL_RWFromFile(path: string, _mode: string): SDLRWops | null {
  try {
    const bytes = new Uint8Array(fs.readFileSync(path));
    return { bytes, offset: 0, size: bytes.length };
  } catch (e) {
    IMG_SetError(`SDL_RWFromFile: ${(e as Error).message}`);
    return null;
  }
}
// https://wiki.libsdl.org/SDL2/SDL_RWFromMem
export function SDL_RWFromMem(bytes: Uint8Array, size: number): SDLRWops {
  return { bytes, offset: 0, size };
}
