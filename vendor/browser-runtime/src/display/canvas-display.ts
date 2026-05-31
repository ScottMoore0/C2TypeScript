// PC-4: Canvas2D display adapter.
// Implements DisplayAdapter using a Canvas2D-like context.
// In the browser, this wraps a real CanvasRenderingContext2D.
// For testing, it works with the MockCanvasContext (see tests).

import type { DisplayAdapter, Color } from "../adapters.js";

export interface CanvasContext {
  fillStyle: string;
  strokeStyle: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  canvas: { width: number; height: number };
}

export class CanvasDisplay implements DisplayAdapter {
  private ctx: CanvasContext | null = null;
  private width = 0;
  private height = 0;
  private drawColor: Color = { r: 255, g: 255, b: 255, a: 255 };
  private clearColor: Color = { r: 0, g: 0, b: 0, a: 255 };
  private title = "";

  /** Create with an injected context (for testing or browser use). */
  constructor(ctx?: CanvasContext) {
    if (ctx) {
      this.ctx = ctx;
      this.width = ctx.canvas.width;
      this.height = ctx.canvas.height;
    }
  }

  init(width: number, height: number, title?: string): void {
    this.width = width;
    this.height = height;
    this.title = title ?? "";
    if (this.ctx) {
      this.ctx.canvas.width = width;
      this.ctx.canvas.height = height;
    }
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  setDrawColor(r: number, g: number, b: number, a: number): void {
    this.drawColor = { r, g, b, a };
  }

  setClearColor(r: number, g: number, b: number, a: number): void {
    this.clearColor = { r, g, b, a };
  }

  clear(): void {
    if (!this.ctx) return;
    const { r, g, b, a } = this.clearColor;
    this.ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    if (!this.ctx) return;
    const { r, g, b, a } = this.drawColor;
    this.ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
    this.ctx.fillRect(x, y, w, h);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.ctx) return;
    const { r, g, b, a } = this.drawColor;
    this.ctx.strokeStyle = `rgba(${r},${g},${b},${a / 255})`;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  drawPoint(x: number, y: number): void {
    this.fillRect(x, y, 1, 1);
  }

  present(): void {
    // In a real browser, this would flip the back buffer.
    // Canvas2D auto-presents, so this is a no-op.
  }

  readPixel(_x: number, _y: number): Color {
    // Would use getImageData in a real browser.
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  destroy(): void {
    this.ctx = null;
  }
}
