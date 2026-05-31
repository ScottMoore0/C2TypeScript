// Prism M.5 — Canvas2D extensions.
// Path operations, gradients, patterns, transforms, image data, text metrics.
// Wraps a CanvasRenderingContext2D-like object. In Node (no real canvas),
// uses an injectable pixel-buffer fallback so the translated code still runs.

// --- Types ---

export interface ImageDataLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface TextMetricsLike {
  width: number;
  actualBoundingBoxAscent?: number;
  actualBoundingBoxDescent?: number;
  actualBoundingBoxLeft?: number;
  actualBoundingBoxRight?: number;
  fontBoundingBoxAscent?: number;
  fontBoundingBoxDescent?: number;
}

/** Minimal subset of CanvasRenderingContext2D that we rely on for path/text/gradients. */
export interface Canvas2DExtContext {
  fillStyle: string | any;
  strokeStyle: string | any;
  lineWidth?: number;
  globalAlpha?: number;
  globalCompositeOperation?: string;
  font?: string;
  textAlign?: string;
  textBaseline?: string;

  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, start: number, end: number, anticlockwise?: boolean): void;
  arcTo?(x1: number, y1: number, x2: number, y2: number, r: number): void;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  rect?(x: number, y: number, w: number, h: number): void;
  ellipse?(x: number, y: number, rx: number, ry: number, rot: number, s: number, e: number, ccw?: boolean): void;

  fill(): void;
  stroke(): void;
  clip?(): void;

  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect?(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;

  drawImage?(img: any, sx: number, sy: number, sw?: number, sh?: number, dx?: number, dy?: number, dw?: number, dh?: number): void;
  getImageData?(sx: number, sy: number, sw: number, sh: number): ImageDataLike;
  putImageData?(img: ImageDataLike, dx: number, dy: number): void;
  createImageData?(w: number, h: number): ImageDataLike;

  fillText?(text: string, x: number, y: number, maxWidth?: number): void;
  strokeText?(text: string, x: number, y: number, maxWidth?: number): void;
  measureText?(text: string): TextMetricsLike;

  createLinearGradient?(x0: number, y0: number, x1: number, y1: number): any;
  createRadialGradient?(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): any;
  createPattern?(image: any, repetition: string): any;

  save?(): void;
  restore?(): void;
  translate?(x: number, y: number): void;
  rotate?(angle: number): void;
  scale?(sx: number, sy: number): void;
  transform?(a: number, b: number, c: number, d: number, e: number, f: number): void;
  setTransform?(a: number, b: number, c: number, d: number, e: number, f: number): void;
  resetTransform?(): void;

  canvas: { width: number; height: number };
}

// --- Helpers ---

function ctxMethod(ctx: Canvas2DExtContext, name: string): boolean {
  return typeof (ctx as any)[name] === "function";
}

// --- Path ops (arc / bezier / quad) ---

/**
 * Canvas2D arc — draws an arc on the current path.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-arc
 */
export function canvasArc(
  ctx: Canvas2DExtContext, x: number, y: number, r: number,
  start: number, end: number, anticlockwise: boolean = false
): void {
  ctx.arc(x, y, r, start, end, anticlockwise);
}

/**
 * Canvas2D bezierCurveTo — cubic Bezier segment.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-beziercurveto
 */
export function canvasBezierCurveTo(
  ctx: Canvas2DExtContext, c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number
): void {
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
}

/**
 * Canvas2D quadraticCurveTo — quadratic Bezier segment.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-quadraticcurveto
 */
export function canvasQuadraticCurveTo(
  ctx: Canvas2DExtContext, cpx: number, cpy: number, x: number, y: number
): void {
  ctx.quadraticCurveTo(cpx, cpy, x, y);
}

/**
 * Canvas2D arcTo — adds a circular arc between two tangent lines.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-arcto
 */
export function canvasArcTo(
  ctx: Canvas2DExtContext, x1: number, y1: number, x2: number, y2: number, r: number
): void {
  if (ctxMethod(ctx, "arcTo")) {
    ctx.arcTo!(x1, y1, x2, y2, r);
    return;
  }
  // Fallback: linear approximation.
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
}

/**
 * Canvas2D ellipse.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-ellipse
 */
export function canvasEllipse(
  ctx: Canvas2DExtContext, x: number, y: number, rx: number, ry: number,
  rotation: number, startAngle: number, endAngle: number, anticlockwise: boolean = false
): void {
  if (ctxMethod(ctx, "ellipse")) {
    ctx.ellipse!(x, y, rx, ry, rotation, startAngle, endAngle, anticlockwise);
    return;
  }
  // Approximate as arc (ignoring rotation + ry).
  ctx.arc(x, y, rx, startAngle, endAngle, anticlockwise);
}

// --- Transforms ---

/**
 * Canvas2D save — push current state.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-save
 */
export function canvasSave(ctx: Canvas2DExtContext): void { if (ctxMethod(ctx, "save")) ctx.save!(); }
/**
 * Canvas2D restore — pop saved state.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-restore
 */
export function canvasRestore(ctx: Canvas2DExtContext): void { if (ctxMethod(ctx, "restore")) ctx.restore!(); }
/**
 * Canvas2D translate.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-translate
 */
export function canvasTranslate(ctx: Canvas2DExtContext, x: number, y: number): void {
  if (ctxMethod(ctx, "translate")) ctx.translate!(x, y);
}
/**
 * Canvas2D rotate (radians).
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-rotate
 */
export function canvasRotate(ctx: Canvas2DExtContext, angle: number): void {
  if (ctxMethod(ctx, "rotate")) ctx.rotate!(angle);
}
/**
 * Canvas2D scale.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-scale
 */
export function canvasScale(ctx: Canvas2DExtContext, sx: number, sy: number): void {
  if (ctxMethod(ctx, "scale")) ctx.scale!(sx, sy);
}
/**
 * Canvas2D setTransform(a,b,c,d,e,f).
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-settransform
 */
export function canvasSetTransform(
  ctx: Canvas2DExtContext, a: number, b: number, c: number, d: number, e: number, f: number
): void {
  if (ctxMethod(ctx, "setTransform")) ctx.setTransform!(a, b, c, d, e, f);
}
/**
 * Canvas2D resetTransform — reset to identity.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-resettransform
 */
export function canvasResetTransform(ctx: Canvas2DExtContext): void {
  if (ctxMethod(ctx, "resetTransform")) ctx.resetTransform!();
  else canvasSetTransform(ctx, 1, 0, 0, 1, 0, 0);
}

// --- Image data (get/put) ---

/**
 * Canvas2D getImageData.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-getimagedata
 * In Node without a real ctx, returns a zero-filled ImageData-like buffer.
 */
export function canvasGetImageData(
  ctx: Canvas2DExtContext, sx: number, sy: number, sw: number, sh: number
): ImageDataLike {
  if (ctxMethod(ctx, "getImageData")) {
    return ctx.getImageData!(sx, sy, sw, sh);
  }
  return {
    data: new Uint8ClampedArray(sw * sh * 4),
    width: sw,
    height: sh,
  };
}

/**
 * Canvas2D putImageData.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-putimagedata
 */
export function canvasPutImageData(
  ctx: Canvas2DExtContext, img: ImageDataLike, dx: number, dy: number
): void {
  if (ctxMethod(ctx, "putImageData")) ctx.putImageData!(img, dx, dy);
}

/**
 * Canvas2D createImageData(w,h) — zeroed ImageData.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-createimagedata
 */
export function canvasCreateImageData(
  ctx: Canvas2DExtContext, w: number, h: number
): ImageDataLike {
  if (ctxMethod(ctx, "createImageData")) return ctx.createImageData!(w, h);
  return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
}

/**
 * Canvas2D drawImage — supports (image), (image,dx,dy), (image,dx,dy,dw,dh),
 * (image,sx,sy,sw,sh,dx,dy,dw,dh).
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-drawimage
 */
export function canvasDrawImage(
  ctx: Canvas2DExtContext, image: any,
  a?: number, b?: number, c?: number, d?: number,
  e?: number, f?: number, g?: number, h?: number
): void {
  if (!ctxMethod(ctx, "drawImage")) return;
  if (e === undefined) {
    if (c === undefined) ctx.drawImage!(image, a ?? 0, b ?? 0);
    else ctx.drawImage!(image, a ?? 0, b ?? 0, c, d!);
  } else {
    ctx.drawImage!(image, a!, b!, c!, d!, e, f!, g!, h!);
  }
}

// --- Text ---

/**
 * Canvas2D fillText.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-filltext
 */
export function canvasFillText(
  ctx: Canvas2DExtContext, text: string, x: number, y: number, maxWidth?: number
): void {
  if (ctxMethod(ctx, "fillText")) ctx.fillText!(text, x, y, maxWidth);
}

/**
 * Canvas2D strokeText.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-stroketext
 */
export function canvasStrokeText(
  ctx: Canvas2DExtContext, text: string, x: number, y: number, maxWidth?: number
): void {
  if (ctxMethod(ctx, "strokeText")) ctx.strokeText!(text, x, y, maxWidth);
}

/**
 * Canvas2D measureText — returns width metrics. Falls back to heuristic
 * (8px per char) when no real ctx.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-measuretext
 */
export function canvasMeasureText(ctx: Canvas2DExtContext, text: string): TextMetricsLike {
  if (ctxMethod(ctx, "measureText")) return ctx.measureText!(text);
  // Fallback heuristic: approximate by parsing ctx.font pixel size; default 10px.
  let px = 10;
  const f = ctx.font ?? "";
  const m = /([\d.]+)px/.exec(f);
  if (m) px = parseFloat(m[1]!);
  const widthPerChar = px * 0.55;
  return {
    width: text.length * widthPerChar,
    actualBoundingBoxAscent: px * 0.8,
    actualBoundingBoxDescent: px * 0.2,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: text.length * widthPerChar,
    fontBoundingBoxAscent: px * 0.85,
    fontBoundingBoxDescent: px * 0.25,
  };
}

/**
 * Set font string (CSS font shorthand).
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-font
 */
export function canvasSetFont(ctx: Canvas2DExtContext, font: string): void {
  ctx.font = font;
}

// --- Gradients & patterns ---

/** Opaque stop list kept with a tag so our Node mock can store values. */
export interface GradientLike {
  addColorStop(offset: number, color: string): void;
}

/**
 * Create linear gradient. Falls back to a local mock when ctx lacks the API.
 * Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-createlineargradient
 */
export function canvasCreateLinearGradient(
  ctx: Canvas2DExtContext, x0: number, y0: number, x1: number, y1: number
): GradientLike {
  if (ctxMethod(ctx, "createLinearGradient")) return ctx.createLinearGradient!(x0, y0, x1, y1);
  return makeMockGradient("linear", { x0, y0, x1, y1 });
}

/**
 * Create radial gradient. Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-createradialgradient
 */
export function canvasCreateRadialGradient(
  ctx: Canvas2DExtContext, x0: number, y0: number, r0: number, x1: number, y1: number, r1: number
): GradientLike {
  if (ctxMethod(ctx, "createRadialGradient")) return ctx.createRadialGradient!(x0, y0, r0, x1, y1, r1);
  return makeMockGradient("radial", { x0, y0, r0, x1, y1, r1 });
}

/**
 * Create pattern. Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-createpattern
 */
export function canvasCreatePattern(
  ctx: Canvas2DExtContext, image: any, repetition: string = "repeat"
): any {
  if (ctxMethod(ctx, "createPattern")) return ctx.createPattern!(image, repetition);
  return { kind: "pattern", image, repetition };
}

function makeMockGradient(kind: string, params: Record<string, number>): GradientLike & { kind: string; stops: Array<{ offset: number; color: string }>; params: Record<string, number> } {
  const stops: Array<{ offset: number; color: string }> = [];
  return {
    kind, params, stops,
    addColorStop(offset: number, color: string): void {
      if (offset < 0 || offset > 1 || Number.isNaN(offset)) throw new Error("addColorStop: offset out of [0,1]");
      stops.push({ offset, color });
    },
  };
}

// --- Style setters (accept gradient / pattern / CSS string) ---

/**
 * Set fillStyle. Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-fillstyle
 */
export function canvasSetFillStyle(ctx: Canvas2DExtContext, style: string | GradientLike | any): void {
  ctx.fillStyle = style;
}
/**
 * Set strokeStyle. Spec: https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-strokestyle
 */
export function canvasSetStrokeStyle(ctx: Canvas2DExtContext, style: string | GradientLike | any): void {
  ctx.strokeStyle = style;
}
