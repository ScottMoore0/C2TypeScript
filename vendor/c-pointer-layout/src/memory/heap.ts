// BC-2: Heap allocator — malloc/free/realloc/calloc with tracking.
// C17 §7.22.3: Memory management functions.
//
// This is a simple tracking allocator, not a real free-list allocator.
// Each allocation gets its own Uint8Array. The heap tracks allocations
// by identity (the Uint8Array reference) so free() can validate and
// double-free can be detected.

import { type CPtr, create, fromBuffer, isNull } from "./cptr.js";

export interface AllocationInfo {
  size: number;
  freed: boolean;
}

export class Heap {
  private allocations = new Map<Uint8Array, AllocationInfo>();
  private totalAllocated = 0;
  private totalFreed = 0;

  /** C17 §7.22.3.4 malloc: allocate size bytes, uninitialized. */
  // BRIDGE: size accepts number | bigint per CPtr design; idempotent Number()
  // coercion handles `(uint64_t)`-cast size arithmetic without TypeError.
  malloc(size: number | bigint): CPtr {
    const sz = typeof size === "bigint" ? Number(size) : Number(size ?? 0);
    if (sz === 0) return create(0);
    const buf = new Uint8Array(sz);
    this.allocations.set(buf, { size: sz, freed: false });
    this.totalAllocated += sz;
    return { buf, off: 0 };
  }

  /** C17 §7.22.3.2 calloc: allocate n*size bytes, zero-initialized. */
  // BRIDGE: count/size accept number | bigint per CPtr design.
  calloc(count: number | bigint, size: number | bigint): CPtr {
    const ci = typeof count === "bigint" ? Number(count) : Number(count ?? 0);
    const si = typeof size === "bigint" ? Number(size) : Number(size ?? 0);
    const total = ci * si;
    if (total === 0) return create(0);
    // Uint8Array is zero-initialized by default.
    const buf = new Uint8Array(total);
    this.allocations.set(buf, { size: total, freed: false });
    this.totalAllocated += total;
    return { buf, off: 0 };
  }

  /** C17 §7.22.3.5 realloc: resize an allocation, preserving data. */
  // BRIDGE: newSize accepts number | bigint per CPtr design.
  realloc(ptr: CPtr | null, newSize: number | bigint): CPtr {
    const sz = typeof newSize === "bigint" ? Number(newSize) : Number(newSize ?? 0);
    if (!ptr || isNull(ptr)) {
      return this.malloc(sz);
    }
    if (sz === 0) {
      this.free(ptr);
      return create(0);
    }

    const info = this.allocations.get(ptr.buf);
    if (!info || info.freed) {
      throw new Error("realloc: invalid pointer (not allocated or already freed)");
    }

    const newBuf = new Uint8Array(sz);
    const copyLen = Math.min(info.size, sz);
    newBuf.set(ptr.buf.subarray(0, copyLen));

    // Mark old allocation as freed, register new one.
    info.freed = true;
    this.totalFreed += info.size;
    this.allocations.set(newBuf, { size: sz, freed: false });
    this.totalAllocated += sz;

    return { buf: newBuf, off: 0 };
  }

  /** C17 §7.22.3.3 free: deallocate memory. */
  free(ptr: CPtr | null): void {
    if (!ptr || isNull(ptr)) return; // free(NULL) is a no-op per C17.

    const info = this.allocations.get(ptr.buf);
    if (!info) {
      throw new Error("free: pointer was not allocated by this heap");
    }
    if (info.freed) {
      throw new Error("free: double free detected");
    }
    info.freed = true;
    this.totalFreed += info.size;
  }

  /** Check if a pointer refers to a live (non-freed) allocation. */
  isLive(ptr: CPtr): boolean {
    const info = this.allocations.get(ptr.buf);
    return info !== undefined && !info.freed;
  }

  /** Get the size of the allocation a pointer belongs to. */
  allocationSize(ptr: CPtr): number | undefined {
    const info = this.allocations.get(ptr.buf);
    if (!info || info.freed) return undefined;
    return info.size;
  }

  /** C11 §7.22.3.1 aligned_alloc: allocate aligned memory. */
  aligned_alloc(alignment: number, size: number): CPtr {
    // In JS, all TypedArray allocations are naturally aligned to 8 bytes.
    // For larger alignments, we over-allocate and adjust the offset.
    if (alignment <= 8) return this.malloc(size);
    const total = size + alignment;
    const buf = new Uint8Array(total);
    this.allocations.set(buf, { size: total, freed: false });
    this.totalAllocated += total;
    // Align the offset
    const misalign = alignment - (0 % alignment); // buf always starts at 0
    const off = misalign === alignment ? 0 : misalign;
    return { buf, off };
  }

  /** POSIX posix_memalign: allocate aligned memory via out pointer. */
  posix_memalign(alignment: number, size: number): CPtr {
    return this.aligned_alloc(alignment, size);
  }

  /** POSIX memalign: allocate aligned memory. */
  memalign(alignment: number, size: number): CPtr {
    return this.aligned_alloc(alignment, size);
  }

  // --- Diagnostics ---

  /** Total bytes currently allocated (not freed). */
  get liveBytes(): number {
    return this.totalAllocated - this.totalFreed;
  }

  /** Total number of live allocations. */
  get liveCount(): number {
    let count = 0;
    for (const info of this.allocations.values()) {
      if (!info.freed) count++;
    }
    return count;
  }

  /** Check for leaks: returns info about all non-freed allocations. */
  leaks(): Array<{ size: number }> {
    const result: Array<{ size: number }> = [];
    for (const info of this.allocations.values()) {
      if (!info.freed) result.push({ size: info.size });
    }
    return result;
  }

  /** Reset the heap, clearing all tracking state. */
  reset(): void {
    this.allocations.clear();
    this.totalAllocated = 0;
    this.totalFreed = 0;
  }
}
