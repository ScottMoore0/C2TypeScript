// MC-9: VFS asset pre-loading.
// Populate the virtual filesystem from various sources before program execution.

import { VirtualFileSystem } from "./vfs.js";
import { normalize, dirname } from "./path.js";

/** Preload files from a flat record of path → content. */
export function preloadFiles(
  vfs: VirtualFileSystem,
  files: Record<string, string | Uint8Array>
): number {
  let count = 0;
  for (const [path, content] of Object.entries(files)) {
    const norm = normalize(path);
    const dir = dirname(norm);
    if (dir !== "/" && dir !== ".") vfs.mkdirp(dir);
    vfs.writeFile(norm, content);
    count++;
  }
  return count;
}

/** Preload from an array of {path, data} entries. */
export function preloadEntries(
  vfs: VirtualFileSystem,
  entries: Array<{ path: string; data: string | Uint8Array }>
): number {
  let count = 0;
  for (const { path, data } of entries) {
    const norm = normalize(path);
    const dir = dirname(norm);
    if (dir !== "/" && dir !== ".") vfs.mkdirp(dir);
    vfs.writeFile(norm, data);
    count++;
  }
  return count;
}

/** Preload a directory tree from real filesystem (Node.js only). */
export async function preloadFromDisk(
  vfs: VirtualFileSystem,
  realDir: string,
  vfsPrefix: string = "/"
): Promise<number> {
  const { readdir, readFile, stat } = await import("node:fs/promises");
  const { join } = await import("node:path");

  let count = 0;

  async function walk(dir: string, vfsDir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const realPath = join(dir, entry.name);
      const vfsPath = normalize(vfsDir + "/" + entry.name);
      if (entry.isDirectory()) {
        vfs.mkdirp(vfsPath);
        await walk(realPath, vfsPath);
      } else if (entry.isFile()) {
        const parentDir = dirname(vfsPath);
        if (parentDir !== "/" && parentDir !== ".") vfs.mkdirp(parentDir);
        const data = await readFile(realPath);
        vfs.writeFile(vfsPath, new Uint8Array(data));
        count++;
      }
    }
  }

  vfs.mkdirp(vfsPrefix);
  await walk(realDir, vfsPrefix);
  return count;
}
