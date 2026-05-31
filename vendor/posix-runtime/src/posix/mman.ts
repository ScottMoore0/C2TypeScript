// Mirage POSIX <sys/mman.h> — memory mapping (file + anonymous), POSIX-shape.
//
// IEEE Std 1003.1-2017 §<sys/mman.h>:
//   void *mmap (void *addr, size_t len, int prot, int flags, int fd, off_t off);
//   int   munmap   (void *addr, size_t len);
//   int   mprotect (void *addr, size_t len, int prot);
//   int   msync    (void *addr, size_t len, int flags);
//   int   madvise  (void *addr, size_t len, int advice);
//
// This module is the POSIX-shaped, C-callable thin wrapper sitting on top of
// the existing MmapManager engine in ../mmap/mmap.ts. Translated C code calls
// these `*_real` entry points; each returns a CPtr-shaped {buf, off} (mmap)
// or a status int (munmap/mprotect/msync/madvise), matching the lowering the
// emitter expects.
//
// BRIDGE: posix-mman — POSIX memory-mapping API → Uint8Array-backed CPtr +
// VFS readback. Region metadata is held in a process-global registry keyed
// by the returned Uint8Array (the CPtr's backing buffer); munmap/msync use
// it to dispatch to the engine and clear the entry.
//
// MVP scope (POSIX.1-2017 §3 mmap):
//   * MAP_ANONYMOUS — full support: allocates a fresh zero-filled Uint8Array
//     of the requested length and returns a CPtr at offset 0.
//   * MAP_PRIVATE file mapping — full support for read: reads the file via
//     the supplied VirtualFileSystem, copies bytes [offset, offset+len) into
//     a fresh buffer, returns CPtr. Per POSIX MAP_PRIVATE, writes do NOT
//     propagate back to the file (copy-on-write semantics; we just don't
//     flush). munmap discards the buffer.
//   * MAP_SHARED file mapping — accepted but write-back is deferred. The
//     mapping behaves as MAP_PRIVATE for now; msync is a no-op (returns 0)
//     and munmap does NOT flush. Documented limitation; the matching shim
//     in compiler/src/shim-database.ts keeps the same contract so source ↔
//     target stay byte-identical for read-only workloads.
//   * MAP_FIXED — explicitly rejected: JS has no address-space control, so
//     honouring an exact `addr` is impossible. mmap returns MAP_FAILED
//     (null) per POSIX when MAP_FIXED is set.
//   * mprotect / madvise — accepted as bookkeeping; the underlying engine
//     stores prot bits but JS cannot enforce protection on direct buffer
//     access. madvise advice is ignored entirely (POSIX permits this — the
//     advice is purely a performance hint).
//   * msync — for MAP_PRIVATE/anonymous a no-op (returns 0 success). For
//     MAP_SHARED, deferred (no-op + 0); follow-up will wire VFS write-back.
//
// All five entry points respect POSIX errno conventions (the host-emitter
// reflects errno via the `errno` global that posix-shims wires up). On
// failure they return the documented sentinel (MAP_FAILED / -1) and set
// `lastErrno` which the caller bridge can copy into the global errno slot.

import type { VirtualFileSystem } from "../vfs/vfs.js";

// ---------------------------------------------------------------------------
// POSIX <sys/mman.h> — flag constants. Linux/glibc-canonical numeric values,
// matching MmapManager and the constants emitted by shim-database "mmap_flags".
// ---------------------------------------------------------------------------

export const PROT_NONE = 0;
export const PROT_READ = 1;
export const PROT_WRITE = 2;
export const PROT_EXEC = 4;

export const MAP_SHARED = 1;
export const MAP_PRIVATE = 2;
export const MAP_FIXED = 0x10;
export const MAP_ANONYMOUS = 0x20;
export const MAP_ANON = 0x20; // BSD spelling, same value

/** POSIX mmap() failure sentinel. POSIX defines MAP_FAILED as `(void *)-1`;
 *  in our CPtr universe `null` is the natural "no pointer" representation. */
export const MAP_FAILED: null = null;

export const MS_ASYNC = 1;
export const MS_INVALIDATE = 2;
export const MS_SYNC = 4;

/** POSIX errno values used by this module. EINVAL on bad args, ENOMEM on
 *  allocation failure, EBADF on missing fd resolver/path, EACCES on read
 *  failure. Matches Linux numbering (matches Mirage's posix/fs.ts table). */
const EBADF = 9;
const EACCES = 13;
const EINVAL = 22;
const ENOMEM = 12;

// ---------------------------------------------------------------------------
// CPtr shape — matches compiler/src/cptr.ts. POSIX-mman returns a CPtr so
// translated code can do pointer arithmetic on the mapping. We DON'T import
// CPtr directly to keep posix-runtime/posix free of compiler-side deps; the shape
// is part of the platform contract (UNIVERSALITY_CONTRACT.md).
// ---------------------------------------------------------------------------

export interface CPtrLike {
  buf: Uint8Array;
  off: number;
}

// ---------------------------------------------------------------------------
// Region registry. Keyed on the Uint8Array buffer object so munmap can
// translate a CPtr back into its bookkeeping entry.
// ---------------------------------------------------------------------------

interface MmapRegionRecord {
  /** Length passed to mmap. Used by munmap/msync. */
  length: number;
  /** Resolved POSIX fd (or -1 for anonymous). */
  fd: number;
  /** Offset into the backing file (0 for anonymous). */
  offset: number;
  /** Original POSIX flags set. */
  flags: number;
  /** Current protection bits (mutated by mprotect_real). */
  prot: number;
  /** Backing file path, if any (resolved at mmap time). */
  path: string | null;
  /** True if MAP_SHARED is set AND backed by a file. msync would flush. */
  sharedFile: boolean;
}

interface MmapState {
  regions: Map<Uint8Array, MmapRegionRecord>;
  lastErrno: number;
}

const _state: MmapState = {
  regions: new Map(),
  lastErrno: 0,
};

/** Read the most recent POSIX errno set by an mman call. The compiler-side
 *  shim copies this into the `errno` global after each call. */
export function getLastErrno(): number {
  return _state.lastErrno;
}

/** Reset module state — test-only. */
export function _reset(): void {
  _state.regions.clear();
  _state.lastErrno = 0;
}

// ---------------------------------------------------------------------------
// fd → path resolver. The translated C program holds POSIX fds in Mirage's
// FileDescriptorTable; mmap needs to map fd back to a VFS path so it can
// readFile() the bytes. Callers pass a small adapter function.
// ---------------------------------------------------------------------------

export type MmapFdResolver = (fd: number) => string | null;

// ---------------------------------------------------------------------------
// mmap_real — POSIX.1-2017 §mmap. Returns CPtr on success, null (MAP_FAILED)
// on failure.
// ---------------------------------------------------------------------------

/**
 * BRIDGE: posix-mmap — POSIX mmap → Uint8Array-backed CPtr.
 *
 * Anonymous: allocates a zero-filled Uint8Array of length `len`.
 * File-backed: reads `len` bytes from `path` (resolved via `resolvePath(fd)`)
 * starting at `offset`, copies into a fresh Uint8Array (MAP_PRIVATE
 * semantics; MAP_SHARED accepted but write-back deferred — see module
 * header). Returns null and sets lastErrno on bad args, MAP_FIXED, or
 * file-read failure.
 *
 * @param _addr      advisory address (ignored — JS has no address space)
 * @param len        bytes to map (must be > 0)
 * @param prot       PROT_READ | PROT_WRITE | PROT_EXEC | PROT_NONE
 * @param flags      MAP_ANONYMOUS | MAP_PRIVATE | MAP_SHARED [| MAP_FIXED]
 * @param fd         POSIX fd (ignored for MAP_ANONYMOUS)
 * @param offset     byte offset into the backing file (0 for anonymous)
 * @param vfs        Mirage VFS for file-backed mappings (required if !MAP_ANON)
 * @param resolvePath fd → VFS path resolver (required if !MAP_ANONYMOUS)
 */
export function mmap_real(
  _addr: unknown,
  len: number,
  prot: number,
  flags: number,
  fd: number,
  offset: number,
  vfs?: VirtualFileSystem,
  resolvePath?: MmapFdResolver,
): CPtrLike | null {
  // POSIX §mmap p3: len == 0 → fail with EINVAL.
  if (!Number.isFinite(len) || len <= 0) {
    _state.lastErrno = EINVAL;
    return MAP_FAILED;
  }
  // POSIX §mmap p3: MAP_FIXED requires honouring `addr`. We cannot in JS, so
  // fail explicitly rather than silently fall back — matches the contract
  // documented in CLAUDE.md (MAP_FIXED deferred entirely).
  if ((flags & MAP_FIXED) !== 0) {
    _state.lastErrno = EINVAL;
    return MAP_FAILED;
  }

  const anon = (flags & MAP_ANONYMOUS) !== 0;
  let buf: Uint8Array;
  let path: string | null = null;

  if (anon) {
    // POSIX §mmap p3: MAP_ANONYMOUS → zero-filled. Uint8Array is zero-init.
    try {
      buf = new Uint8Array(len);
    } catch {
      _state.lastErrno = ENOMEM;
      return MAP_FAILED;
    }
  } else {
    // File-backed mapping — need both VFS and fd resolver.
    if (!vfs || !resolvePath) {
      _state.lastErrno = EBADF;
      return MAP_FAILED;
    }
    const p = resolvePath(fd);
    if (!p) {
      _state.lastErrno = EBADF;
      return MAP_FAILED;
    }
    path = p;
    let fileData: Uint8Array;
    try {
      fileData = vfs.readFile(p);
    } catch {
      _state.lastErrno = EACCES;
      return MAP_FAILED;
    }
    if (offset < 0 || offset > fileData.length) {
      _state.lastErrno = EINVAL;
      return MAP_FAILED;
    }
    try {
      buf = new Uint8Array(len);
    } catch {
      _state.lastErrno = ENOMEM;
      return MAP_FAILED;
    }
    const end = Math.min(offset + len, fileData.length);
    if (end > offset) {
      buf.set(fileData.subarray(offset, end), 0);
    }
    // Bytes past EOF stay zero (POSIX: implementations may zero-fill the
    // tail of a mapping that extends past the file).
  }

  const record: MmapRegionRecord = {
    length: len,
    fd: anon ? -1 : fd,
    offset: anon ? 0 : offset,
    flags,
    prot,
    path,
    sharedFile: !anon && (flags & MAP_SHARED) !== 0,
  };
  _state.regions.set(buf, record);
  _state.lastErrno = 0;
  return { buf, off: 0 };
}

// ---------------------------------------------------------------------------
// munmap_real — POSIX.1-2017 §munmap. Returns 0 success, -1 EINVAL on
// unknown region.
// ---------------------------------------------------------------------------

/**
 * BRIDGE: posix-munmap — POSIX munmap → Map.delete.
 *
 * Removes the region from the registry so subsequent munmap returns -1 and
 * the GC can reclaim the buffer once the caller drops references. Per
 * POSIX, calling munmap on an address that is not currently mapped is
 * defined to fail with EINVAL.
 *
 * `_len` is accepted but unused — JS cannot partially unmap a Uint8Array;
 * the entire region is released atomically. This matches MmapManager.munmap
 * and the posix-shims fallback.
 */
export function munmap_real(addr: CPtrLike | null, _len: number): number {
  if (addr === null || addr === undefined || !addr.buf) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  const buf = addr.buf;
  if (!_state.regions.has(buf)) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  _state.regions.delete(buf);
  _state.lastErrno = 0;
  return 0;
}

// ---------------------------------------------------------------------------
// mprotect_real — POSIX.1-2017 §mprotect. Bookkeeping only; JS cannot
// enforce protection on direct typed-array access.
// ---------------------------------------------------------------------------

/**
 * BRIDGE: posix-mprotect — POSIX mprotect → record-only bookkeeping.
 *
 * JS has no way to make a Uint8Array read-only or PROT_NONE — direct
 * buffer access cannot be intercepted. We update the `prot` field in the
 * region record so introspection (and future PROT_NONE enforcement via a
 * MmapManager.peek/poke wrapper) sees the new state. Returns 0 on success,
 * -1 EINVAL if the region is unknown or `prot` has invalid bits set.
 */
export function mprotect_real(addr: CPtrLike | null, _len: number, prot: number): number {
  if (addr === null || addr === undefined || !addr.buf) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  const valid = PROT_NONE | PROT_READ | PROT_WRITE | PROT_EXEC;
  if ((prot & ~valid) !== 0) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  const rec = _state.regions.get(addr.buf);
  if (!rec) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  rec.prot = prot;
  _state.lastErrno = 0;
  return 0;
}

// ---------------------------------------------------------------------------
// msync_real — POSIX.1-2017 §msync. No-op for MAP_PRIVATE / anonymous;
// MAP_SHARED write-back deferred (see module header).
// ---------------------------------------------------------------------------

/**
 * BRIDGE: posix-msync — POSIX msync → no-op (read-only mappings) or
 * deferred (MAP_SHARED file mappings).
 *
 * Returns 0 on a successful no-op. Validates that the address corresponds
 * to a tracked region; unknown addresses return -1 EINVAL per POSIX.
 * `_flags` (MS_ASYNC / MS_SYNC / MS_INVALIDATE) is accepted and ignored.
 */
export function msync_real(addr: CPtrLike | null, _len: number, _flags: number): number {
  if (addr === null || addr === undefined || !addr.buf) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  if (!_state.regions.has(addr.buf)) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  // MAP_SHARED write-back is deferred; for now msync is a successful no-op
  // for both MAP_PRIVATE/anonymous (where it MUST be a no-op per POSIX —
  // there's no backing store to flush) and MAP_SHARED (where the documented
  // limitation in the module header applies).
  _state.lastErrno = 0;
  return 0;
}

// ---------------------------------------------------------------------------
// madvise_real — POSIX.1-2017 §posix_madvise / Linux madvise. Hint-only,
// always succeeds.
// ---------------------------------------------------------------------------

/**
 * BRIDGE: posix-madvise — POSIX madvise → no-op.
 *
 * POSIX defines madvise advice (MADV_NORMAL / MADV_RANDOM / MADV_SEQUENTIAL
 * / MADV_WILLNEED / MADV_DONTNEED / MADV_FREE) as a non-binding performance
 * hint to the kernel. JS has no kernel to advise, so this is a successful
 * no-op for known regions and EINVAL for unknown ones.
 */
export function madvise_real(addr: CPtrLike | null, _len: number, _advice: number): number {
  if (addr === null || addr === undefined || !addr.buf) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  if (!_state.regions.has(addr.buf)) {
    _state.lastErrno = EINVAL;
    return -1;
  }
  _state.lastErrno = 0;
  return 0;
}

// ---------------------------------------------------------------------------
// Introspection helpers — for tests and runtime conformance audits.
// ---------------------------------------------------------------------------

/** Number of currently-mapped regions. */
export function activeRegionCount(): number {
  return _state.regions.size;
}

/** Whether `addr` corresponds to a currently-mapped region. */
export function isMapped(addr: CPtrLike | null): boolean {
  return addr !== null && addr !== undefined && !!addr.buf && _state.regions.has(addr.buf);
}
