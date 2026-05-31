// PC-2: In-memory storage adapter.
// Used for testing and Node.js environments where IndexedDB isn't available.
// Also serves as the reference implementation for the StorageAdapter interface.

import type { StorageAdapter } from "../adapters.js";

export class MemoryStorage implements StorageAdapter {
  private store = new Map<string, Uint8Array>();

  async save(key: string, data: Uint8Array): Promise<void> {
    this.store.set(key, data.slice()); // defensive copy
  }

  async load(key: string): Promise<Uint8Array | null> {
    const data = this.store.get(key);
    return data ? data.slice() : null; // defensive copy
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys()).sort();
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  /** Sync accessor for testing. */
  get size(): number {
    return this.store.size;
  }
}
