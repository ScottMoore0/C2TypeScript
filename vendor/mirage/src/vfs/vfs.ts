// MC-3: Virtual filesystem — in-memory tree with POSIX-like operations.
//
// The VFS provides: mkdir, readdir, stat, readFile, writeFile, unlink, rename.
// All paths are POSIX-style (forward slashes, rooted at "/").

import { normalize, resolve, dirname, basename, split } from "./path.js";
import { type VfsFile, type VfsDirectory, type FileStat, makeFile, makeDirectory } from "./types.js";

export class VfsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly path: string
  ) {
    super(`${code}: ${message}, path '${path}'`);
    this.name = "VfsError";
  }
}

export class VirtualFileSystem {
  private root: VfsDirectory;

  constructor() {
    this.root = makeDirectory("");
  }

  // --- Navigation ---

  private lookup(path: string): VfsFile | VfsDirectory | null {
    const norm = normalize(path);
    if (norm === "/" || norm === "") return this.root;
    const parts = split(norm);
    let current: VfsFile | VfsDirectory = this.root;
    for (const part of parts) {
      if (current.type !== "directory") return null;
      const child = current.children.get(part);
      if (!child) return null;
      current = child;
    }
    return current;
  }

  private lookupParent(path: string): { parent: VfsDirectory; name: string } | null {
    const norm = normalize(path);
    const dir = dirname(norm);
    const name = basename(norm);
    const parent = this.lookup(dir);
    if (!parent || parent.type !== "directory") return null;
    return { parent, name };
  }

  // --- Directory operations ---

  /** Create a directory. Throws if parent doesn't exist. */
  mkdir(path: string): void {
    const info = this.lookupParent(path);
    if (!info) throw new VfsError("ENOENT", "parent directory does not exist", path);
    if (info.parent.children.has(info.name)) {
      throw new VfsError("EEXIST", "path already exists", path);
    }
    info.parent.children.set(info.name, makeDirectory(info.name));
  }

  /** Create a directory and all missing parents. */
  mkdirp(path: string): void {
    const parts = split(normalize(path));
    let current = this.root;
    for (const part of parts) {
      let child = current.children.get(part);
      if (!child) {
        child = makeDirectory(part);
        current.children.set(part, child);
      }
      if (child.type !== "directory") {
        throw new VfsError("ENOTDIR", "not a directory", part);
      }
      current = child;
    }
  }

  /** List directory entries. */
  readdir(path: string): string[] {
    const node = this.lookup(path);
    if (!node) throw new VfsError("ENOENT", "no such directory", path);
    if (node.type !== "directory") throw new VfsError("ENOTDIR", "not a directory", path);
    return Array.from(node.children.keys()).sort();
  }

  /** Remove an empty directory. */
  rmdir(path: string): void {
    const info = this.lookupParent(path);
    if (!info) throw new VfsError("ENOENT", "no such directory", path);
    const node = info.parent.children.get(info.name);
    if (!node) throw new VfsError("ENOENT", "no such directory", path);
    if (node.type !== "directory") throw new VfsError("ENOTDIR", "not a directory", path);
    if (node.children.size > 0) throw new VfsError("ENOTEMPTY", "directory not empty", path);
    info.parent.children.delete(info.name);
  }

  // --- File operations ---

  /** Write a file (create or overwrite). Creates parent dirs if they exist. */
  writeFile(path: string, data: string | Uint8Array): void {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const info = this.lookupParent(path);
    if (!info) throw new VfsError("ENOENT", "parent directory does not exist", path);
    const existing = info.parent.children.get(info.name);
    if (existing && existing.type === "directory") {
      throw new VfsError("EISDIR", "is a directory", path);
    }
    const file = makeFile(info.name, bytes);
    info.parent.children.set(info.name, file);
  }

  /** Read a file's contents as Uint8Array. */
  readFile(path: string): Uint8Array {
    const node = this.lookup(path);
    if (!node) throw new VfsError("ENOENT", "no such file", path);
    if (node.type !== "file") throw new VfsError("EISDIR", "is a directory", path);
    return node.data;
  }

  /** Read a file as a UTF-8 string. */
  readTextFile(path: string): string {
    return new TextDecoder().decode(this.readFile(path));
  }

  /** Append data to a file (create if doesn't exist). */
  appendFile(path: string, data: string | Uint8Array): void {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const node = this.lookup(path);
    if (node && node.type === "file") {
      const newData = new Uint8Array(node.data.length + bytes.length);
      newData.set(node.data);
      newData.set(bytes, node.data.length);
      node.data = newData;
      node.stat.size = newData.length;
      node.stat.modified = Date.now();
    } else if (!node) {
      this.writeFile(path, bytes);
    } else {
      throw new VfsError("EISDIR", "is a directory", path);
    }
  }

  /** Delete a file. */
  unlink(path: string): void {
    const info = this.lookupParent(path);
    if (!info) throw new VfsError("ENOENT", "no such file", path);
    const node = info.parent.children.get(info.name);
    if (!node) throw new VfsError("ENOENT", "no such file", path);
    if (node.type === "directory") throw new VfsError("EISDIR", "is a directory", path);
    info.parent.children.delete(info.name);
  }

  /** Rename/move a file or directory. */
  rename(oldPath: string, newPath: string): void {
    const oldInfo = this.lookupParent(oldPath);
    if (!oldInfo) throw new VfsError("ENOENT", "source not found", oldPath);
    const node = oldInfo.parent.children.get(oldInfo.name);
    if (!node) throw new VfsError("ENOENT", "source not found", oldPath);

    const newInfo = this.lookupParent(newPath);
    if (!newInfo) throw new VfsError("ENOENT", "destination parent not found", newPath);

    oldInfo.parent.children.delete(oldInfo.name);
    node.name = newInfo.name;
    newInfo.parent.children.set(newInfo.name, node);
  }

  // --- Metadata ---

  /** Get file/directory stats.
   *  POSIX IEEE Std 1003.1-2017 §stat. Populates `mtime` as an alias of `modified`. */
  stat(path: string): FileStat {
    const node = this.lookup(path);
    if (!node) throw new VfsError("ENOENT", "no such file or directory", path);
    return { ...node.stat, mtime: node.stat.modified };
  }

  /** POSIX chmod() — change file permission bits.
   *  IEEE Std 1003.1-2017 §chmod. Throws ENOENT if path does not exist. */
  chmod(path: string, mode: number): void {
    const node = this.lookup(path);
    if (!node) throw new VfsError("ENOENT", "no such file or directory", path);
    node.stat.mode = mode & 0o7777;
  }

  /** Check if a path exists. */
  exists(path: string): boolean {
    return this.lookup(path) !== null;
  }

  /** Check if a path is a file. */
  isFile(path: string): boolean {
    const node = this.lookup(path);
    return node !== null && node.type === "file";
  }

  /** Check if a path is a directory. */
  isDirectory(path: string): boolean {
    const node = this.lookup(path);
    return node !== null && node.type === "directory";
  }

  /** Truncate a file to a given length. */
  truncate(path: string, length: number): void {
    const node = this.lookup(path);
    if (!node) throw new VfsError("ENOENT", "no such file", path);
    if (node.type !== "file") throw new VfsError("EISDIR", "is a directory", path);
    if (length < node.data.length) {
      node.data = node.data.slice(0, length);
    } else if (length > node.data.length) {
      const newData = new Uint8Array(length);
      newData.set(node.data);
      node.data = newData;
    }
    node.stat.size = length;
    node.stat.modified = Date.now();
  }
}
