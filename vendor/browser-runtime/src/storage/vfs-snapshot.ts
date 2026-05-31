// PC-3: VFS snapshot — serialize/deserialize a Mirage VFS to/from storage.
// This allows persisting the virtual filesystem across page loads.

import type { StorageAdapter } from "../adapters.js";

// A flat representation of the VFS for serialization.
export interface VfsSnapshot {
  version: 1;
  files: Array<{
    path: string;
    data: string; // base64-encoded
    mode: number;
    created: number;
    modified: number;
  }>;
}

/** Encode binary data as base64. */
function toBase64(data: Uint8Array): string {
  // Works in both browser (btoa) and Node.js (Buffer).
  if (typeof Buffer !== "undefined") {
    return Buffer.from(data).toString("base64");
  }
  const binary = Array.from(data, b => String.fromCharCode(b)).join("");
  return btoa(binary);
}

/** Decode base64 to binary data. */
function fromBase64(str: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(str, "base64"));
  }
  const binary = atob(str);
  return new Uint8Array(Array.from(binary, c => c.charCodeAt(0)));
}

/** Create a snapshot object from a flat file list. */
export function createSnapshot(
  files: Array<{ path: string; data: Uint8Array; mode?: number; created?: number; modified?: number }>
): VfsSnapshot {
  const now = Date.now();
  return {
    version: 1,
    files: files.map(f => ({
      path: f.path,
      data: toBase64(f.data),
      mode: f.mode ?? 0o644,
      created: f.created ?? now,
      modified: f.modified ?? now
    }))
  };
}

/** Serialize a snapshot to JSON bytes. */
export function serializeSnapshot(snapshot: VfsSnapshot): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(snapshot));
}

/** Deserialize a snapshot from JSON bytes. */
export function deserializeSnapshot(data: Uint8Array): VfsSnapshot {
  return JSON.parse(new TextDecoder().decode(data)) as VfsSnapshot;
}

/** Extract file entries from a snapshot (decode base64). */
export function extractFiles(snapshot: VfsSnapshot): Array<{ path: string; data: Uint8Array; mode: number }> {
  return snapshot.files.map(f => ({
    path: f.path,
    data: fromBase64(f.data),
    mode: f.mode
  }));
}

/** Save a VFS snapshot to storage under a key. */
export async function saveVfsSnapshot(
  storage: StorageAdapter,
  key: string,
  files: Array<{ path: string; data: Uint8Array }>
): Promise<void> {
  const snapshot = createSnapshot(files);
  await storage.save(key, serializeSnapshot(snapshot));
}

/** Load a VFS snapshot from storage. Returns null if not found. */
export async function loadVfsSnapshot(
  storage: StorageAdapter,
  key: string
): Promise<Array<{ path: string; data: Uint8Array; mode: number }> | null> {
  const raw = await storage.load(key);
  if (!raw) return null;
  const snapshot = deserializeSnapshot(raw);
  return extractFiles(snapshot);
}
