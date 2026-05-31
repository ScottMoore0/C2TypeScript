// PC-10: Image decoding — load image data from byte buffers.
// In a real browser, uses createImageBitmap or Image element.
// This provides a portable interface with an in-memory fallback.

export interface ImageData {
  width: number;
  height: number;
  pixels: Uint8Array; // RGBA, 4 bytes per pixel
}

/** Decode a BMP file from raw bytes. Handles 24-bit and 32-bit uncompressed BMP. */
export function decodeBMP(data: Uint8Array): ImageData | null {
  if (data.length < 54) return null;
  if (data[0] !== 0x42 || data[1] !== 0x4D) return null; // "BM" magic

  const dv = new DataView(data.buffer, data.byteOffset);
  const dataOffset = dv.getUint32(10, true);
  const width = dv.getInt32(18, true);
  const height = dv.getInt32(22, true);
  const bpp = dv.getUint16(28, true);
  const absHeight = Math.abs(height);
  const topDown = height < 0;

  if (bpp !== 24 && bpp !== 32) return null;

  const bytesPerPixel = bpp / 8;
  const rowSize = Math.ceil((width * bytesPerPixel) / 4) * 4; // rows are 4-byte aligned
  const pixels = new Uint8Array(width * absHeight * 4);

  for (let y = 0; y < absHeight; y++) {
    const srcRow = topDown ? y : absHeight - 1 - y;
    const srcOffset = dataOffset + srcRow * rowSize;
    for (let x = 0; x < width; x++) {
      const srcIdx = srcOffset + x * bytesPerPixel;
      const dstIdx = (y * width + x) * 4;
      pixels[dstIdx + 0] = data[srcIdx + 2] ?? 0; // R (BMP stores BGR)
      pixels[dstIdx + 1] = data[srcIdx + 1] ?? 0; // G
      pixels[dstIdx + 2] = data[srcIdx + 0] ?? 0; // B
      pixels[dstIdx + 3] = bpp === 32 ? (data[srcIdx + 3] ?? 255) : 255; // A
    }
  }

  return { width, height: absHeight, pixels };
}

/** Create a solid-color test image. */
export function createSolidImage(width: number, height: number, r: number, g: number, b: number, a: number = 255): ImageData {
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4 + 0] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = a;
  }
  return { width, height, pixels };
}

/** Get pixel at (x, y) from image data. */
export function getPixel(img: ImageData, x: number, y: number): { r: number; g: number; b: number; a: number } {
  const idx = (y * img.width + x) * 4;
  return {
    r: img.pixels[idx + 0] ?? 0,
    g: img.pixels[idx + 1] ?? 0,
    b: img.pixels[idx + 2] ?? 0,
    a: img.pixels[idx + 3] ?? 0,
  };
}
