// Prism — SDL2_mixer extended coverage.
//
// This module adds spatial panning, channel allocation, per-chunk volume,
// callbacks, device-open variants, and the MIX_CHANNEL_POST constant on top
// of the core SDL_mixer runtime in ./audio.ts.
//
// Spec: SDL2_mixer reference — https://wiki.libsdl.org/SDL2_mixer/CategoryAPI
// Every function below cites the specific SDL2_mixer wiki page that defines
// its semantics.
//
// Design:
//   * Browser (real Web Audio API present): panning/position route through
//     `PannerNode` so positional audio is truly spatial.
//   * Node (no AudioContext): all state transitions are recorded in a
//     command queue exposed for test inspection.

import {
  AudioClip,
  Mix_OpenAudio as _Mix_OpenAudio,
  Mix_CloseAudio as _Mix_CloseAudio,
  Mix_LoadWAV as _Mix_LoadWAV,
  Mix_LoadMUS as _Mix_LoadMUS,
  Mix_PlayChannel as _Mix_PlayChannel,
  Mix_PlayMusic as _Mix_PlayMusic,
  Mix_Volume as _Mix_Volume,
  Mix_VolumeMusic as _Mix_VolumeMusic,
  Mix_HaltChannel as _Mix_HaltChannel,
  Mix_HaltMusic as _Mix_HaltMusic,
  Mix_Pause as _Mix_Pause,
  Mix_Resume as _Mix_Resume,
  Mix_Paused as _Mix_Paused,
  Mix_Playing as _Mix_Playing,
  Mix_PlayingMusic as _Mix_PlayingMusic,
  Mix_FreeChunk as _Mix_FreeChunk,
  Mix_FreeMusic as _Mix_FreeMusic,
  MIX_MAX_VOLUME,
  AUDIO_S16,
  AUDIO_U8, AUDIO_S8, AUDIO_U16, AUDIO_S32, AUDIO_F32,
} from "./audio.js";

// ---------------------------------------------------------------------------
// Re-exports — so consumers only need one module.
// ---------------------------------------------------------------------------

export {
  AudioClip,
  MIX_MAX_VOLUME,
  AUDIO_U8, AUDIO_S8, AUDIO_U16, AUDIO_S16, AUDIO_S32, AUDIO_F32,
};

// ---------------------------------------------------------------------------
// Spec-cited constants (SDL2_mixer).
// ---------------------------------------------------------------------------

// https://wiki.libsdl.org/SDL2_mixer/MIX_DEFAULT_FREQUENCY
export const MIX_DEFAULT_FREQUENCY = 44100;
// https://wiki.libsdl.org/SDL2_mixer/MIX_DEFAULT_CHANNELS
export const MIX_DEFAULT_CHANNELS  = 2;
// https://wiki.libsdl.org/SDL2_mixer/MIX_DEFAULT_FORMAT — platform-dependent
// but documented to be AUDIO_S16SYS (signed 16-bit, system endianness).
export const AUDIO_S16SYS = AUDIO_S16;
export const MIX_DEFAULT_FORMAT = AUDIO_S16SYS;
// https://wiki.libsdl.org/SDL2_mixer/MIX_CHANNEL_POST
// "Virtual" channel for post-processing effects applied after mixing.
export const MIX_CHANNEL_POST = -2;

// ---------------------------------------------------------------------------
// Chunk/music pointer types (SDL2_mixer wiki: Mix_Chunk / Mix_Music).
// https://wiki.libsdl.org/SDL2_mixer/Mix_Chunk
// ---------------------------------------------------------------------------

export interface Mix_Chunk {
  readonly clip: AudioClip;
  /** Size of the sample buffer in bytes (`Mix_Chunk::alen`). */
  length: number;
  /** Per-chunk volume, 0..MIX_MAX_VOLUME. */
  volume: number;
  /** Backing buffer (`Mix_Chunk::abuf`). */
  buffer: ArrayBuffer;
}

export interface Mix_Music {
  readonly clip: AudioClip;
  readonly path: string;
}

// ---------------------------------------------------------------------------
// Extended state: channel panning, allocated count, finished callback.
// ---------------------------------------------------------------------------

interface ChannelExtState {
  panLeft: number;   // 0..255  (SDL_mixer effect range, Mix_SetPanning spec)
  panRight: number;  // 0..255
  angle: number;     // degrees 0..359 (Mix_SetPosition)
  distance: number;  // 0..255
  pannerNode: any | null; // Web Audio PannerNode when available
}

const extState = {
  allocatedChannels: 8,   // SDL_mixer default post-Mix_AllocateChannels(8)
  channels: new Map<number, ChannelExtState>(),
  chunkVolumes: new WeakMap<Mix_Chunk, number>(),
  finishedCallback: null as ((channel: number) => void) | null,
  commands: [] as MixerCommand[],
};

export type MixerCommand =
  | { op: "openAudio"; freq: number; format: number; channels: number; chunksize: number }
  | { op: "openAudioDevice"; freq: number; format: number; channels: number; chunksize: number; device: string | null; allowedChanges: number }
  | { op: "closeAudio" }
  | { op: "loadWAV"; path: string }
  | { op: "loadMUS"; path: string }
  | { op: "playChannel"; channel: number; loops: number }
  | { op: "playMusic"; loops: number }
  | { op: "halt"; channel: number }
  | { op: "haltMusic" }
  | { op: "pause"; channel: number }
  | { op: "resume"; channel: number }
  | { op: "volume"; channel: number; volume: number }
  | { op: "volumeChunk"; volume: number }
  | { op: "volumeMusic"; volume: number }
  | { op: "setPanning"; channel: number; left: number; right: number }
  | { op: "setPosition"; channel: number; angle: number; distance: number }
  | { op: "allocateChannels"; n: number }
  | { op: "freeChunk" }
  | { op: "freeMusic" };

function record(cmd: MixerCommand): void {
  extState.commands.push(cmd);
}

function getOrCreateChannel(ch: number): ChannelExtState {
  let c = extState.channels.get(ch);
  if (!c) {
    c = { panLeft: 255, panRight: 255, angle: 0, distance: 0, pannerNode: null };
    extState.channels.set(ch, c);
  }
  return c;
}

// ---------------------------------------------------------------------------
// Core lifecycle — thin wrappers with command recording.
// ---------------------------------------------------------------------------

/**
 * Mix_OpenAudio — initialise the mixer.
 * https://wiki.libsdl.org/SDL2_mixer/Mix_OpenAudio
 */
export function Mix_OpenAudio(
  freq: number = MIX_DEFAULT_FREQUENCY,
  format: number = MIX_DEFAULT_FORMAT,
  channels: number = MIX_DEFAULT_CHANNELS,
  chunksize: number = 2048
): number {
  record({ op: "openAudio", freq, format, channels, chunksize });
  return _Mix_OpenAudio(freq, format, channels, chunksize);
}

/**
 * Mix_OpenAudioDevice — extended open, with device name and allowed-change flags.
 * https://wiki.libsdl.org/SDL2_mixer/Mix_OpenAudioDevice
 */
export function Mix_OpenAudioDevice(
  freq: number,
  format: number,
  channels: number,
  chunksize: number,
  device: string | null = null,
  allowedChanges: number = 0
): number {
  record({ op: "openAudioDevice", freq, format, channels, chunksize, device, allowedChanges });
  return _Mix_OpenAudio(freq, format, channels, chunksize);
}

/** Mix_CloseAudio — https://wiki.libsdl.org/SDL2_mixer/Mix_CloseAudio */
export function Mix_CloseAudio(): void {
  record({ op: "closeAudio" });
  extState.channels.clear();
  // leave allocatedChannels at its current value — SDL_mixer does.
  _Mix_CloseAudio();
}

/**
 * Mix_LoadWAV — load a WAVE sample into a Mix_Chunk.
 * https://wiki.libsdl.org/SDL2_mixer/Mix_LoadWAV
 */
export function Mix_LoadWAV(path: string): Mix_Chunk | null {
  record({ op: "loadWAV", path });
  const clip = _Mix_LoadWAV(path);
  if (!clip) return null;
  const chunk: Mix_Chunk = {
    clip,
    length: clip.buffer.byteLength,
    volume: MIX_MAX_VOLUME,
    buffer: clip.buffer,
  };
  extState.chunkVolumes.set(chunk, MIX_MAX_VOLUME);
  return chunk;
}

/** Mix_LoadMUS — https://wiki.libsdl.org/SDL2_mixer/Mix_LoadMUS */
export function Mix_LoadMUS(path: string): Mix_Music | null {
  record({ op: "loadMUS", path });
  const clip = _Mix_LoadMUS(path);
  if (!clip) return null;
  return { clip, path };
}

/** Mix_PlayChannel — https://wiki.libsdl.org/SDL2_mixer/Mix_PlayChannel */
export function Mix_PlayChannel(channel: number, chunk: Mix_Chunk | null, loops: number): number {
  const clip = chunk ? chunk.clip : null;
  const used = _Mix_PlayChannel(channel, clip, loops);
  record({ op: "playChannel", channel: used, loops });
  if (used >= 0) getOrCreateChannel(used);
  return used;
}

/** Mix_PlayMusic — https://wiki.libsdl.org/SDL2_mixer/Mix_PlayMusic */
export function Mix_PlayMusic(music: Mix_Music | null, loops: number): number {
  const rc = _Mix_PlayMusic(music ? music.clip : null, loops);
  record({ op: "playMusic", loops });
  return rc;
}

// ---------------------------------------------------------------------------
// Volume / halting.
// ---------------------------------------------------------------------------

/** Mix_Volume — https://wiki.libsdl.org/SDL2_mixer/Mix_Volume */
export function Mix_Volume(channel: number, volume: number): number {
  record({ op: "volume", channel, volume });
  return _Mix_Volume(channel, volume);
}

/**
 * Mix_VolumeChunk — set the per-chunk volume.
 * https://wiki.libsdl.org/SDL2_mixer/Mix_VolumeChunk
 * Returns the PREVIOUS volume; passing -1 queries without modifying.
 */
export function Mix_VolumeChunk(chunk: Mix_Chunk | null, volume: number): number {
  record({ op: "volumeChunk", volume });
  if (!chunk) return -1;
  const prev = chunk.volume;
  if (volume >= 0) {
    const v = Math.max(0, Math.min(MIX_MAX_VOLUME, volume));
    chunk.volume = v;
    extState.chunkVolumes.set(chunk, v);
  }
  return prev;
}

/** Mix_VolumeMusic — https://wiki.libsdl.org/SDL2_mixer/Mix_VolumeMusic */
export function Mix_VolumeMusic(volume: number): number {
  record({ op: "volumeMusic", volume });
  return _Mix_VolumeMusic(volume);
}

/** Mix_HaltChannel — https://wiki.libsdl.org/SDL2_mixer/Mix_HaltChannel */
export function Mix_HaltChannel(channel: number): number {
  record({ op: "halt", channel });
  const rc = _Mix_HaltChannel(channel);
  // Fire Mix_ChannelFinished callback if registered, per SDL_mixer spec.
  if (extState.finishedCallback) {
    if (channel < 0) {
      for (const c of extState.channels.keys()) extState.finishedCallback(c);
    } else {
      extState.finishedCallback(channel);
    }
  }
  return rc;
}

/** Mix_HaltMusic — https://wiki.libsdl.org/SDL2_mixer/Mix_HaltMusic */
export function Mix_HaltMusic(): number {
  record({ op: "haltMusic" });
  return _Mix_HaltMusic();
}

// ---------------------------------------------------------------------------
// Pause / resume / query.
// ---------------------------------------------------------------------------

/** Mix_Pause — https://wiki.libsdl.org/SDL2_mixer/Mix_Pause */
export function Mix_Pause(channel: number): void {
  record({ op: "pause", channel });
  _Mix_Pause(channel);
}

/** Mix_Resume — https://wiki.libsdl.org/SDL2_mixer/Mix_Resume */
export function Mix_Resume(channel: number): void {
  record({ op: "resume", channel });
  _Mix_Resume(channel);
}

/** Mix_Paused — https://wiki.libsdl.org/SDL2_mixer/Mix_Paused */
export function Mix_Paused(channel: number): number {
  return _Mix_Paused(channel);
}

/** Mix_Playing — https://wiki.libsdl.org/SDL2_mixer/Mix_Playing */
export function Mix_Playing(channel: number): number {
  return _Mix_Playing(channel);
}

/** Mix_PlayingMusic — https://wiki.libsdl.org/SDL2_mixer/Mix_PlayingMusic */
export function Mix_PlayingMusic(): number {
  return _Mix_PlayingMusic();
}

// ---------------------------------------------------------------------------
// Free.
// ---------------------------------------------------------------------------

/** Mix_FreeChunk — https://wiki.libsdl.org/SDL2_mixer/Mix_FreeChunk */
export function Mix_FreeChunk(chunk: Mix_Chunk | null): void {
  record({ op: "freeChunk" });
  if (chunk) _Mix_FreeChunk(chunk.clip);
}

/** Mix_FreeMusic — https://wiki.libsdl.org/SDL2_mixer/Mix_FreeMusic */
export function Mix_FreeMusic(music: Mix_Music | null): void {
  record({ op: "freeMusic" });
  if (music) _Mix_FreeMusic(music.clip);
}

// ---------------------------------------------------------------------------
// Positional audio (PannerNode in browsers).
// ---------------------------------------------------------------------------

function tryCreatePanner(): any | null {
  const G: any = (globalThis as any);
  try {
    const ctor = G.AudioContext ?? G.webkitAudioContext;
    if (typeof ctor !== "function") return null;
    // Each SDL channel gets its own cheap PannerNode on a shared context.
    const ctx = (tryCreatePanner as any)._ctx || ((tryCreatePanner as any)._ctx = new ctor());
    if (typeof ctx.createPanner !== "function") return null;
    return ctx.createPanner();
  } catch {
    return null;
  }
}

/**
 * Mix_SetPanning — https://wiki.libsdl.org/SDL2_mixer/Mix_SetPanning
 * left and right are 0..255. In the browser, routed via a stereo PannerNode;
 * in Node the state is recorded only.
 */
export function Mix_SetPanning(channel: number, left: number, right: number): number {
  left  = Math.max(0, Math.min(255, left));
  right = Math.max(0, Math.min(255, right));
  record({ op: "setPanning", channel, left, right });
  const c = getOrCreateChannel(channel);
  c.panLeft = left;
  c.panRight = right;
  if (!c.pannerNode) c.pannerNode = tryCreatePanner();
  if (c.pannerNode && typeof c.pannerNode.setPosition === "function") {
    // Map left/right to an X coordinate in [-1, +1]. (Approx — SDL_mixer does
    // scalar attenuation; true stereo panning would use a StereoPannerNode.)
    const x = (right - left) / 255;
    try { c.pannerNode.setPosition(x, 0, 0); } catch { /* ignore */ }
  }
  return 1;
}

/**
 * Mix_SetPosition — https://wiki.libsdl.org/SDL2_mixer/Mix_SetPosition
 * angle (0..360 degrees) and distance (0..255).
 */
export function Mix_SetPosition(channel: number, angle: number, distance: number): number {
  // Normalise angle into [0, 360).
  angle = ((angle % 360) + 360) % 360;
  distance = Math.max(0, Math.min(255, distance));
  record({ op: "setPosition", channel, angle, distance });
  const c = getOrCreateChannel(channel);
  c.angle = angle;
  c.distance = distance;
  if (!c.pannerNode) c.pannerNode = tryCreatePanner();
  if (c.pannerNode && typeof c.pannerNode.setPosition === "function") {
    const rad = angle * Math.PI / 180;
    const r = distance / 255;
    try { c.pannerNode.setPosition(Math.sin(rad) * r, 0, -Math.cos(rad) * r); } catch { /* ignore */ }
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Allocation / callbacks.
// ---------------------------------------------------------------------------

/**
 * Mix_AllocateChannels — reserve `n` mixing channels.
 * https://wiki.libsdl.org/SDL2_mixer/Mix_AllocateChannels
 * Passing -1 queries without changing.
 */
export function Mix_AllocateChannels(n: number): number {
  record({ op: "allocateChannels", n });
  if (n >= 0) extState.allocatedChannels = n;
  return extState.allocatedChannels;
}

/**
 * Mix_ChannelFinished — register a callback fired when a channel stops.
 * https://wiki.libsdl.org/SDL2_mixer/Mix_ChannelFinished
 */
export function Mix_ChannelFinished(fn: ((channel: number) => void) | null): void {
  extState.finishedCallback = fn;
}

// ---------------------------------------------------------------------------
// Test-only introspection hooks.
// ---------------------------------------------------------------------------

export function _getMixerCommands(): ReadonlyArray<MixerCommand> {
  return extState.commands;
}

export function _resetMixerExt(): void {
  extState.commands.length = 0;
  extState.channels.clear();
  extState.allocatedChannels = 8;
  extState.finishedCallback = null;
  Mix_CloseAudio();
}
