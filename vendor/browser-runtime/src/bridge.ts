// PC-9: PrismBridge — the composed capability bridge.
// Assembles all adapters into one interface that translated programs can use.

import type {
  StorageAdapter, DisplayAdapter, InputAdapter,
  AudioAdapter, NetworkAdapter
} from "./adapters.js";
import { MemoryStorage } from "./storage/memory-storage.js";
import { CanvasDisplay } from "./display/canvas-display.js";
import { SDL } from "./display/sdl.js";
import { InputManager } from "./input/input-manager.js";
import { AudioManager } from "./audio/audio-manager.js";
import { NetworkStub } from "./network/network-stub.js";

export interface PrismConfig {
  storage?: StorageAdapter;
  display?: DisplayAdapter;
  input?: InputAdapter;
  audio?: AudioAdapter;
  network?: NetworkAdapter;
}

export class PrismBridge {
  readonly storage: StorageAdapter;
  readonly display: DisplayAdapter;
  readonly input: InputAdapter;
  readonly audio: AudioAdapter;
  readonly network: NetworkAdapter;
  readonly sdl: SDL;

  constructor(config?: PrismConfig) {
    this.input = config?.input ?? new InputManager();
    this.display = config?.display ?? new CanvasDisplay();
    this.storage = config?.storage ?? new MemoryStorage();
    this.audio = config?.audio ?? new AudioManager();
    this.network = config?.network ?? new NetworkStub();
    this.sdl = new SDL(this.display, this.input);
  }
}
