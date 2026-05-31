// PC-7: Audio manager — basic clip load/play/stop.
// In-memory implementation for testing; browser version would use Web Audio API.

import type { AudioAdapter } from "../adapters.js";

interface AudioClip {
  id: number;
  data: Uint8Array;
  format: string;
}

interface Channel {
  id: number;
  clipId: number;
  volume: number;
  playing: boolean;
  loops: number;
}

export class AudioManager implements AudioAdapter {
  private clips = new Map<number, AudioClip>();
  private channels = new Map<number, Channel>();
  private nextClipId = 1;
  private nextChannelId = 1;
  private initialized = false;
  private sampleRate = 44100;
  private channelCount = 2;

  init(sampleRate: number = 44100, channels: number = 2): void {
    this.sampleRate = sampleRate;
    this.channelCount = channels;
    this.initialized = true;
  }

  loadClip(data: Uint8Array, format: string = "wav"): number {
    const id = this.nextClipId++;
    this.clips.set(id, { id, data: data.slice(), format });
    return id;
  }

  playClip(clipId: number, loops: number = 0): number {
    if (!this.clips.has(clipId)) return -1;
    const id = this.nextChannelId++;
    this.channels.set(id, { id, clipId, volume: 1.0, playing: true, loops });
    return id;
  }

  stopChannel(channel: number): void {
    const ch = this.channels.get(channel);
    if (ch) ch.playing = false;
  }

  setVolume(channel: number, volume: number): void {
    const ch = this.channels.get(channel);
    if (ch) ch.volume = Math.max(0, Math.min(1, volume));
  }

  destroy(): void {
    this.clips.clear();
    this.channels.clear();
    this.initialized = false;
  }

  // --- Test helpers ---

  get isInitialized(): boolean { return this.initialized; }
  get clipCount(): number { return this.clips.size; }
  get activeChannels(): number {
    let count = 0;
    for (const ch of this.channels.values()) if (ch.playing) count++;
    return count;
  }
  getChannel(id: number): Channel | undefined { return this.channels.get(id); }
}
