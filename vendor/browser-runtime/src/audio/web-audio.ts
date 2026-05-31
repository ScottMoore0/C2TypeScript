// Prism M.6 — Web Audio API bindings.
// Provides AudioContext lifecycle + createOscillator / createBufferSource /
// createGain / createPanner wrappers. In Node (no AudioContext), returns
// stub objects that track state so translated code still runs without crashing.
//
// SDL_mixer Mix_PlayChannel / Mix_PlayMusic can be routed through these
// wrappers to play decoded buffers through the real Web Audio graph.

// --- Env detection ---

function getAudioCtor(): any {
  const G: any = (globalThis as any);
  return G.AudioContext ?? G.webkitAudioContext ?? null;
}

function warnOnce(msg: string): void {
  const G: any = (globalThis as any);
  if (G.__browserRuntimeAudioWarned) return;
  G.__browserRuntimeAudioWarned = true;
  try { (G.console ?? console).warn(msg); } catch { /* ignore */ }
}

// --- Stub node types (used in Node for offline state tracking) ---

export interface AudioParamLike {
  value: number;
  setValueAtTime(v: number, t: number): AudioParamLike;
  linearRampToValueAtTime(v: number, t: number): AudioParamLike;
  exponentialRampToValueAtTime(v: number, t: number): AudioParamLike;
}

export interface GainNodeLike {
  gain: AudioParamLike;
  connect(dest: any): any;
  disconnect(dest?: any): void;
}

export interface OscillatorNodeLike {
  type: string;
  frequency: AudioParamLike;
  detune?: AudioParamLike;
  connect(dest: any): any;
  disconnect(dest?: any): void;
  start(when?: number): void;
  stop(when?: number): void;
  onended?: (() => void) | null;
}

export interface AudioBufferLike {
  sampleRate: number;
  length: number;
  numberOfChannels: number;
  duration: number;
  getChannelData(ch: number): Float32Array;
  copyToChannel?(src: Float32Array, ch: number, offset?: number): void;
  copyFromChannel?(dst: Float32Array, ch: number, offset?: number): void;
}

export interface AudioBufferSourceNodeLike {
  buffer: AudioBufferLike | null;
  loop: boolean;
  loopStart?: number;
  loopEnd?: number;
  playbackRate?: AudioParamLike;
  connect(dest: any): any;
  disconnect(dest?: any): void;
  start(when?: number, offset?: number, duration?: number): void;
  stop(when?: number): void;
  onended?: (() => void) | null;
}

export interface PannerNodeLike {
  positionX?: AudioParamLike;
  positionY?: AudioParamLike;
  positionZ?: AudioParamLike;
  setPosition(x: number, y: number, z: number): void;
  connect(dest: any): any;
  disconnect(dest?: any): void;
}

export interface AudioContextLike {
  destination: any;
  sampleRate: number;
  currentTime: number;
  state: string;
  createOscillator(): OscillatorNodeLike;
  createGain(): GainNodeLike;
  createBufferSource(): AudioBufferSourceNodeLike;
  createBuffer(channels: number, length: number, sampleRate: number): AudioBufferLike;
  createPanner(): PannerNodeLike;
  decodeAudioData(buf: ArrayBuffer): Promise<AudioBufferLike>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
}

// --- Stub implementations (Node) ---

function stubParam(initial: number = 0): AudioParamLike {
  const p: AudioParamLike = {
    value: initial,
    setValueAtTime(v: number, _t: number) { p.value = v; return p; },
    linearRampToValueAtTime(v: number, _t: number) { p.value = v; return p; },
    exponentialRampToValueAtTime(v: number, _t: number) { p.value = v; return p; },
  };
  return p;
}

class StubBuffer implements AudioBufferLike {
  readonly sampleRate: number;
  readonly length: number;
  readonly numberOfChannels: number;
  private channels: Float32Array[];
  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channels = [];
    for (let i = 0; i < numberOfChannels; i++) this.channels.push(new Float32Array(length));
  }
  get duration(): number { return this.length / this.sampleRate; }
  getChannelData(ch: number): Float32Array {
    if (ch < 0 || ch >= this.numberOfChannels) throw new Error("channel out of range");
    return this.channels[ch]!;
  }
  copyToChannel(src: Float32Array, ch: number, offset: number = 0): void {
    const dst = this.getChannelData(ch);
    const n = Math.min(src.length, dst.length - offset);
    for (let i = 0; i < n; i++) dst[offset + i] = src[i]!;
  }
  copyFromChannel(dst: Float32Array, ch: number, offset: number = 0): void {
    const src = this.getChannelData(ch);
    const n = Math.min(dst.length, src.length - offset);
    for (let i = 0; i < n; i++) dst[i] = src[offset + i]!;
  }
}

class StubOscillator implements OscillatorNodeLike {
  type: string = "sine";
  frequency: AudioParamLike = stubParam(440);
  detune: AudioParamLike = stubParam(0);
  started: boolean = false;
  stopped: boolean = false;
  onended: (() => void) | null = null;
  connect(dest: any): any { return dest; }
  disconnect(_dest?: any): void { /* no-op */ }
  start(_when?: number): void {
    if (this.started) throw new Error("OscillatorNode already started");
    this.started = true;
  }
  stop(_when?: number): void {
    if (!this.started) throw new Error("OscillatorNode not started");
    this.stopped = true;
    const cb = this.onended;
    if (cb) setTimeout(() => { try { cb(); } catch { /* ignore */ } }, 0);
  }
}

class StubGain implements GainNodeLike {
  gain: AudioParamLike = stubParam(1);
  connect(dest: any): any { return dest; }
  disconnect(_dest?: any): void { /* no-op */ }
}

class StubBufferSource implements AudioBufferSourceNodeLike {
  buffer: AudioBufferLike | null = null;
  loop: boolean = false;
  loopStart?: number;
  loopEnd?: number;
  playbackRate: AudioParamLike = stubParam(1);
  started: boolean = false;
  stopped: boolean = false;
  onended: (() => void) | null = null;
  connect(dest: any): any { return dest; }
  disconnect(_dest?: any): void { /* no-op */ }
  start(_when?: number, _offset?: number, _duration?: number): void {
    if (this.started) throw new Error("AudioBufferSourceNode already started");
    this.started = true;
  }
  stop(_when?: number): void {
    if (!this.started) return;
    this.stopped = true;
    const cb = this.onended;
    if (cb) setTimeout(() => { try { cb(); } catch { /* ignore */ } }, 0);
  }
}

class StubPanner implements PannerNodeLike {
  positionX: AudioParamLike = stubParam(0);
  positionY: AudioParamLike = stubParam(0);
  positionZ: AudioParamLike = stubParam(0);
  setPosition(x: number, y: number, z: number): void {
    this.positionX!.value = x; this.positionY!.value = y; this.positionZ!.value = z;
  }
  connect(dest: any): any { return dest; }
  disconnect(_dest?: any): void { /* no-op */ }
}

class StubAudioContext implements AudioContextLike {
  destination: any = { kind: "destination" };
  sampleRate: number;
  private _started = performance.now();
  state: string = "running";
  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }
  get currentTime(): number { return (performance.now() - this._started) / 1000; }
  createOscillator(): OscillatorNodeLike { return new StubOscillator(); }
  createGain(): GainNodeLike { return new StubGain(); }
  createBufferSource(): AudioBufferSourceNodeLike { return new StubBufferSource(); }
  createBuffer(channels: number, length: number, sampleRate: number): AudioBufferLike {
    return new StubBuffer(channels, length, sampleRate);
  }
  createPanner(): PannerNodeLike { return new StubPanner(); }
  async decodeAudioData(buf: ArrayBuffer): Promise<AudioBufferLike> {
    // No real decode in Node; produce an empty 1-sample stub.
    return new StubBuffer(2, Math.max(1, buf.byteLength / 4 | 0), this.sampleRate);
  }
  async resume(): Promise<void> { this.state = "running"; }
  async suspend(): Promise<void> { this.state = "suspended"; }
  async close(): Promise<void> { this.state = "closed"; }
}

// --- Public API ---

/**
 * Create a new AudioContext. Uses real Web Audio when available,
 * otherwise a stub suitable for Node tests.
 * Spec: https://www.w3.org/TR/webaudio/#AudioContext
 */
export function createAudioContext(sampleRate?: number): AudioContextLike {
  const Ctor = getAudioCtor();
  if (Ctor) {
    try {
      return sampleRate ? new Ctor({ sampleRate }) : new Ctor();
    } catch {
      // fall through to stub
    }
  }
  warnOnce("[browser-runtime] createAudioContext: Web Audio unavailable — using stub");
  return new StubAudioContext(sampleRate ?? 44100);
}

/**
 * createOscillator — Web Audio API OscillatorNode.
 * Spec: https://www.w3.org/TR/webaudio/#OscillatorNode
 */
export function createOscillator(ctx: AudioContextLike, type: string = "sine", frequency: number = 440): OscillatorNodeLike {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  return osc;
}

/**
 * createGain — Web Audio API GainNode.
 * Spec: https://www.w3.org/TR/webaudio/#GainNode
 */
export function createGain(ctx: AudioContextLike, initial: number = 1): GainNodeLike {
  const g = ctx.createGain();
  g.gain.value = initial;
  return g;
}

/**
 * createBufferSource — Web Audio API AudioBufferSourceNode.
 * Spec: https://www.w3.org/TR/webaudio/#AudioBufferSourceNode
 */
export function createBufferSource(ctx: AudioContextLike, buffer?: AudioBufferLike): AudioBufferSourceNodeLike {
  const src = ctx.createBufferSource();
  if (buffer) src.buffer = buffer;
  return src;
}

/**
 * createPanner — Web Audio API PannerNode (basic spatial audio).
 * Spec: https://www.w3.org/TR/webaudio/#PannerNode
 */
export function createPanner(ctx: AudioContextLike, x: number = 0, y: number = 0, z: number = 0): PannerNodeLike {
  const p = ctx.createPanner();
  p.setPosition(x, y, z);
  return p;
}

/**
 * createBuffer — AudioBuffer with the given shape.
 * Spec: https://www.w3.org/TR/webaudio/#AudioBuffer
 */
export function createBuffer(ctx: AudioContextLike, channels: number, length: number, sampleRate?: number): AudioBufferLike {
  return ctx.createBuffer(channels, length, sampleRate ?? ctx.sampleRate);
}

/**
 * decodeAudioData — async decode of an encoded buffer.
 * Spec: https://www.w3.org/TR/webaudio/#dom-baseaudiocontext-decodeaudiodata
 */
export async function decodeAudioDataAsync(ctx: AudioContextLike, data: ArrayBuffer): Promise<AudioBufferLike> {
  return ctx.decodeAudioData(data);
}

/** Convenience: play a buffer through a gain node on a context. Returns the source. */
export function playBuffer(
  ctx: AudioContextLike, buffer: AudioBufferLike, volume: number = 1, loop: boolean = false
): AudioBufferSourceNodeLike {
  const src = createBufferSource(ctx, buffer);
  src.loop = loop;
  const g = createGain(ctx, volume);
  src.connect(g).connect(ctx.destination);
  src.start(0);
  return src;
}

// --- SDL_mixer bridge ---
// Allow translated code to route Mix_PlayChannel / Mix_PlayMusic onto a single
// shared AudioContext. The bridge is state-only in Node, real audio in browsers.

let sharedContext: AudioContextLike | null = null;

/** Return a shared AudioContext, creating on first access. */
export function getSharedAudioContext(): AudioContextLike {
  if (!sharedContext) sharedContext = createAudioContext();
  return sharedContext;
}

/** Reset shared context (tests). */
export function resetSharedAudioContext(): void {
  if (sharedContext) {
    try { void sharedContext.close(); } catch { /* ignore */ }
  }
  sharedContext = null;
}

/**
 * Play raw PCM (float32, interleaved or per-channel) through the shared context.
 * Useful as a backend for Mix_PlayChannel given a pre-decoded buffer.
 */
export function playPcm(
  channels: Float32Array[], sampleRate: number, volume: number = 1
): AudioBufferSourceNodeLike {
  const ctx = getSharedAudioContext();
  const length = channels[0]?.length ?? 0;
  const buf = createBuffer(ctx, channels.length, length, sampleRate);
  for (let c = 0; c < channels.length; c++) {
    const dst = buf.getChannelData(c);
    const src = channels[c]!;
    const n = Math.min(dst.length, src.length);
    for (let i = 0; i < n; i++) dst[i] = src[i]!;
  }
  return playBuffer(ctx, buf, volume, false);
}
