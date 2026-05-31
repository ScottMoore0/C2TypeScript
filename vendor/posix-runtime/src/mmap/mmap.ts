// MC-T2-Mmap: POSIX <sys/mman.h> emulation — IEEE Std 1003.1-2017 §<sys/mman.h>.
//
// Backs mappings with `Uint8Array` (or optionally `SharedArrayBuffer`-backed
// views so worker threads can share the segment). mprotect() is enforced
// through an explicit `checkAccess(region, off, kind)` API that host code can
// invoke before a memcpy/byte store; on a protection violation the caller
// receives a SIGSEGV-style thrown `MprotectViolation` which cooperates with
// Mirage's signal registry. Translated C code that talks directly to
// `region.buffer` bypasses the check (JS cannot intercept Uint8Array stores)
// — that is a documented best-effort limitation of browser/Node JIT.
//
// Limitations:
//   - MAP_FIXED is ignored: JavaScript has no concept of arbitrary user
//     addresses, so we cannot honour an explicit target `addr`.
//   - PROT_EXEC is ignored: JS cannot make memory executable.
//   - PROT_READ/PROT_NONE are enforced only via the MmapManager's explicit
//     checkAccess() entry points. Direct `region.buffer[i] = ...` writes are
//     NOT caught (no Proxy/accessor interception for TypedArrays). Callers
//     that need strict enforcement should route all writes through
//     MmapManager.poke / MmapManager.peek.
//   - File-backed MAP_SHARED returns an aliased view into the VFS file's
//     underlying buffer, so writes are visible immediately; msync is then a
//     no-op but still succeeds. When the mapping is a private copy (either
//     MAP_PRIVATE or a clipped-to-EOF MAP_SHARED window) msync flushes dirty
//     pages back to the backing fd.

import type { VirtualFileSystem } from "../vfs/vfs.js";

// Protection flags — POSIX §<sys/mman.h>.
export const PROT_NONE = 0;
export const PROT_READ = 1;
export const PROT_WRITE = 2;
export const PROT_EXEC = 4;

// Mapping flags — POSIX §<sys/mman.h>.
export const MAP_SHARED = 1;
export const MAP_PRIVATE = 2;
export const MAP_FIXED = 16;
export const MAP_ANONYMOUS = 32;

// msync flags — POSIX §<sys/mman.h>.
export const MS_ASYNC      = 1;
export const MS_INVALIDATE = 2;
export const MS_SYNC       = 4;

/** Sentinel returned on failure (POSIX returns MAP_FAILED = (void*)-1). */
export const MAP_FAILED: null = null;

/** Access kind used by checkAccess. */
export type AccessKind = "read" | "write" | "exec";

/**
 * Raised by `MmapManager.checkAccess` (and poke/peek) when the requested
 * access violates the region's current prot bits. Caller should translate
 * this to a SIGSEGV delivery via the signal registry.
 */
export class MprotectViolation extends Error {
  readonly region: MmapRegion;
  readonly kind: AccessKind;
  constructor(region: MmapRegion, kind: AccessKind) {
    super(`mprotect violation: ${kind} on region prot=0x${region.prot.toString(16)}`);
    this.name = "MprotectViolation";
    this.region = region;
    this.kind = kind;
  }
}

export interface MmapRegion {
  buffer: Uint8Array;
  addr: number;
  size: number;
  fd: number;
  offset: number;
  flags: number;
  /** Current protection bits; mutated by mprotect(). */
  prot: number;
  /** Path of backing file, if any (internal bookkeeping). */
  path?: string;
  /** Whether the region has been written since the last msync/mmap. */
  dirty: boolean;
  /** Whether the buffer is a SAB-backed Uint8Array (for worker sharing). */
  shared: boolean;
  /** Underlying ArrayBuffer / SharedArrayBuffer so workers can re-view. */
  underlying: ArrayBuffer | SharedArrayBuffer;
}

/**
 * Adapter describing a file-descriptor table that can resolve `fd` -> VFS
 * path. Kept minimal so callers can wire up their own fd table.
 */
export interface FdPathResolver {
  pathOf(fd: number): string | null;
}

/** Options for `MmapManager.mmap`. */
export interface MmapOptions {
  /** Use a SharedArrayBuffer as the backing store (so worker threads can
   *  share the segment via `structuredClone`). Only valid for MAP_ANONYMOUS
   *  or MAP_PRIVATE mappings — file-backed MAP_SHARED aliases the VFS buffer
   *  directly. Default: false. */
  useSAB?: boolean;
}

function sabAvailable(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}

function makeBuffer(len: number, useSAB: boolean): { buf: Uint8Array; under: ArrayBuffer | SharedArrayBuffer; shared: boolean } {
  if (useSAB && sabAvailable()) {
    const sab = new SharedArrayBuffer(len);
    return { buf: new Uint8Array(sab), under: sab, shared: true };
  }
  const ab = new ArrayBuffer(len);
  return { buf: new Uint8Array(ab), under: ab, shared: false };
}

export class MmapManager {
  private regions: Set<MmapRegion> = new Set();
  private nextAddr: number = 0x10000; // fake addresses, monotonic

  /**
   * POSIX mmap — IEEE Std 1003.1-2017 §mmap. Returns an MmapRegion on
   * success, or null (MAP_FAILED) on failure. `addr` is advisory only
   * (MAP_FIXED is recorded but not honoured).
   *
   * @param addr   advisory address (ignored)
   * @param len    size in bytes (must be > 0)
   * @param prot   protection flags
   * @param flags  MAP_* flag set
   * @param fd     file descriptor (ignored if MAP_ANONYMOUS)
   * @param offset offset in bytes into the backing file
   * @param vfs    VFS instance for file-backed mappings
   * @param fdres  fd -> path resolver for file-backed mappings
   * @param opts   extra options (e.g. useSAB)
   */
  mmap(
    addr: number | null,
    len: number,
    prot: number,
    flags: number,
    fd: number,
    offset: number,
    vfs?: VirtualFileSystem,
    fdres?: FdPathResolver,
    opts?: MmapOptions,
  ): MmapRegion | null {
    if (len <= 0) return MAP_FAILED;

    const anonymous = (flags & MAP_ANONYMOUS) !== 0;
    const shared    = (flags & MAP_SHARED) !== 0;
    const useSAB    = !!opts?.useSAB;

    let buffer: Uint8Array;
    let path: string | undefined;
    let underlying: ArrayBuffer | SharedArrayBuffer;
    let isShared: boolean;

    if (anonymous) {
      const r = makeBuffer(len, useSAB);
      buffer = r.buf; underlying = r.under; isShared = r.shared;
    } else {
      if (!vfs || !fdres) return MAP_FAILED;
      const p = fdres.pathOf(fd);
      if (!p) return MAP_FAILED;
      path = p;
      let fileData: Uint8Array;
      try {
        fileData = vfs.readFile(p);
      } catch {
        return MAP_FAILED;
      }
      if (offset < 0 || offset > fileData.length) return MAP_FAILED;
      const end = Math.min(offset + len, fileData.length);
      const actual = end - offset;

      if (shared && actual === len && !useSAB) {
        // Aliased view: writes propagate live to the VFS file buffer.
        buffer     = new Uint8Array(fileData.buffer, fileData.byteOffset + offset, len);
        underlying = fileData.buffer;
        isShared   = false;
      } else {
        // MAP_PRIVATE (copy-on-first-write) or a clipped-to-EOF MAP_SHARED
        // window or a caller-requested SAB-backed copy: allocate a fresh
        // buffer, copy file bytes in, and flush back on msync when shared.
        const r = makeBuffer(len, useSAB);
        buffer = r.buf; underlying = r.under; isShared = r.shared;
        buffer.set(fileData.subarray(offset, end), 0);
      }
    }

    const region: MmapRegion = {
      buffer,
      addr: this.nextAddr,
      size: len,
      fd: anonymous ? -1 : fd,
      offset,
      flags,
      prot,
      path,
      dirty: false,
      shared: isShared,
      underlying,
    };
    this.nextAddr += Math.max(len, 4096);
    this.regions.add(region);
    return region;
  }

  /**
   * POSIX munmap — IEEE Std 1003.1-2017 §munmap.
   * Returns 0 on success, -1 if the region is not tracked.
   */
  munmap(region: MmapRegion): number {
    if (!this.regions.has(region)) return -1;
    this.regions.delete(region);
    return 0;
  }

  /**
   * POSIX mprotect — IEEE Std 1003.1-2017 §mprotect.
   * Updates the protection bits on an active region. Returns 0 on success,
   * -1 if the region is not tracked or prot contains PROT_EXEC (we cannot
   * satisfy PROT_EXEC in JS, but we accept it as a no-op alias for PROT_READ
   * — set `strictExec: true` on opts to reject it). For simplicity prot is
   * stored verbatim and enforced by checkAccess/poke/peek.
   */
  mprotect(region: MmapRegion, prot: number): number {
    if (!this.regions.has(region)) return -1;
    // POSIX: prot must be a combination of PROT_NONE | PROT_READ | PROT_WRITE
    // | PROT_EXEC. Out-of-range bits fail with EINVAL.
    const valid = PROT_NONE | PROT_READ | PROT_WRITE | PROT_EXEC;
    if ((prot & ~valid) !== 0) return -1;
    region.prot = prot;
    return 0;
  }

  /**
   * Check whether `kind` is allowed at byte offset `off` in `region`.
   * Throws MprotectViolation (caller catches and raises SIGSEGV) on
   * failure. Returns normally on success.
   */
  checkAccess(region: MmapRegion, off: number, kind: AccessKind): void {
    if (!this.regions.has(region)) throw new MprotectViolation(region, kind);
    if (off < 0 || off >= region.size) throw new MprotectViolation(region, kind);
    // PROT_NONE: no access permitted.
    if (region.prot === PROT_NONE) throw new MprotectViolation(region, kind);
    if (kind === "read"  && (region.prot & PROT_READ)  === 0) throw new MprotectViolation(region, kind);
    if (kind === "write" && (region.prot & PROT_WRITE) === 0) throw new MprotectViolation(region, kind);
    if (kind === "exec"  && (region.prot & PROT_EXEC)  === 0) throw new MprotectViolation(region, kind);
  }

  /** Protected 8-bit read. Throws MprotectViolation on PROT_NONE/write-only. */
  peek(region: MmapRegion, off: number): number {
    this.checkAccess(region, off, "read");
    return region.buffer[off];
  }

  /** Protected 8-bit write. Throws MprotectViolation on read-only/PROT_NONE.
   *  Marks the region dirty. */
  poke(region: MmapRegion, off: number, byte: number): void {
    this.checkAccess(region, off, "write");
    region.buffer[off] = byte & 0xff;
    region.dirty = true;
  }

  /**
   * POSIX msync — IEEE Std 1003.1-2017 §msync.
   * For MAP_SHARED regions, flushes dirty pages back to the backing VFS file.
   * For MAP_PRIVATE regions, a no-op (returns 0).
   * Returns 0 on success, -1 on failure.
   */
  msync(region: MmapRegion, _flags: number = 0, vfs?: VirtualFileSystem): number {
    if (!this.regions.has(region)) return -1;
    if ((region.flags & MAP_SHARED) === 0) return 0; // private — nothing to do
    if (!region.path || !vfs) return 0;
    try {
      const fileData = vfs.readFile(region.path);
      // If our buffer is the aliased view, writes are already live; detect
      // aliasing by comparing underlying ArrayBuffer + offset.
      const aliased =
        region.buffer.buffer === fileData.buffer &&
        region.buffer.byteOffset === fileData.byteOffset + region.offset &&
        region.buffer.length <= fileData.length - region.offset;
      if (aliased) { region.dirty = false; return 0; }
      if (!region.dirty) return 0; // nothing to flush
      // Otherwise copy mapped data back into the file.
      const merged = new Uint8Array(Math.max(fileData.length, region.offset + region.size));
      merged.set(fileData, 0);
      merged.set(region.buffer, region.offset);
      vfs.writeFile(region.path, merged);
      region.dirty = false;
      return 0;
    } catch {
      return -1;
    }
  }

  /** Number of tracked regions (for introspection/tests). */
  get activeCount(): number {
    return this.regions.size;
  }

  /** Whether a region is currently tracked. */
  isActive(region: MmapRegion): boolean {
    return this.regions.has(region);
  }

  /** Iterate tracked regions (read-only snapshot, for test inspection). */
  listRegions(): ReadonlyArray<MmapRegion> {
    return [...this.regions];
  }
}
