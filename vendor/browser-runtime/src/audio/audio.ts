// Tier 3 Category A — SDL_mixer emulation over Web Audio API.
// When AudioContext is unavailable (Node), state is tracked without playback.

// --- SDL_mixer audio format constants ---
export const AUDIO_U8  = 0x0008;
export const AUDIO_S8  = 0x8008;
export const AUDIO_U16 = 0x0010;
export const AUDIO_S16 = 0x8010;
export const AUDIO_S32 = 0x8020;
export const AUDIO_F32 = 0x8120;

export const MIX_MAX_VOLUME = 128;
export const MIX_DEFAULT_FREQUENCY = 44100;
export const MIX_DEFAULT_CHANNELS = 2;

// --- Audio runtime state ---

interface MixerState {
  initialized: boolean;
  frequency: number;
  format: number;
  channels: number;
  chunksize: number;
  audioCtx: any | null;
  musicVolume: number;
  musicPlaying: boolean;
  musicPaused: boolean;
  currentMusic: AudioClip | null;
  channelSlots: Map<number, ChannelState>;
  nextAllocatedChannel: number;
}

interface ChannelState {
  clip: AudioClip | null;
  volume: number;
  playing: boolean;
  paused: boolean;
  loops: number;
}

const state: MixerState = {
  initialized: false,
  frequency: MIX_DEFAULT_FREQUENCY,
  format: AUDIO_S16,
  channels: MIX_DEFAULT_CHANNELS,
  chunksize: 2048,
  audioCtx: null,
  musicVolume: MIX_MAX_VOLUME,
  musicPlaying: false,
  musicPaused: false,
  currentMusic: null,
  channelSlots: new Map(),
  nextAllocatedChannel: 0,
};

function hasAudioContext(): boolean {
  const G: any = (globalThis as any);
  return typeof G.AudioContext === "function" || typeof G.webkitAudioContext === "function";
}

function tryCreateAudioContext(): any | null {
  const G: any = (globalThis as any);
  try {
    if (typeof G.AudioContext === "function") return new G.AudioContext();
    if (typeof G.webkitAudioContext === "function") return new G.webkitAudioContext();
  } catch {
    return null;
  }
  return null;
}

/**
 * AudioClip — wraps an ArrayBuffer of encoded/raw audio bytes.
 * Playback is only attempted when a live AudioContext exists.
 */
export class AudioClip {
  readonly buffer: ArrayBuffer;
  readonly sampleRate: number;
  private _isPlaying = false;
  private _source: any | null = null;

  constructor(buffer: ArrayBuffer, sampleRate: number = MIX_DEFAULT_FREQUENCY) {
    this.buffer = buffer;
    this.sampleRate = sampleRate;
  }

  get isPlaying(): boolean { return this._isPlaying; }

  play(volume: number = 1.0, loop: boolean = false): void {
    this._isPlaying = true;
    const ctx = state.audioCtx;
    if (!ctx || this.buffer.byteLength === 0) {
      // State-only mode (Node).
      return;
    }
    try {
      if (typeof ctx.decodeAudioData !== "function") return;
      // Fire-and-forget decode+play. Not awaited so tests remain synchronous.
      ctx.decodeAudioData(this.buffer.slice(0)).then((decoded: any) => {
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.loop = loop;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        src.connect(gain).connect(ctx.destination);
        src.start(0);
        this._source = src;
        src.onended = () => { this._isPlaying = false; this._source = null; };
      }).catch(() => { this._isPlaying = false; });
    } catch {
      this._isPlaying = false;
    }
  }

  stop(): void {
    this._isPlaying = false;
    if (this._source && typeof this._source.stop === "function") {
      try { this._source.stop(); } catch { /* ignore */ }
    }
    this._source = null;
  }
}

// --- SDL_mixer API ---

export function Mix_OpenAudio(freq: number, format: number, channels: number, chunksize: number): number {
  state.frequency = freq || MIX_DEFAULT_FREQUENCY;
  state.format = format || AUDIO_S16;
  state.channels = channels || MIX_DEFAULT_CHANNELS;
  state.chunksize = chunksize || 2048;
  state.initialized = true;
  if (hasAudioContext()) {
    state.audioCtx = tryCreateAudioContext();
  }
  return 0;
}

export function Mix_CloseAudio(): void {
  // Halt everything and tear down.
  for (const ch of state.channelSlots.values()) {
    ch.playing = false;
    ch.paused = false;
    if (ch.clip) ch.clip.stop();
  }
  state.channelSlots.clear();
  state.musicPlaying = false;
  state.musicPaused = false;
  if (state.currentMusic) state.currentMusic.stop();
  state.currentMusic = null;
  if (state.audioCtx && typeof state.audioCtx.close === "function") {
    try { state.audioCtx.close(); } catch { /* ignore */ }
  }
  state.audioCtx = null;
  state.initialized = false;
  state.nextAllocatedChannel = 0;
}

export function Mix_LoadWAV(_path: string): AudioClip | null {
  // Cannot perform real file I/O here; return an empty clip stub.
  return new AudioClip(new ArrayBuffer(0), state.frequency);
}

export function Mix_LoadMUS(_path: string): AudioClip | null {
  return new AudioClip(new ArrayBuffer(0), state.frequency);
}

export function Mix_PlayChannel(channel: number, chunk: AudioClip | null, loops: number): number {
  if (!chunk) return -1;
  let ch = channel;
  if (ch < 0) {
    // Auto-allocate next free channel.
    ch = state.nextAllocatedChannel++;
  } else if (ch >= state.nextAllocatedChannel) {
    state.nextAllocatedChannel = ch + 1;
  }
  const existing = state.channelSlots.get(ch);
  const prevVolume = existing?.volume ?? MIX_MAX_VOLUME;
  const slot: ChannelState = {
    clip: chunk,
    volume: prevVolume,
    playing: true,
    paused: false,
    loops: loops,
  };
  state.channelSlots.set(ch, slot);
  chunk.play(prevVolume / MIX_MAX_VOLUME, loops !== 0);
  return ch;
}

export function Mix_PlayMusic(music: AudioClip | null, loops: number): number {
  if (!music) return -1;
  state.currentMusic = music;
  state.musicPlaying = true;
  state.musicPaused = false;
  music.play(state.musicVolume / MIX_MAX_VOLUME, loops !== 0);
  return 0;
}

export function Mix_Volume(channel: number, volume: number): number {
  if (channel < 0) {
    // Apply to all channels; return average previous.
    let prev = 0; let n = 0;
    for (const ch of state.channelSlots.values()) { prev += ch.volume; n++; }
    const avg = n ? Math.floor(prev / n) : MIX_MAX_VOLUME;
    if (volume >= 0) {
      const v = Math.max(0, Math.min(MIX_MAX_VOLUME, volume));
      for (const ch of state.channelSlots.values()) ch.volume = v;
    }
    return avg;
  }
  let slot = state.channelSlots.get(channel);
  if (!slot) {
    slot = { clip: null, volume: MIX_MAX_VOLUME, playing: false, paused: false, loops: 0 };
    state.channelSlots.set(channel, slot);
  }
  const previous = slot.volume;
  if (volume >= 0) slot.volume = Math.max(0, Math.min(MIX_MAX_VOLUME, volume));
  return previous;
}

export function Mix_VolumeMusic(volume: number): number {
  const prev = state.musicVolume;
  if (volume >= 0) state.musicVolume = Math.max(0, Math.min(MIX_MAX_VOLUME, volume));
  return prev;
}

export function Mix_HaltChannel(channel: number): number {
  if (channel < 0) {
    for (const ch of state.channelSlots.values()) {
      ch.playing = false;
      ch.paused = false;
      if (ch.clip) ch.clip.stop();
    }
  } else {
    const ch = state.channelSlots.get(channel);
    if (ch) {
      ch.playing = false;
      ch.paused = false;
      if (ch.clip) ch.clip.stop();
    }
  }
  return 0;
}

export function Mix_HaltMusic(): number {
  state.musicPlaying = false;
  state.musicPaused = false;
  if (state.currentMusic) state.currentMusic.stop();
  return 0;
}

export function Mix_Paused(channel: number): number {
  if (channel < 0) {
    let n = 0;
    for (const ch of state.channelSlots.values()) if (ch.paused) n++;
    return n;
  }
  const ch = state.channelSlots.get(channel);
  return ch && ch.paused ? 1 : 0;
}

export function Mix_Playing(channel: number): number {
  if (channel < 0) {
    let n = 0;
    for (const ch of state.channelSlots.values()) if (ch.playing) n++;
    return n;
  }
  const ch = state.channelSlots.get(channel);
  return ch && ch.playing ? 1 : 0;
}

export function Mix_Pause(channel: number): void {
  if (channel < 0) {
    for (const ch of state.channelSlots.values()) { if (ch.playing) ch.paused = true; }
  } else {
    const ch = state.channelSlots.get(channel);
    if (ch && ch.playing) ch.paused = true;
  }
}

export function Mix_Resume(channel: number): void {
  if (channel < 0) {
    for (const ch of state.channelSlots.values()) ch.paused = false;
  } else {
    const ch = state.channelSlots.get(channel);
    if (ch) ch.paused = false;
  }
}

export function Mix_PauseMusic(): void {
  if (state.musicPlaying) state.musicPaused = true;
}

export function Mix_ResumeMusic(): void {
  state.musicPaused = false;
}

export function Mix_PausedMusic(): number {
  return state.musicPaused ? 1 : 0;
}

export function Mix_PlayingMusic(): number {
  return state.musicPlaying ? 1 : 0;
}

export function Mix_FreeChunk(chunk: AudioClip | null): void {
  if (chunk) chunk.stop();
}

export function Mix_FreeMusic(music: AudioClip | null): void {
  if (music) {
    music.stop();
    if (state.currentMusic === music) {
      state.currentMusic = null;
      state.musicPlaying = false;
    }
  }
}

/** Test-only: reset all internal state (used between tests). */
export function _resetMixerState(): void {
  Mix_CloseAudio();
}
