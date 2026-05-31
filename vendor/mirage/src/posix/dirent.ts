// Mirage L.8+: POSIX <dirent.h> — directory stream operations.
// IEEE Std 1003.1-2017, Ch. <dirent.h>.
//
// This module exposes the minimal POSIX directory-stream API needed by C
// programs: a DIR handle plus opendir / readdir / rewinddir / closedir /
// telldir / seekdir, and the one-shot scandir().
//
// The backing store is a Mirage VFS. The caller is responsible for resolving
// the path (MirageOS.openDir resolves via `env.resolve` then calls openDirVfs).
// Each DIR handle carries a snapshot of the directory entries taken at the
// time of opendir(), matching POSIX semantics that "the effect of rewinddir()
// on a directory stream that refers to a directory that has been removed is
// unspecified" — i.e. callers may assume a fixed iteration.
//
// DT_* constants match Linux/glibc values, which is the de-facto POSIX set.

import type { VirtualFileSystem } from "../vfs/vfs.js";
import { normalize } from "../vfs/path.js";

// IEEE Std 1003.1-2017 <dirent.h> d_type values (Linux/glibc common subset).
export const DT_UNKNOWN = 0;
export const DT_FIFO = 1;
export const DT_CHR = 2;
export const DT_DIR = 4;
export const DT_BLK = 6;
export const DT_REG = 8;
export const DT_LNK = 10;
export const DT_SOCK = 12;

/** POSIX struct dirent (minimal — fields mandated by POSIX.1-2017).
 *
 *  - `d_ino`   : file serial number (synthesised monotonically for VFS entries).
 *  - `d_name`  : entry name (no path prefix).
 *  - `d_type`  : one of the DT_* constants; DT_UNKNOWN if not determinable.
 */
export interface Dirent {
  d_ino: number;
  d_name: string;
  d_type: number;
}

/** POSIX DIR* — opaque directory stream handle.
 *
 *  The internal shape is deliberately flat so translated C code that treats
 *  DIR* as an opaque pointer can still round-trip through Mirage's APIs.
 */
export interface DIR {
  /** Virtual fd assigned to this directory stream (for fchdir()). */
  fd: number;
  /** Absolute resolved path the stream refers to. */
  path: string;
  /** Snapshot of entries in iteration order. Includes "." and "..". */
  entries: Dirent[];
  /** Current iteration position (0..entries.length). */
  pos: number;
  /** Whether closedir() has already been called. */
  closed: boolean;
}

/** Check whether an absolute VFS path is a directory. */
function isDir(vfs: VirtualFileSystem, path: string): boolean {
  try { return vfs.isDirectory(normalize(path)); } catch { return false; }
}

/** Synthesise a stable-ish d_ino for a (path, name) pair. VFS has no inodes,
 *  so we hash a string — this keeps the value within safe integer range and
 *  is deterministic for identical inputs within a single run. */
function synthIno(path: string, name: string): number {
  const s = path + "\0" + name;
  let h = 2166136261; // FNV-1a 32-bit
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Map a VFS node type to a DT_* constant. POSIX §<dirent.h>. */
function vfsTypeToDt(type: "file" | "directory"): number {
  return type === "directory" ? DT_DIR : DT_REG;
}

let _nextDirFd = 0x8000_0000 >>> 0; // synthetic fd space for DIR* (distinct from file fds)

/** POSIX opendir() — IEEE Std 1003.1-2017 §opendir.
 *  Opens a directory stream over the VFS at the given absolute path.
 *  Returns null on ENOENT / ENOTDIR. */
export function opendirVfs(vfs: VirtualFileSystem, absPath: string): DIR | null {
  const norm = normalize(absPath);
  if (!isDir(vfs, norm)) return null;
  const entries: Dirent[] = [];
  // POSIX §<dirent.h>: readdir() reports "." and ".." as regular entries.
  entries.push({ d_ino: synthIno(norm, "."), d_name: ".", d_type: DT_DIR });
  entries.push({ d_ino: synthIno(norm, ".."), d_name: "..", d_type: DT_DIR });

  let names: string[];
  try { names = vfs.readdir(norm); }
  catch { return null; }

  for (const name of names) {
    const full = norm === "/" ? "/" + name : norm + "/" + name;
    let type: "file" | "directory" = "file";
    try {
      const s = vfs.stat(full);
      type = s.type;
    } catch { /* entry disappeared between readdir + stat — skip */ continue; }
    entries.push({
      d_ino: synthIno(norm, name),
      d_name: name,
      d_type: vfsTypeToDt(type),
    });
  }

  return {
    fd: _nextDirFd++,
    path: norm,
    entries,
    pos: 0,
    closed: false,
  };
}

/** POSIX readdir() — IEEE Std 1003.1-2017 §readdir. Returns next entry or null at EOF.
 *  Advances the stream position by one. */
export function readdirStream(dirp: DIR): Dirent | null {
  if (dirp.closed) return null;
  if (dirp.pos >= dirp.entries.length) return null;
  return dirp.entries[dirp.pos++];
}

/** POSIX readdir_r() — IEEE Std 1003.1-2017 §readdir_r. Thread-safe variant.
 *  In single-threaded JS this is identical to readdir(). Caller passes an
 *  `entry` object to fill; we return 0 on success (with `result` set),
 *  or a nonzero errno on error. `result[0]` is set to null at end-of-stream. */
export function readdir_r(dirp: DIR, entry: Dirent, result: { value: Dirent | null }): number {
  if (dirp.closed) return 9; // EBADF
  const next = readdirStream(dirp);
  if (!next) { result.value = null; return 0; }
  entry.d_ino = next.d_ino;
  entry.d_name = next.d_name;
  entry.d_type = next.d_type;
  result.value = entry;
  return 0;
}

/** POSIX rewinddir() — IEEE Std 1003.1-2017 §rewinddir. */
export function rewinddir(dirp: DIR): void {
  if (dirp.closed) return;
  dirp.pos = 0;
}

/** POSIX closedir() — IEEE Std 1003.1-2017 §closedir. */
export function closedir(dirp: DIR): number {
  if (dirp.closed) return -1; // EBADF
  dirp.closed = true;
  dirp.entries = [];
  return 0;
}

/** POSIX telldir() — IEEE Std 1003.1-2017 §telldir.
 *  Returns an opaque position token; for Mirage this is the index. */
export function telldir(dirp: DIR): number {
  return dirp.pos;
}

/** POSIX seekdir() — IEEE Std 1003.1-2017 §seekdir.
 *  POSIX only requires that values returned by telldir() work; we accept any
 *  integer and clamp to [0, entries.length]. */
export function seekdir(dirp: DIR, loc: number): void {
  if (dirp.closed) return;
  if (loc < 0) loc = 0;
  if (loc > dirp.entries.length) loc = dirp.entries.length;
  dirp.pos = loc;
}

/** POSIX scandir() — IEEE Std 1003.1-2017 §scandir.
 *  One-shot directory enumeration with an optional filter and optional comparator.
 *  Excludes "." and ".." by default (to match common-use glibc behaviour; the
 *  caller can supply a filter that accepts them). Returns the filtered+sorted
 *  list, or null on ENOENT. */
export function scandir(
  vfs: VirtualFileSystem,
  absPath: string,
  filter?: (e: Dirent) => boolean,
  compare?: (a: Dirent, b: Dirent) => number,
): Dirent[] | null {
  const dir = opendirVfs(vfs, absPath);
  if (!dir) return null;
  const out: Dirent[] = [];
  for (const e of dir.entries) {
    if (e.d_name === "." || e.d_name === "..") continue;
    if (filter && !filter(e)) continue;
    out.push(e);
  }
  closedir(dir);
  if (compare) out.sort(compare);
  else out.sort((a, b) => a.d_name < b.d_name ? -1 : a.d_name > b.d_name ? 1 : 0);
  return out;
}

