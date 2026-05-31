// Prism — WebGL 1.0 context scaffold.
//
// In a browser, delegates to the real `canvas.getContext('webgl')` /
// `canvas.getContext('webgl2')` returned by the HTMLCanvasElement.
//
// In Node (or any environment without a real HTMLCanvasElement), returns a
// command-queue stub that records every WebGL call for test inspection. The
// stub honours the shape of `WebGLRenderingContext` well enough to compile
// shaders, link programs, create buffers/textures, and issue draw calls — no
// pixels are produced, but object identity and state transitions are tracked.
//
// Spec: WebGL 1.0 Khronos specification
//   https://registry.khronos.org/webgl/specs/latest/1.0/
// All constant values match the spec's §5.14 "WebGLRenderingContext".

// ---------------------------------------------------------------------------
// Public WebGL 1.0 enum constants (subset required by the task).
// Values are taken verbatim from the Khronos WebGL 1.0 spec.
// ---------------------------------------------------------------------------

export const GL_DEPTH_BUFFER_BIT   = 0x00000100;
export const GL_COLOR_BUFFER_BIT   = 0x00004000;

export const GL_POINTS             = 0x0000;
export const GL_LINES              = 0x0001;
export const GL_TRIANGLES          = 0x0004;

export const GL_ARRAY_BUFFER         = 0x8892;
export const GL_ELEMENT_ARRAY_BUFFER = 0x8893;
export const GL_STATIC_DRAW          = 0x88E4;

export const GL_FLOAT          = 0x1406;
export const GL_UNSIGNED_SHORT = 0x1403;
export const GL_UNSIGNED_BYTE  = 0x1401;

export const GL_FRAGMENT_SHADER = 0x8B30;
export const GL_VERTEX_SHADER   = 0x8B31;

export const GL_COMPILE_STATUS = 0x8B81;
export const GL_LINK_STATUS    = 0x8B82;

export const GL_TEXTURE_2D = 0x0DE1;
export const GL_RGBA       = 0x1908;

// ---------------------------------------------------------------------------
// Object handle types — opaque to the user, exposed for test inspection.
// ---------------------------------------------------------------------------

export interface WebGLShaderStub {
  readonly id: number;
  readonly type: number; // GL_VERTEX_SHADER | GL_FRAGMENT_SHADER
  source: string;
  compiled: boolean;
  infoLog: string;
  deleted: boolean;
}

export interface WebGLProgramStub {
  readonly id: number;
  shaders: WebGLShaderStub[];
  linked: boolean;
  infoLog: string;
  deleted: boolean;
}

export interface WebGLBufferStub {
  readonly id: number;
  target: number | null;
  data: ArrayBufferView | ArrayBuffer | null;
  usage: number;
  deleted: boolean;
}

export interface WebGLTextureStub {
  readonly id: number;
  target: number | null;
  width: number;
  height: number;
  internalFormat: number;
  format: number;
  type: number;
  deleted: boolean;
}

export interface WebGLUniformLocationStub {
  readonly id: number;
  readonly name: string;
}

export type WebGLCommand =
  | { op: "clearColor"; r: number; g: number; b: number; a: number }
  | { op: "clear"; mask: number }
  | { op: "viewport"; x: number; y: number; w: number; h: number }
  | { op: "createShader"; id: number; shaderType: number }
  | { op: "shaderSource"; id: number; source: string }
  | { op: "compileShader"; id: number }
  | { op: "deleteShader"; id: number }
  | { op: "createProgram"; id: number }
  | { op: "attachShader"; program: number; shader: number }
  | { op: "linkProgram"; id: number }
  | { op: "useProgram"; id: number | null }
  | { op: "deleteProgram"; id: number }
  | { op: "createBuffer"; id: number }
  | { op: "bindBuffer"; target: number; id: number | null }
  | { op: "bufferData"; target: number; size: number; usage: number }
  | { op: "deleteBuffer"; id: number }
  | { op: "createTexture"; id: number }
  | { op: "bindTexture"; target: number; id: number | null }
  | { op: "texImage2D"; target: number; level: number; internalFormat: number; width: number; height: number; format: number; type: number }
  | { op: "texParameteri"; target: number; pname: number; param: number }
  | { op: "deleteTexture"; id: number }
  | { op: "enableVertexAttribArray"; index: number }
  | { op: "vertexAttribPointer"; index: number; size: number; type: number; normalized: boolean; stride: number; offset: number }
  | { op: "uniform1f"; loc: number; x: number }
  | { op: "uniform2f"; loc: number; x: number; y: number }
  | { op: "uniform3f"; loc: number; x: number; y: number; z: number }
  | { op: "uniform4f"; loc: number; x: number; y: number; z: number; w: number }
  | { op: "uniform1i"; loc: number; x: number }
  | { op: "uniformMatrix4fv"; loc: number; transpose: boolean; matrix: ReadonlyArray<number> }
  | { op: "drawArrays"; mode: number; first: number; count: number }
  | { op: "drawElements"; mode: number; count: number; type: number; offset: number };

export interface WebGLContextStub {
  // ----- constants (instance members, matching the DOM WebGLRenderingContext) -----
  readonly DEPTH_BUFFER_BIT: number;
  readonly COLOR_BUFFER_BIT: number;
  readonly POINTS: number;
  readonly LINES: number;
  readonly TRIANGLES: number;
  readonly ARRAY_BUFFER: number;
  readonly ELEMENT_ARRAY_BUFFER: number;
  readonly STATIC_DRAW: number;
  readonly FLOAT: number;
  readonly UNSIGNED_SHORT: number;
  readonly UNSIGNED_BYTE: number;
  readonly FRAGMENT_SHADER: number;
  readonly VERTEX_SHADER: number;
  readonly COMPILE_STATUS: number;
  readonly LINK_STATUS: number;
  readonly TEXTURE_2D: number;
  readonly RGBA: number;

  // ----- API -----
  clearColor(r: number, g: number, b: number, a: number): void;
  clear(mask: number): void;
  viewport(x: number, y: number, w: number, h: number): void;

  createShader(shaderType: number): WebGLShaderStub;
  shaderSource(shader: WebGLShaderStub, source: string): void;
  compileShader(shader: WebGLShaderStub): void;
  getShaderParameter(shader: WebGLShaderStub, pname: number): boolean | number;
  getShaderInfoLog(shader: WebGLShaderStub): string;
  deleteShader(shader: WebGLShaderStub): void;

  createProgram(): WebGLProgramStub;
  attachShader(program: WebGLProgramStub, shader: WebGLShaderStub): void;
  linkProgram(program: WebGLProgramStub): void;
  getProgramParameter(program: WebGLProgramStub, pname: number): boolean | number;
  useProgram(program: WebGLProgramStub | null): void;
  deleteProgram(program: WebGLProgramStub): void;

  createBuffer(): WebGLBufferStub;
  bindBuffer(target: number, buffer: WebGLBufferStub | null): void;
  bufferData(target: number, data: ArrayBufferView | ArrayBuffer | number, usage: number): void;
  deleteBuffer(buffer: WebGLBufferStub): void;

  createTexture(): WebGLTextureStub;
  bindTexture(target: number, texture: WebGLTextureStub | null): void;
  texImage2D(
    target: number, level: number, internalFormat: number,
    width: number, height: number, border: number,
    format: number, type: number, pixels: ArrayBufferView | null
  ): void;
  texParameteri(target: number, pname: number, param: number): void;
  deleteTexture(texture: WebGLTextureStub): void;

  getAttribLocation(program: WebGLProgramStub, name: string): number;
  enableVertexAttribArray(index: number): void;
  vertexAttribPointer(index: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void;

  getUniformLocation(program: WebGLProgramStub, name: string): WebGLUniformLocationStub;
  uniform1f(loc: WebGLUniformLocationStub, x: number): void;
  uniform2f(loc: WebGLUniformLocationStub, x: number, y: number): void;
  uniform3f(loc: WebGLUniformLocationStub, x: number, y: number, z: number): void;
  uniform4f(loc: WebGLUniformLocationStub, x: number, y: number, z: number, w: number): void;
  uniform1i(loc: WebGLUniformLocationStub, x: number): void;
  uniformMatrix4fv(loc: WebGLUniformLocationStub, transpose: boolean, value: ArrayLike<number>): void;

  drawArrays(mode: number, first: number, count: number): void;
  drawElements(mode: number, count: number, type: number, offset: number): void;

  // ----- Node-only test hooks -----
  readonly __commands: ReadonlyArray<WebGLCommand>;
  __clearCommands(): void;
  readonly __isStub: boolean;
}

export interface CreateWebGLContextOptions {
  version?: 1 | 2;
  // Passed straight through to canvas.getContext() in the browser path.
  attributes?: Record<string, unknown>;
  // Force the stub backend (useful for tests even when a real canvas is available).
  forceStub?: boolean;
}

export interface CanvasLike {
  getContext?: (contextId: string, attributes?: unknown) => unknown;
}

function looksLikeRealCanvas(canvas: unknown): canvas is CanvasLike {
  return !!canvas && typeof (canvas as CanvasLike).getContext === "function";
}

/**
 * Create a WebGL 1.0 rendering context.
 *
 * In a browser environment (where `canvas` is a real `HTMLCanvasElement`),
 * returns the real context from `canvas.getContext('webgl')` (or `'webgl2'`
 * when `options.version === 2`). When no real canvas is available, returns a
 * stub that records every call in an inspectable command queue.
 *
 * Spec: WebGL 1.0 §5.13.1 "getContext".
 */
export function createWebGLContext(
  canvas: unknown,
  options: CreateWebGLContextOptions = {}
): WebGLContextStub | any {
  const version = options.version ?? 1;
  const contextId = version === 2 ? "webgl2" : "webgl";

  if (!options.forceStub && looksLikeRealCanvas(canvas) && typeof canvas.getContext === "function") {
    try {
      const real = canvas.getContext(contextId, options.attributes);
      if (real) return real;
    } catch {
      // fall through to stub
    }
  }
  return makeWebGLStub();
}

function makeWebGLStub(): WebGLContextStub {
  const cmds: WebGLCommand[] = [];
  let nextId = 1;
  const alloc = () => nextId++;

  const ctx: WebGLContextStub = {
    // constants
    DEPTH_BUFFER_BIT:   GL_DEPTH_BUFFER_BIT,
    COLOR_BUFFER_BIT:   GL_COLOR_BUFFER_BIT,
    POINTS:             GL_POINTS,
    LINES:              GL_LINES,
    TRIANGLES:          GL_TRIANGLES,
    ARRAY_BUFFER:         GL_ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER: GL_ELEMENT_ARRAY_BUFFER,
    STATIC_DRAW:          GL_STATIC_DRAW,
    FLOAT:          GL_FLOAT,
    UNSIGNED_SHORT: GL_UNSIGNED_SHORT,
    UNSIGNED_BYTE:  GL_UNSIGNED_BYTE,
    FRAGMENT_SHADER: GL_FRAGMENT_SHADER,
    VERTEX_SHADER:   GL_VERTEX_SHADER,
    COMPILE_STATUS: GL_COMPILE_STATUS,
    LINK_STATUS:    GL_LINK_STATUS,
    TEXTURE_2D: GL_TEXTURE_2D,
    RGBA:       GL_RGBA,

    // WebGL 1.0 §5.14.3 "Setting and getting state" — clearColor/clear/viewport
    clearColor(r, g, b, a) { cmds.push({ op: "clearColor", r, g, b, a }); },
    clear(mask) { cmds.push({ op: "clear", mask }); },
    viewport(x, y, w, h) { cmds.push({ op: "viewport", x, y, w, h }); },

    // WebGL 1.0 §5.14.9 "Programs and shaders"
    createShader(shaderType) {
      const id = alloc();
      cmds.push({ op: "createShader", id, shaderType });
      return { id, type: shaderType, source: "", compiled: false, infoLog: "", deleted: false };
    },
    shaderSource(shader, source) {
      shader.source = source;
      cmds.push({ op: "shaderSource", id: shader.id, source });
    },
    compileShader(shader) {
      // Mark as compiled unconditionally — syntax checking is out of scope.
      shader.compiled = true;
      cmds.push({ op: "compileShader", id: shader.id });
    },
    getShaderParameter(shader, pname) {
      if (pname === GL_COMPILE_STATUS) return shader.compiled;
      return 0;
    },
    getShaderInfoLog(shader) { return shader.infoLog; },
    deleteShader(shader) {
      shader.deleted = true;
      cmds.push({ op: "deleteShader", id: shader.id });
    },
    createProgram() {
      const id = alloc();
      cmds.push({ op: "createProgram", id });
      return { id, shaders: [], linked: false, infoLog: "", deleted: false };
    },
    attachShader(program, shader) {
      program.shaders.push(shader);
      cmds.push({ op: "attachShader", program: program.id, shader: shader.id });
    },
    linkProgram(program) {
      // Link succeeds iff all attached shaders compiled.
      program.linked = program.shaders.every(s => s.compiled);
      cmds.push({ op: "linkProgram", id: program.id });
    },
    getProgramParameter(program, pname) {
      if (pname === GL_LINK_STATUS) return program.linked;
      return 0;
    },
    useProgram(program) {
      cmds.push({ op: "useProgram", id: program ? program.id : null });
    },
    deleteProgram(program) {
      program.deleted = true;
      cmds.push({ op: "deleteProgram", id: program.id });
    },

    // WebGL 1.0 §5.14.5 "Buffer objects"
    createBuffer() {
      const id = alloc();
      cmds.push({ op: "createBuffer", id });
      return { id, target: null, data: null, usage: 0, deleted: false };
    },
    bindBuffer(target, buffer) {
      if (buffer) buffer.target = target;
      cmds.push({ op: "bindBuffer", target, id: buffer ? buffer.id : null });
    },
    bufferData(target, data, usage) {
      let size: number;
      if (typeof data === "number") size = data;
      else if (data instanceof ArrayBuffer) size = data.byteLength;
      else size = (data as ArrayBufferView).byteLength;
      cmds.push({ op: "bufferData", target, size, usage });
    },
    deleteBuffer(buffer) {
      buffer.deleted = true;
      cmds.push({ op: "deleteBuffer", id: buffer.id });
    },

    // WebGL 1.0 §5.14.8 "Texture objects"
    createTexture() {
      const id = alloc();
      cmds.push({ op: "createTexture", id });
      return { id, target: null, width: 0, height: 0, internalFormat: 0, format: 0, type: 0, deleted: false };
    },
    bindTexture(target, texture) {
      if (texture) texture.target = target;
      cmds.push({ op: "bindTexture", target, id: texture ? texture.id : null });
    },
    texImage2D(target, level, internalFormat, width, height, _border, format, type, _pixels) {
      cmds.push({ op: "texImage2D", target, level, internalFormat, width, height, format, type });
    },
    texParameteri(target, pname, param) {
      cmds.push({ op: "texParameteri", target, pname, param });
    },
    deleteTexture(texture) {
      texture.deleted = true;
      cmds.push({ op: "deleteTexture", id: texture.id });
    },

    // WebGL 1.0 §5.14.10 "Uniforms and attributes"
    getAttribLocation(_program, name) {
      // Simple deterministic hash: slot based on name length.
      return name.length === 0 ? -1 : (name.charCodeAt(0) & 0x0f);
    },
    enableVertexAttribArray(index) {
      cmds.push({ op: "enableVertexAttribArray", index });
    },
    vertexAttribPointer(index, size, type, normalized, stride, offset) {
      cmds.push({ op: "vertexAttribPointer", index, size, type, normalized, stride, offset });
    },
    getUniformLocation(_program, name) {
      return { id: alloc(), name };
    },
    uniform1f(loc, x)       { cmds.push({ op: "uniform1f", loc: loc.id, x }); },
    uniform2f(loc, x, y)    { cmds.push({ op: "uniform2f", loc: loc.id, x, y }); },
    uniform3f(loc, x, y, z) { cmds.push({ op: "uniform3f", loc: loc.id, x, y, z }); },
    uniform4f(loc, x, y, z, w) { cmds.push({ op: "uniform4f", loc: loc.id, x, y, z, w }); },
    uniform1i(loc, x)       { cmds.push({ op: "uniform1i", loc: loc.id, x }); },
    uniformMatrix4fv(loc, transpose, value) {
      const matrix = Array.from(value);
      cmds.push({ op: "uniformMatrix4fv", loc: loc.id, transpose, matrix });
    },

    // WebGL 1.0 §5.14.11 "Writing to the drawing buffer"
    drawArrays(mode, first, count) {
      cmds.push({ op: "drawArrays", mode, first, count });
    },
    drawElements(mode, count, type, offset) {
      cmds.push({ op: "drawElements", mode, count, type, offset });
    },

    get __commands() { return cmds as ReadonlyArray<WebGLCommand>; },
    __clearCommands() { cmds.length = 0; },
    __isStub: true,
  };

  return ctx;
}
