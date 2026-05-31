// Prism M.7 — Web Storage API adapter (localStorage / sessionStorage).
// Implements StorageAdapter by base64-encoding Uint8Array values.
// Falls back to an in-memory Map when `localStorage` is unavailable (Node).

import type { StorageAdapter } from "../adapters.js";

// --- base64 helpers (browser + Node) ---

function u8ToBase64(bytes: Uint8Array): string {
  const G: any = (globalThis as any);
  if (typeof G.Buffer === "function" && typeof G.Buffer.from === "function") {
    return G.Buffer.from(bytes).toString("base64");
  }
  // Browser btoa path.
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return (G.btoa ?? _pureBtoa)(bin);
}

function base64ToU8(b64: string): Uint8Array {
  const G: any = (globalThis as any);
  if (typeof G.Buffer === "function" && typeof G.Buffer.from === "function") {
    return new Uint8Array(G.Buffer.from(b64, "base64"));
  }
  const bin = (G.atob ?? _pureAtob)(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const _B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function _pureBtoa(bin: string): string {
  let out = "";
  const len = bin.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bin.charCodeAt(i) & 0xff;
    const b1 = i + 1 < len ? bin.charCodeAt(i + 1) & 0xff : 0;
    const b2 = i + 2 < len ? bin.charCodeAt(i + 2) & 0xff : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    out += _B64_CHARS[(n >> 18) & 0x3f];
    out += _B64_CHARS[(n >> 12) & 0x3f];
    out += i + 1 < len ? _B64_CHARS[(n >> 6) & 0x3f] : "=";
    out += i + 2 < len ? _B64_CHARS[n & 0x3f] : "=";
  }
  return out;
}
function _pureAtob(b64: string): string {
  const clean = b64.replace(/=+$/, "");
  let out = "";
  for (let i = 0; i < clean.length; i += 4) {
    const n0 = _B64_CHARS.indexOf(clean[i]!);
    const n1 = _B64_CHARS.indexOf(clean[i + 1]!);
    const n2 = i + 2 < clean.length ? _B64_CHARS.indexOf(clean[i + 2]!) : 0;
    const n3 = i + 3 < clean.length ? _B64_CHARS.indexOf(clean[i + 3]!) : 0;
    const n = (n0 << 18) | (n1 << 12) | (n2 << 6) | n3;
    out += String.fromCharCode((n >> 16) & 0xff);
    if (i + 2 < clean.length) out += String.fromCharCode((n >> 8) & 0xff);
    if (i + 3 < clean.length) out += String.fromCharCode(n & 0xff);
  }
  return out;
}

// --- Backing store interface (matches Web Storage API subset) ---

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  readonly length: number;
  key(i: number): string | null;
}

class InMemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null { return this.map.has(key) ? this.map.get(key)! : null; }
  setItem(key: string, value: string): void { this.map.set(key, value); }
  removeItem(key: string): void { this.map.delete(key); }
  clear(): void { this.map.clear(); }
  get length(): number { return this.map.size; }
  key(i: number): string | null {
    let idx = 0;
    for (const k of this.map.keys()) { if (idx === i) return k; idx++; }
    return null;
  }
}

function detectStorage(preferred: "local" | "session" = "local"): { store: StorageLike; real: boolean } {
  const G: any = (globalThis as any);
  const name = preferred === "session" ? "sessionStorage" : "localStorage";
  if (G[name] && typeof G[name].getItem === "function") {
    try {
      // Sanity: some browsers throw on disabled storage.
      G[name].getItem("__browserRuntime_probe__");
      return { store: G[name] as StorageLike, real: true };
    } catch { /* fall through */ }
  }
  return { store: new InMemoryStorage(), real: false };
}

/**
 * LocalStorageAdapter — base64-backed StorageAdapter using Web Storage.
 * Spec: https://www.w3.org/TR/webstorage/#the-localstorage-attribute
 */
export class LocalStorageAdapter implements StorageAdapter {
  private store: StorageLike;
  readonly isReal: boolean;
  readonly prefix: string;

  constructor(options?: { prefix?: string; backing?: "local" | "session"; store?: StorageLike }) {
    if (options?.store) { this.store = options.store; this.isReal = true; }
    else {
      const det = detectStorage(options?.backing ?? "local");
      this.store = det.store; this.isReal = det.real;
    }
    this.prefix = options?.prefix ?? "browser-runtime:";
    if (!this.isReal) {
      const G: any = (globalThis as any);
      if (!G.__browserRuntimeSuppressStorageWarnings) {
        try { (G.console ?? console).warn("[browser-runtime] LocalStorageAdapter: no Web Storage — using in-memory fallback"); } catch { /* ignore */ }
      }
    }
  }

  private k(key: string): string { return this.prefix + key; }

  async save(key: string, data: Uint8Array): Promise<void> {
    this.store.setItem(this.k(key), u8ToBase64(data));
  }
  async load(key: string): Promise<Uint8Array | null> {
    const v = this.store.getItem(this.k(key));
    return v === null ? null : base64ToU8(v);
  }
  async remove(key: string): Promise<void> { this.store.removeItem(this.k(key)); }
  async keys(): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < this.store.length; i++) {
      const k = this.store.key(i);
      if (k !== null && k.startsWith(this.prefix)) out.push(k.substring(this.prefix.length));
    }
    return out.sort();
  }
  async clear(): Promise<void> {
    const toRemove: string[] = [];
    for (let i = 0; i < this.store.length; i++) {
      const k = this.store.key(i);
      if (k !== null && k.startsWith(this.prefix)) toRemove.push(k);
    }
    for (const k of toRemove) this.store.removeItem(k);
  }
}
