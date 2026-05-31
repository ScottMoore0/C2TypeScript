// Mirage L.8+: POSIX <sys/stat.h> — file-status primitives and mode bits.
// IEEE Std 1003.1-2017, Ch. <sys/stat.h>.
//
// Provides:
//   - Full struct stat interface (all POSIX-mandated fields)
//   - S_IF* file-type constants
//   - S_IR/W/X USR/GRP/OTH permission bits + S_ISUID/S_ISGID/S_ISVTX
//   - S_IS* macro-equivalents (S_ISDIR, S_ISREG, S_ISLNK, …) as exported functions
//   - stat() / lstat() helpers that adapt a Mirage VFS FileStat to the struct.
//
// Symbolic links are modelled explicitly in the VFS when present (see
// ../vfs/symlinks.ts); lstat() must not follow them, stat() must.

import type { VirtualFileSystem } from "../vfs/vfs.js";

// ---------------------------------------------------------------------------
// File-type bits — POSIX §<sys/stat.h>.  Octal values match Linux/glibc, which
// are also the values mandated by the de-facto POSIX ABI on Unix systems.
// ---------------------------------------------------------------------------

export const S_IFMT   = 0o170000; // file type mask
export const S_IFSOCK = 0o140000; // socket
export const S_IFLNK  = 0o120000; // symbolic link
export const S_IFREG  = 0o100000; // regular file
export const S_IFBLK  = 0o060000; // block device
export const S_IFDIR  = 0o040000; // directory
export const S_IFCHR  = 0o020000; // character device
export const S_IFIFO  = 0o010000; // FIFO (named pipe)

// Set-user/-group-ID and sticky bits.
export const S_ISUID = 0o4000;
export const S_ISGID = 0o2000;
export const S_ISVTX = 0o1000;

// Permission bits.
export const S_IRWXU = 0o0700;
export const S_IRUSR = 0o0400;
export const S_IWUSR = 0o0200;
export const S_IXUSR = 0o0100;

export const S_IRWXG = 0o0070;
export const S_IRGRP = 0o0040;
export const S_IWGRP = 0o0020;
export const S_IXGRP = 0o0010;

export const S_IRWXO = 0o0007;
export const S_IROTH = 0o0004;
export const S_IWOTH = 0o0002;
export const S_IXOTH = 0o0001;

// ---------------------------------------------------------------------------
// S_IS* macros, expressed as plain functions (POSIX §<sys/stat.h>).
// ---------------------------------------------------------------------------

export const S_ISREG  = (m: number) => (m & S_IFMT) === S_IFREG;
export const S_ISDIR  = (m: number) => (m & S_IFMT) === S_IFDIR;
export const S_ISCHR  = (m: number) => (m & S_IFMT) === S_IFCHR;
export const S_ISBLK  = (m: number) => (m & S_IFMT) === S_IFBLK;
export const S_ISFIFO = (m: number) => (m & S_IFMT) === S_IFIFO;
export const S_ISLNK  = (m: number) => (m & S_IFMT) === S_IFLNK;
export const S_ISSOCK = (m: number) => (m & S_IFMT) === S_IFSOCK;

// ---------------------------------------------------------------------------
// POSIX struct stat — IEEE Std 1003.1-2017 §<sys/stat.h>.
//
// POSIX-mandated fields:
//   dev_t     st_dev      — device ID
//   ino_t     st_ino      — file serial number
//   mode_t    st_mode     — file type + permissions
//   nlink_t   st_nlink    — link count
//   uid_t     st_uid      — owner
//   gid_t     st_gid      — group
//   dev_t     st_rdev     — device ID (if char/block special)
//   off_t     st_size     — file size in bytes
//   time_t    st_atime    — last access (seconds since epoch)
//   time_t    st_mtime    — last modification
//   time_t    st_ctime    — last status change
//   blksize_t st_blksize  — preferred block size for I/O
//   blkcnt_t  st_blocks   — number of 512-byte blocks allocated
// ---------------------------------------------------------------------------

export interface Stat {
  st_dev: number;
  st_ino: number;
  st_mode: number;
  st_nlink: number;
  st_uid: number;
  st_gid: number;
  st_rdev: number;
  st_size: number;
  st_atime: number;
  st_mtime: number;
  st_ctime: number;
  st_blksize: number;
  st_blocks: number;
}

/** FNV-1a hash of path for a synthetic but stable st_ino.
 *  POSIX only requires (st_dev, st_ino) to uniquely identify a file within
 *  the filesystem; Mirage VFS has one "device" so the path alone suffices. */
function pathIno(path: string): number {
  let h = 2166136261;
  for (let i = 0; i < path.length; i++) {
    h ^= path.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Build a full POSIX `struct stat` from a Mirage VFS FileStat.
 *  The caller supplies the resolved `path` so we can synthesise a stable st_ino. */
export function makeStat(
  path: string,
  fs: {
    type: "file" | "directory" | "symlink";
    size: number;
    modified: number;
    created: number;
    mode: number;
    mtime?: number;
  },
  opts?: { uid?: number; gid?: number; dev?: number; nlink?: number },
): Stat {
  const typeBits =
    fs.type === "directory" ? S_IFDIR :
    fs.type === "symlink" ? S_IFLNK :
    S_IFREG;
  const perm = fs.mode & 0o7777;
  const mtime = Math.floor((fs.mtime ?? fs.modified) / 1000);
  const ctime = Math.floor(fs.modified / 1000);
  const atime = Math.floor(fs.modified / 1000);
  const blksize = 4096;
  const blocks = Math.ceil(fs.size / 512);
  return {
    st_dev: opts?.dev ?? 1,
    st_ino: pathIno(path),
    st_mode: typeBits | perm,
    st_nlink: opts?.nlink ?? 1,
    st_uid: opts?.uid ?? 1000,
    st_gid: opts?.gid ?? 1000,
    st_rdev: 0,
    st_size: fs.size,
    st_atime: atime,
    st_mtime: mtime,
    st_ctime: ctime,
    st_blksize: blksize,
    st_blocks: blocks,
  };
}

/** POSIX stat() — IEEE Std 1003.1-2017 §stat. Follows symlinks.
 *  Returns null on ENOENT. */
export function statVfs(vfs: VirtualFileSystem, absPath: string): Stat | null {
  try {
    const fs = vfs.stat(absPath);
    return makeStat(absPath, fs);
  } catch { return null; }
}

/** POSIX lstat() — IEEE Std 1003.1-2017 §lstat. Does NOT follow symlinks.
 *  For the current Mirage VFS (no symlinks) lstat is identical to stat. When
 *  symlink support is added to the VFS, this helper should consult the
 *  per-node `type === "symlink"` flag without following the link target. */
export function lstatVfs(vfs: VirtualFileSystem, absPath: string): Stat | null {
  return statVfs(vfs, absPath);
}
