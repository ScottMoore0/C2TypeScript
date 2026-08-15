function __builtin_prefetch(..._args) { }
function __builtin_unreachable() { throw new Error('__builtin_unreachable reached (C17 §6.5.2.2 UB)'); }
function __builtin_assume(_cond) { }
function __builtin_rotateleft64(x, n) { const xb = typeof x === 'bigint' ? x : BigInt(Math.trunc(Number(x))); const nv = (typeof n === 'object' && n !== null && typeof n.valueOf === 'function') ? Number(n.valueOf()) : Number(n); const nb = typeof n === 'bigint' ? Number(n & 63n) : (nv & 63); const m = (1n << 64n) - 1n; const xu = xb & m; return ((xu << BigInt(nb)) | (xu >> BigInt(64 - nb))) & m; }
function __builtin_rotateleft32(x, n) { const s = n & 31; return ((x << s) | (x >>> (32 - s))) >>> 0; }
function __safe_div(a, b) { if (b === 0)
    throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a, b) { if (b === 0)
    throw new Error('Division by zero'); return a % b; }
function _write(fd, buf, count) { try {
    const data = typeof buf === 'string' ? buf : Buffer.from(buf);
    require('fs').writeSync(fd, data, 0, count);
    return count;
}
catch {
    return -1;
} }
function _read(fd, buf, count) { try {
    const b = Buffer.alloc(count);
    const n = require('fs').readSync(fd, b, 0, count, null);
    if (Array.isArray(buf)) {
        for (let i = 0; i < n; i++)
            buf[i] = b[i];
    }
    else if (buf && typeof buf === 'object' && 'value' in buf) {
        buf.value = b.toString('utf-8', 0, n);
    }
    return n;
}
catch {
    return -1;
} }
function wcsnlen(s, n) { if (s == null)
    return 0; const str = typeof s === 'string' ? s : (s?.buf ? cptr_to_string(s) : String(s)); return Math.min(str.length, n); }
function __builtin_llabs(x) { const v = typeof x === 'bigint' ? x : BigInt(Math.trunc(Number(x))); return v < 0n ? -v : v; }
function div(numer, denom) { return { quot: Math.trunc(numer / denom), rem: numer % denom }; }
function llabs(x) { if (typeof x === 'bigint')
    return x < 0n ? -x : x; return Math.abs(Number(x)); }
const ENOENT = 2, EACCES = 13, EEXIST = 17, EINTR = 4, EAGAIN = 11, EBADF = 9, EPERM = 1, ENOMEM = 12, EINVAL = 22, ENOSYS = 38, ERANGE = 34, EDOM = 33, EILSEQ = 84, ENFILE = 23, EMFILE = 24, ENOTTY = 25, EBUSY = 16, ENOSPC = 28, EROFS = 30, EPIPE = 32, ECONNREFUSED = 111, EADDRINUSE = 98, ETIMEDOUT = 110, ECONNRESET = 104;
let errno = 0;
export class std_bitset {
    _val;
    _size;
    constructor(size, val = 0) { this._size = size; const raw = val instanceof std_bitset ? val.to_ulong() : Number(val); this._val = raw & ((1 << size) - 1); }
    count() { let n = this._val >>> 0, c = 0; while (n) {
        c += n & 1;
        n >>>= 1;
    } return c; }
    test(pos) { return (this._val & (1 << pos)) !== 0; }
    set(pos, val = true) { if (pos !== undefined) {
        if (val)
            this._val |= (1 << pos);
        else
            this._val &= ~(1 << pos);
    }
    else
        this._val = (1 << this._size) - 1; return this; }
    reset(pos) { if (pos !== undefined)
        this._val &= ~(1 << pos);
    else
        this._val = 0; return this; }
    flip(pos) { if (pos !== undefined)
        this._val ^= (1 << pos);
    else
        this._val = ~this._val & ((1 << this._size) - 1); return this; }
    to_string() { return this._val.toString(2).padStart(this._size, '0'); }
    to_ulong() { return this._val; }
    to_ullong() { return this._val; }
    size() { return this._size; }
    any() { return this._val !== 0; }
    none() { return this._val === 0; }
    all() { return this._val === ((1 << this._size) - 1); }
    valueOf() { return this._val; }
    [Symbol.toPrimitive](hint) { if (hint === "number")
        return this._val; if (hint === "string")
        return this.to_string(); return this._val; }
}
function round(x) { return x >= 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5); }
function labs(x) { return Math.abs(x); }
function realloc(ptr, size) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    const sz = typeof size === 'bigint' ? Number(size) : Number(size ?? 0);
    if (ptr && ptr.__cptr_overlay === true) {
        const cp = ptr.__cptr;
        ptr = { buf: cp.buf, off: (cp.off ?? 0) + (ptr.__byteOff ?? 0) };
        return cptr_realloc(ptr, sz);
    }
    if (ptr && typeof ptr === 'object' && !ptr.buf && ptr.constructor && ptr.constructor.__fieldNames) { /* BRIDGE: struct-as-class realloc */
        const existing = ptr.__cptr;
        const newBuf = new Uint8Array(sz);
        if (existing && existing.buf) {
            const srcOff = existing.off ?? 0;
            const copyLen = Math.min(existing.buf.length - srcOff, sz);
            if (copyLen > 0)
                newBuf.set(existing.buf.subarray(srcOff, srcOff + copyLen));
        }
        ptr.__cptr = { buf: newBuf, off: 0 };
        ptr.__byteOff = 0;
        return ptr;
    }
    return cptr_realloc(ptr, sz);
}
function free(ptr) { }
// CPtr runtime for C pointer semantics
const __LITTLE_ENDIAN = true;
function cptr_create(size) { const n = typeof size === "bigint" ? Number(size) : Number(size ?? 0); return { buf: new Uint8Array(n), off: 0 }; }
function cptr_box_int32(val) { const b = new Uint8Array(4); new DataView(b.buffer).setInt32(0, val, true); return { buf: b, off: 0 }; }
function cptr_box_int8(val) { const b = new Uint8Array(1); b[0] = val & 0xFF; return { buf: b, off: 0 }; }
function cptr_box_float32(val) { const b = new Uint8Array(4); new DataView(b.buffer).setFloat32(0, val, true); return { buf: b, off: 0 }; }
function cptr_box_float64(val) { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, val, true); return { buf: b, off: 0 }; }
function __cptr_cached_array(arr, key, byteLen, writer, elemSize) {
    // Idempotence: if the caller already has a CPtr wrapper {buf, off}, pass through.
    if (arr && typeof arr === "object" && "buf" in arr && arr.buf instanceof Uint8Array)
        return arr;
    // C17 §6.5.3.2 + §6.5.16.1: the CPtr is a live view into the source JS
    // array. On every call, refresh buf from arr so JS-side writes are seen
    // through the CPtr. __src_arr + __src_writer + __elem_size are retained on
    // the CPtr so cptr_write_* helpers can back-propagate through cptr_offset.
    const existing = arr?.[key];
    const b = existing?.buf ?? new Uint8Array(byteLen);
    const v = new DataView(b.buffer);
    for (let i = 0; i < arr.length; i++)
        writer(v, i, Number(arr[i] ?? 0));
    if (existing?.buf)
        return existing;
    const ptr = { buf: b, off: 0, __src_arr: arr, __src_writer: writer, __elem_size: elemSize ?? 1 };
    if (arr && typeof arr === "object") {
        try {
            Object.defineProperty(arr, key, { value: ptr, enumerable: false, configurable: true, writable: true });
        }
        catch {
            arr[key] = ptr;
        }
    }
    return ptr;
}
function cptr_from_int_array(arr) { return __cptr_cached_array(arr, "__cptr_int32", arr.length * 4, (v, i, x) => v.setInt32(i * 4, x, true), 4); }
function cptr_from_uint32_array(arr) { return __cptr_cached_array(arr, "__cptr_uint32", arr.length * 4, (v, i, x) => v.setUint32(i * 4, x >>> 0, true), 4); }
function cptr_from_int16_array(arr) { return __cptr_cached_array(arr, "__cptr_int16", arr.length * 2, (v, i, x) => v.setInt16(i * 2, x, true), 2); }
function cptr_from_uint16_array(arr) { return __cptr_cached_array(arr, "__cptr_uint16", arr.length * 2, (v, i, x) => v.setUint16(i * 2, x & 0xFFFF, true), 2); }
function cptr_from_int8_array(arr) { return __cptr_cached_array(arr, "__cptr_int8", arr.length, (v, i, x) => v.setInt8(i, x), 1); }
function cptr_from_uint8_array(arr) {
    if (typeof arr === 'string')
        arr = cptr_from_string(arr);
    if (arr && arr.buf instanceof Uint8Array)
        return arr;
    return __cptr_cached_array(arr, "__cptr_uint8", arr.length, (v, i, x) => v.setUint8(i, x & 0xFF), 1);
}
function cptr_from_float32_array(arr) { return __cptr_cached_array(arr, "__cptr_float32", arr.length * 4, (v, i, x) => v.setFloat32(i * 4, x, true), 4); }
function cptr_from_float64_array(arr) { return __cptr_cached_array(arr, "__cptr_float64", arr.length * 8, (v, i, x) => v.setFloat64(i * 8, x, true), 8); }
// C17 §6.2.5 p5 / §7.20: uint64_t / int64_t are exactly 64 bits. Use BigInt accessors
// to preserve full precision through DataView.setBigUint64 / setBigInt64.
function __cptr_cached_array_bigint(arr, key, byteLen, writer) {
    // Idempotence: if arr is already a CPtr (from the earlier SML
    // array-to-DataView IIFE), pass it through unchanged. Re-encoding
    // would walk arr.length (undefined on a CPtr) and emit a zero-length
    // buffer, then DataView.getBigInt64 throws RangeError at the read.
    if (arr && arr.buf && typeof arr.off !== "undefined")
        return arr;
    const existing = arr?.[key];
    if (existing?.buf)
        return existing;
    const b = new Uint8Array(byteLen);
    const v = new DataView(b.buffer);
    for (let i = 0; i < arr.length; i++) {
        const x = arr[i];
        writer(v, i, typeof x === "bigint" ? x : BigInt(Math.trunc(Number(x ?? 0))));
    }
    const ptr = { buf: b, off: 0 };
    if (arr && typeof arr === "object") {
        try {
            Object.defineProperty(arr, key, { value: ptr, enumerable: false, configurable: true, writable: true });
        }
        catch {
            arr[key] = ptr;
        }
    }
    return ptr;
}
function cptr_from_uint64_array(arr) { return __cptr_cached_array_bigint(arr, "__cptr_uint64", arr.length * 8, (v, i, x) => v.setBigUint64(i * 8, BigInt.asUintN(64, x), true)); }
function cptr_from_int64_array(arr) { return __cptr_cached_array_bigint(arr, "__cptr_int64", arr.length * 8, (v, i, x) => v.setBigInt64(i * 8, BigInt.asIntN(64, x), true)); }
function cptr_offset(ptr, n) { if (typeof ptr === 'string') { /* C17 §6.5.6 pointer arithmetic chains: s+ls-lp lowers to cptr_offset(cptr_offset(s,ls),-lp). On a JS string the first substring drops absolute position; convert to CPtr so the chain composes. */
    const __b = new Uint8Array(ptr.length + 1);
    for (let __i = 0; __i < ptr.length; __i++)
        __b[__i] = ptr.charCodeAt(__i);
    return { buf: __b, off: Number(n) };
} if (ptr && ptr.__field_ref === true) {
    return { __field_ref: true, __owner: ptr.__owner, __owner_type: ptr.__owner_type, __field_name: ptr.__field_name, __field_offset: ptr.__field_offset, __byte_delta: (ptr.__byte_delta ?? 0) + Number(n) };
} if (ptr && ptr.__field_at_offset === true) {
    return { __field_at_offset: true, __owner: ptr.__owner, __byte_offset: (ptr.__byte_offset ?? 0) + Number(n) };
} /* BRIDGE: pointer-array — C17 §6.7.6.2 array-of-pointers (T*[N]) decays to T** (§6.3.2.1). When a slot-bearing CPtr (slots+__ptr_arr) is incremented, scale n by 8 (LLP64 sizeof(void*)) so cptr_read_ptr's off>>3 advances slot-by-slot, not byte-by-byte. */ /* BRIDGE: pointer-array — C17 §6.7.6.2 array-of-pointers (T*[N]) decays to T** (§6.3.2.1). When a slot-bearing CPtr (slots+__ptr_arr) is incremented, scale n by 8 (LLP64 sizeof(void*)) so cptr_read_ptr's off>>3 advances slot-by-slot, not byte-by-byte. */ if (ptr?.buf && ptr.__ptr_arr === true)
    return { buf: ptr.buf, off: (ptr.off ?? 0) + Number(n) * 8, slots: ptr.slots, __ptr_arr: true }; if (ptr?.buf)
    return { buf: ptr.buf, off: (ptr.off ?? 0) + n, __src_arr: ptr.__src_arr, __src_writer: ptr.__src_writer, __elem_size: ptr.__elem_size, __class_byte_view: ptr.__class_byte_view, __instance: ptr.__instance, __layout: ptr.__layout }; if (Array.isArray(ptr)) { /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: const T *arr[N] init-then-decay produces a T** that survives cptr_offset/cptr_read_ptr. Detect "JS array of pointers" by element shape (CPtr-like {buf,...} or null) and lift to a slot-bearing CPtr. Plain numeric arrays fall through to the int32-DataView path. */
    const isPtrArr = ptr.length > 0 && ptr.some((e) => e == null || (typeof e === 'object' && (e?.buf || e?.slots)));
    if (isPtrArr) {
        return { buf: new Uint8Array(ptr.length * 8), off: Number(n) * 8, slots: ptr.slice(), __ptr_arr: true };
    } /* C17 §6.5 p7 + §6.3.2.1: array-of-integer decay through a byte-pointer view. Memoise the byte buffer on the source array so repeated cptr_offset calls share storage and writes via memcpy/cptr_write_* survive — required for streaming-hash partial-block buffers like xxhash mem32/mem64. Reuse the typed-view cache (cptr_from_{u32,u64}_array stamps __cptr_uint32/uint64) when present; otherwise heuristically pick width from element type (bigint→8, number→4) and stamp __cptr_byteview. */
    const __pre64 = ptr.__cptr_uint64 || ptr.__cptr_int64;
    if (__pre64?.buf)
        return { buf: __pre64.buf, off: Number(n), __src_arr: ptr, __elem_size: 8 };
    const __pre32 = ptr.__cptr_uint32 || ptr.__cptr_int32;
    if (__pre32?.buf)
        return { buf: __pre32.buf, off: Number(n), __src_arr: ptr, __elem_size: 4 };
    const __preBV = ptr.__cptr_byteview;
    if (__preBV?.buf)
        return { buf: __preBV.buf, off: Number(n), __src_arr: ptr, __elem_size: __preBV.__elem_size };
    const __isBig = ptr.length > 0 && typeof ptr[0] === 'bigint';
    const __esz = __isBig ? 8 : 4;
    const b = new Uint8Array(ptr.length * __esz);
    const v = new DataView(b.buffer);
    for (let __i = 0; __i < ptr.length; __i++) {
        const __x = ptr[__i];
        if (__isBig)
            v.setBigUint64(__i * 8, BigInt.asUintN(64, typeof __x === 'bigint' ? __x : BigInt(Math.trunc(Number(__x ?? 0)))), true);
        else
            v.setInt32(__i * 4, Number(__x ?? 0) | 0, true);
    }
    const __bv = { buf: b, off: 0, __elem_size: __esz };
    try {
        Object.defineProperty(ptr, '__cptr_byteview', { value: __bv, enumerable: false, configurable: true, writable: true });
    }
    catch {
        ptr.__cptr_byteview = __bv;
    }
    return { buf: b, off: Number(n), __src_arr: ptr, __elem_size: __esz };
} if (ptr && typeof ptr === 'object' && !ptr.__cptr_overlay && !ptr.__arr && ptr.constructor && ptr.constructor.__fieldNames) {
    return { __field_at_offset: true, __owner: ptr, __byte_offset: Number(n) };
} return ptr; }
// C17 §6.5.16.1: writes through a CPtr derived from a JS array must mirror
// to the source array so subsequent arr[i] reads see the written value.
function __cptr_writeback(ptr, byteOff) { const arr = ptr.__src_arr; if (!arr)
    return; const es = ptr.__elem_size ?? 1; if (byteOff % es !== 0)
    return; const idx = byteOff / es; if (idx < 0 || idx >= arr.length)
    return; const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); if (es === 1)
    arr[idx] = dv.getInt8(byteOff);
else if (es === 2)
    arr[idx] = dv.getInt16(byteOff, true);
else if (es === 4)
    arr[idx] = dv.getInt32(byteOff, true);
else if (es === 8)
    arr[idx] = dv.getFloat64(byteOff, true); }
// C17 §6.5 p7: when a plain JS array has a memoised byte-view (stamped by
// cptr_offset or cptr_from_<T>_array), subsequent cptr_read_<T> / cptr_write_<T>
// calls on the array MUST go through that view — bytes written via memcpy live
// in the view, not in arr[i]. Without this routing, streaming-hash partial-block
// buffers (xxhash mem32/mem64, BLAKE2 block staging) read zeros from arr[i]
// while the actual data sits in the cached buffer.
function __cptr_arr_view(ptr) { if (!Array.isArray(ptr))
    return null; const __c = ptr.__cptr_uint64 || ptr.__cptr_int64 || ptr.__cptr_uint32 || ptr.__cptr_int32 || ptr.__cptr_byteview; return __c?.buf ? __c : null; }
function cptr_read(ptr, i = 0) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    if (Array.isArray(ptr))
        return ptr[i];
    if (!ptr?.buf)
        return 0;
    return ptr.buf[ptr.off + i] ?? 0;
}
function cptr_write(ptr, i, val) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    if (!ptr?.buf)
        return;
    ptr.buf[ptr.off + i] = val & 0xFF;
}
function cptr_to_string(ptr) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    if (!ptr)
        return '';
    const bytes = [];
    for (let i = ptr.off; i < ptr.buf.length; i++) {
        if (ptr.buf[i] === 0)
            break;
        bytes.push(ptr.buf[i]);
    }
    return String.fromCharCode(...bytes);
}
function cptr_from_string(str) { const buf = new Uint8Array(str.length + 1); for (let i = 0; i < str.length; i++)
    buf[i] = str.charCodeAt(i); buf[str.length] = 0; return { buf, off: 0 }; }
function cptr_strlen(ptr) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    if (!ptr)
        return 0;
    let i = 0;
    while (ptr.off + i < ptr.buf.length && ptr.buf[ptr.off + i] !== 0)
        i++;
    return i;
}
function cptr_memset(ptr, val, n) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    for (let i = 0; i < n; i++)
        ptr.buf[ptr.off + i] = val & 0xFF;
}
function cptr_copy(dst, src, n) {
    if (typeof dst === 'string')
        dst = cptr_from_string(dst);
    if (typeof src === 'string')
        src = cptr_from_string(src);
    for (let i = 0; i < n; i++)
        dst.buf[dst.off + i] = src.buf[src.off + i] ?? 0;
}
function cptr_realloc(ptr, newSize) { const sz = typeof newSize === "bigint" ? Number(newSize) : Number(newSize ?? 0); const n = new Uint8Array(sz); if (ptr) {
    const copyLen = Math.min(ptr.buf.length - ptr.off, sz);
    n.set(ptr.buf.subarray(ptr.off, ptr.off + copyLen));
} const r = { buf: n, off: 0 }; if (ptr && ptr.slots)
    r.slots = ptr.slots.slice(); return r; }
function cptr_clone(ptr) { if (ptr == null)
    return null; if (ptr?.buf) {
    const c = { buf: ptr.buf, off: ptr.off };
    if (ptr.slots)
        c.slots = ptr.slots;
    if (ptr.__ptr_arr)
        c.__ptr_arr = true;
    return c;
} /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: cloning a JS array-of-pointers (T*[N]) at a call boundary lifts it to a slot-bearing CPtr so callee-side cptr_offset/cptr_read_ptr operate on a T** view rather than treating it as an int32 array. */ /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: cloning a JS array-of-pointers (T*[N]) at a call boundary lifts it to a slot-bearing CPtr so callee-side cptr_offset/cptr_read_ptr operate on a T** view rather than treating it as an int32 array. */ if (Array.isArray(ptr)) {
    const isPtrArr = ptr.length > 0 && ptr.some((e) => e == null || (typeof e === 'object' && (e?.buf || e?.slots)));
    if (isPtrArr) {
        return { buf: new Uint8Array(ptr.length * 8), off: 0, slots: ptr.slice(), __ptr_arr: true };
    }
    return ptr;
} if (typeof ptr === 'string')
    return cptr_from_string(ptr); return ptr; }
function cptr_eq(a, b) {
    if (typeof a === 'string')
        a = cptr_from_string(a);
    if (typeof b === 'string')
        b = cptr_from_string(b);
    if (a === b)
        return true;
    if (!a || !b)
        return false;
    if (!a.buf && !b.buf)
        return false;
    return a.buf === b.buf && a.off === b.off;
}
function cptr_read_int8(ptr, i = 0) { const __av = __cptr_arr_view(ptr); if (__av)
    return new DataView(__av.buf.buffer, __av.buf.byteOffset).getInt8(i); if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr)
        return ptr.value;
    return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0);
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getInt8(ptr.off + i); }
function cptr_write_int8(ptr, i, val) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = val;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = val;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt8(ptr.off + i, val); if (ptr.__src_arr)
    __cptr_writeback(ptr, ptr.off + i); }
function cptr_read_uint8(ptr, i = 0) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    const __av = __cptr_arr_view(ptr);
    if (__av)
        return __av.buf[i] ?? 0;
    if (!ptr?.buf) {
        if (ptr && typeof ptr === 'object' && 'value' in ptr)
            return ptr.value;
        return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0);
    }
    return ptr.buf[ptr.off + i] ?? 0;
}
function cptr_write_uint8(ptr, i, val) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    if (!ptr?.buf) {
        if (ptr && typeof ptr === 'object' && 'value' in ptr) {
            ptr.value = val;
            return;
        }
        if (Array.isArray(ptr))
            ptr[i] = val;
        return;
    }
    ptr.buf[ptr.off + i] = val & 0xFF;
    if (ptr.__src_arr)
        __cptr_writeback(ptr, ptr.off + i);
}
function cptr_read_int16(ptr, i = 0) { const __av = __cptr_arr_view(ptr); if (__av)
    return new DataView(__av.buf.buffer, __av.buf.byteOffset).getInt16(i * 2, __LITTLE_ENDIAN); if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr)
        return ptr.value;
    return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0);
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getInt16(ptr.off + i * 2, __LITTLE_ENDIAN); }
function cptr_write_int16(ptr, i, val) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = val;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = val;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt16(ptr.off + i * 2, val, __LITTLE_ENDIAN); if (ptr.__src_arr)
    __cptr_writeback(ptr, ptr.off + i * 2); }
function cptr_read_uint16(ptr, i = 0) { const __av = __cptr_arr_view(ptr); if (__av)
    return new DataView(__av.buf.buffer, __av.buf.byteOffset).getUint16(i * 2, __LITTLE_ENDIAN); if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr)
        return ptr.value;
    return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0);
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getUint16(ptr.off + i * 2, __LITTLE_ENDIAN); }
function cptr_write_uint16(ptr, i, val) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = val;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = val;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setUint16(ptr.off + i * 2, val, __LITTLE_ENDIAN); if (ptr.__src_arr)
    __cptr_writeback(ptr, ptr.off + i * 2); }
function cptr_read_int32(ptr, i = 0) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    const __av = __cptr_arr_view(ptr);
    if (__av)
        return new DataView(__av.buf.buffer, __av.buf.byteOffset).getInt32(i * 4, __LITTLE_ENDIAN);
    if (!ptr?.buf) {
        if (ptr && typeof ptr === 'object' && 'value' in ptr)
            return ptr.value;
        return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0);
    }
    if (Array.isArray(ptr.buf)) {
        const idx = (ptr.off ?? 0) / 4 + i;
        return Number(ptr.buf[idx] ?? 0);
    }
    const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
    return dv.getInt32(ptr.off + i * 4, __LITTLE_ENDIAN);
}
function cptr_write_int32(ptr, i, val) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = val;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = val;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt32(ptr.off + i * 4, val, __LITTLE_ENDIAN); if (ptr.__src_arr)
    __cptr_writeback(ptr, ptr.off + i * 4); }
function cptr_read_uint32(ptr, i = 0) { const __av = __cptr_arr_view(ptr); if (__av)
    return new DataView(__av.buf.buffer, __av.buf.byteOffset).getUint32(i * 4, __LITTLE_ENDIAN); if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr)
        return ptr.value;
    return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0);
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getUint32(ptr.off + i * 4, __LITTLE_ENDIAN); }
function cptr_write_uint32(ptr, i, val) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = val;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = val;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setUint32(ptr.off + i * 4, val, __LITTLE_ENDIAN); if (ptr.__src_arr)
    __cptr_writeback(ptr, ptr.off + i * 4); }
function cptr_read_int64(ptr, i = 0) { const __av = __cptr_arr_view(ptr); if (__av)
    return new DataView(__av.buf.buffer, __av.buf.byteOffset).getBigInt64(i * 8, __LITTLE_ENDIAN); if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        const v = ptr.value;
        return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0)));
    }
    if (typeof ptr === 'bigint')
        return ptr;
    if (typeof ptr === 'number')
        return BigInt(Math.trunc(ptr));
    if (Array.isArray(ptr)) {
        const x = ptr[i];
        return typeof x === 'bigint' ? x : BigInt(Math.trunc(Number(x ?? 0)));
    }
    return 0n;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getBigInt64(ptr.off + i * 8, __LITTLE_ENDIAN); }
function cptr_write_int64(ptr, i, val) { const v = typeof val === 'bigint' ? val : BigInt(Math.trunc(Number(val ?? 0))); if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = v;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = v;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setBigInt64(ptr.off + i * 8, BigInt.asIntN(64, v), __LITTLE_ENDIAN); }
function cptr_read_uint64(ptr, i = 0) { const __av = __cptr_arr_view(ptr); if (__av)
    return new DataView(__av.buf.buffer, __av.buf.byteOffset).getBigUint64(i * 8, __LITTLE_ENDIAN); if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        const v = ptr.value;
        return typeof v === 'bigint' ? BigInt.asUintN(64, v) : BigInt(Math.trunc(Number(v ?? 0)));
    }
    if (typeof ptr === 'bigint')
        return BigInt.asUintN(64, ptr);
    if (typeof ptr === 'number')
        return BigInt(Math.trunc(ptr));
    if (Array.isArray(ptr)) {
        const x = ptr[i];
        return typeof x === 'bigint' ? BigInt.asUintN(64, x) : BigInt(Math.trunc(Number(x ?? 0)));
    }
    return 0n;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getBigUint64(ptr.off + i * 8, __LITTLE_ENDIAN); }
function cptr_write_uint64(ptr, i, val) { const v = typeof val === 'bigint' ? val : BigInt(Math.trunc(Number(val ?? 0))); if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = v;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = v;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setBigUint64(ptr.off + i * 8, BigInt.asUintN(64, v), __LITTLE_ENDIAN); }
function cptr_read_float32(ptr, i = 0) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr)
        return ptr.value;
    return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0);
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getFloat32(ptr.off + i * 4, __LITTLE_ENDIAN); }
function cptr_write_float32(ptr, i, val) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = val;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = val;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setFloat32(ptr.off + i * 4, val, __LITTLE_ENDIAN); if (ptr.__src_arr)
    __cptr_writeback(ptr, ptr.off + i * 4); }
function cptr_read_float64(ptr, i = 0) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr)
        return ptr.value;
    return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0);
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getFloat64(ptr.off + i * 8, __LITTLE_ENDIAN); }
function cptr_write_float64(ptr, i, val) { if (!ptr?.buf) {
    if (ptr && typeof ptr === 'object' && 'value' in ptr) {
        ptr.value = val;
        return;
    }
    if (Array.isArray(ptr))
        ptr[i] = val;
    return;
} const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setFloat64(ptr.off + i * 8, val, __LITTLE_ENDIAN); if (ptr.__src_arr)
    __cptr_writeback(ptr, ptr.off + i * 8); }
// C17 6.7.6.1 / 6.7.6.2: pointer-to-pointer (T**) read/write helpers.
// CPtr buf/off carries an optional parallel slots[] array of (CPtr | null)
// entries. cptr_write_ptr lazily attaches slots[] and stores the pointer
// reference at slots[idx]; it also stamps a non-zero sentinel into the byte
// view at idx*8 so byte-level scans (e.g. p->items[i] truthiness) still see
// the slot as truthy. cptr_read_ptr returns slots[idx] (or null when not yet
// written). memcpy/memmove of a slot-bearing CPtr copies the slot references
// alongside the bytes so a re-allocated buffer preserves pointer identity.
// Slot offset within the source CPtr is (off/8) so cptr_offset by 8*N
// preserves the slot view consistently.
function cptr_read_ptr(ptr, idx = 0) { if (ptr == null)
    return null; if (Array.isArray(ptr)) {
    const v = ptr[idx];
    return v ?? null;
} if (typeof ptr === 'object' && ptr.slots) {
    const slotIdx = ((ptr.off ?? 0) >> 3) + Number(idx);
    return ptr.slots[slotIdx] ?? null;
} return null; }
function cptr_write_ptr(ptr, idx, val) { if (ptr == null)
    return; if (Array.isArray(ptr)) {
    ptr[Number(idx)] = val;
    return;
} if (typeof ptr !== 'object')
    return; if (!ptr.slots)
    ptr.slots = []; const slotIdx = ((ptr.off ?? 0) >> 3) + Number(idx); ptr.slots[slotIdx] = val ?? null; if (ptr.buf) {
    const byteOff = ((ptr.off ?? 0) + Number(idx) * 8);
    const buf = ptr.buf;
    if (buf && buf.length >= byteOff + 1) {
        buf[byteOff] = val == null ? 0 : 0xFF;
    }
} }
function malloc(size) { return cptr_create(size); }
function abs(x) { if (x == null)
    return 0; return Math.abs(x); }
function memcpy(dst, src, n) {
    if (typeof dst === 'string')
        dst = cptr_from_string(dst);
    if (dst?.buf && src?.buf) {
        cptr_copy(dst, src, n); /* C17 §6.7.6.1: when src is a slot-bearing CPtr (T** array), copy the parallel slot references into dst so pointer identity survives the byte-copy. Slot stride is 8 bytes (LLP64 sizeof(void*)); slot indices align with byte offset >> 3. */
        if (src.slots) {
            const dstAny = dst;
            if (!dstAny.slots)
                dstAny.slots = [];
            const srcSlotBase = ((src.off ?? 0) >> 3);
            const dstSlotBase = ((dst.off ?? 0) >> 3);
            const slotCount = Math.floor(n / 8);
            for (let i = 0; i < slotCount; i++)
                dstAny.slots[dstSlotBase + i] = src.slots[srcSlotBase + i] ?? null;
        }
        return dst;
    }
    if (dst?.buf && typeof src === 'string') {
        for (let i = 0; i < n && i < src.length; i++)
            dst.buf[dst.off + i] = src.charCodeAt(i);
        return dst;
    }
    if (dst?.buf && src && typeof src === 'object' && 'value' in src && typeof src.value === 'number') {
        const dv = new DataView(dst.buf.buffer, dst.buf.byteOffset + dst.off);
        if (n >= 4)
            dv.setInt32(0, src.value, true);
        else if (n >= 2)
            dv.setInt16(0, src.value, true);
        else
            dv.setInt8(0, src.value);
        return dst;
    }
    if (dst && typeof dst === 'object' && 'value' in dst && src?.buf) { /* BRIDGE: memcpy(box, cptr, n) — read N bytes from a CPtr into a {value} box. C17 §7.24.2.1. n=8 → bigint64 (signed). n=4 → int32. n=2 → int16. n=1 → int8. */
        const dv = new DataView(src.buf.buffer, src.buf.byteOffset);
        const off = src.off ?? 0;
        if (n >= 8) {
            const bv = dv.getBigInt64(off, true);
            dst.value = (typeof dst.value === 'bigint') ? bv : Number(bv);
        }
        else if (n >= 4)
            dst.value = dv.getInt32(off, true);
        else if (n >= 2)
            dst.value = dv.getInt16(off, true);
        else
            dst.value = dv.getInt8(off);
        return dst;
    }
    if (dst && typeof dst === 'object' && 'value' in dst && src && typeof src === 'object' && 'value' in src) { /* C17 §6.5 type-pun via memcpy: reinterpret src.value bytes as dst's type. n=4: int32<->float32. n=8: int64<->float64 (via bigint). */
        const __b = new Uint8Array(8);
        const __dv = new DataView(__b.buffer);
        const __s = src.value;
        const __d = dst.value;
        if (n === 4) {
            if (Number.isInteger(__s) && !Number.isInteger(__d) && typeof __d === 'number') {
                __dv.setInt32(0, __s | 0, true);
                dst.value = __dv.getFloat32(0, true);
            }
            else if (!Number.isInteger(__s) && Number.isInteger(__d)) {
                __dv.setFloat32(0, __s, true);
                dst.value = __dv.getInt32(0, true);
            }
            else {
                dst.value = __s;
            }
        }
        else if (n === 8) {
            if (typeof __s === 'bigint' && typeof __d !== 'bigint') {
                __dv.setBigInt64(0, __s, true);
                dst.value = __dv.getFloat64(0, true);
            }
            else if (typeof __s !== 'bigint' && typeof __d === 'bigint') {
                __dv.setFloat64(0, Number(__s), true);
                dst.value = __dv.getBigInt64(0, true);
            }
            else if (Number.isInteger(__s) && !Number.isInteger(__d)) {
                __dv.setBigInt64(0, BigInt(Math.trunc(__s)), true);
                dst.value = __dv.getFloat64(0, true);
            }
            else if (!Number.isInteger(__s) && Number.isInteger(__d)) {
                __dv.setFloat64(0, __s, true);
                dst.value = Number(__dv.getBigInt64(0, true));
            }
            else {
                dst.value = __s;
            }
        }
        else {
            dst.value = __s;
        }
        return dst;
    }
    if (Array.isArray(dst) && src && src.buf) { /* BRIDGE: memcpy(Array, CPtr, n) — destination is a JS Array decayed from a struct/array of i64/i32/etc., source is a CPtr backed by a Uint8Array. Read element-wise via DataView using src.__elem_size when available, defaulting to 8 (int64 — covers curve25519 fcontract / fmonty origx<-x and BLAKE2 buffer staging). C17 §7.24.2.1: memcpy copies n bytes; element-size routing is the byte-addressable lowering for an i64 destination. */
        const dv = new DataView(src.buf.buffer, src.buf.byteOffset);
        const baseOff = src.off ?? 0;
        const elemSize = src.__elem_size || 8;
        const count = Math.floor(n / elemSize);
        for (let i = 0; i < count; i++) {
            const eoff = baseOff + i * elemSize;
            if (elemSize === 8)
                dst[i] = dv.getBigInt64(eoff, true);
            else if (elemSize === 4)
                dst[i] = dv.getInt32(eoff, true);
            else if (elemSize === 2)
                dst[i] = dv.getInt16(eoff, true);
            else
                dst[i] = dv.getInt8(eoff);
        }
        return dst;
    }
    if (Array.isArray(dst) && Array.isArray(src)) {
        for (let i = 0; i < n; i++)
            dst[i] = src[i];
    }
    else if (typeof dst === 'object' && typeof src === 'object')
        Object.assign(dst, src);
    return dst;
}
function memset(dst, val, n) { const __zeroObject = (obj) => { for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'number')
        obj[k] = val | 0;
    else if (typeof v === 'boolean')
        obj[k] = val !== 0;
    else if (typeof v === 'string')
        obj[k] = '';
    else if (v && typeof v === 'object' && v.buf)
        cptr_memset(v, val, v.buf.length);
    else if (Array.isArray(v) && v.length > 0 && typeof Object.values(v).find(x => x !== null && typeof x === 'object') !== 'undefined') {
        for (const item of v) {
            if (item && typeof item === 'object')
                __zeroObject(item);
        }
    }
    else if (Array.isArray(v)) {
        for (let i = 0; i < Math.min(n, v.length); i++)
            v[i] = val;
    }
    else if (v && typeof v === 'object')
        __zeroObject(v);
    else if (v != null)
        obj[k] = null;
} }; if (dst?.buf) {
    cptr_memset(dst, val, n);
    return dst;
} if (Array.isArray(dst) && dst.length > 0 && typeof Object.values(dst).find(x => x !== null && typeof x === 'object') !== 'undefined') {
    for (const obj of dst) {
        if (obj && typeof obj === 'object')
            __zeroObject(obj);
    }
    return dst;
} if (Array.isArray(dst)) {
    for (let _mi = 0; _mi < Math.min(n, dst.length); _mi++)
        dst[_mi] = val;
    return dst;
} if (dst && typeof dst === 'object') {
    __zeroObject(dst);
    return dst;
} return dst; }
// C++20 iterator helpers — shared by <algorithm> / <numeric>.
// Lowering: `v.begin()` to `v.values()` (C++20 §22.3.11). We patch
// Array.prototype.values once so the returned iterator carries __arr/__pos and
// coerces to its position via valueOf, so iterator arithmetic expressions like
// `it - v.begin()` (from std::distance lowerings) evaluate to a position index
// instead of NaN.
if (!Array.prototype.__cpp_values_patched) {
    Object.defineProperty(Array.prototype, '__cpp_values_patched', { value: true, enumerable: false });
    const __origValues = Array.prototype.values;
    Array.prototype.values = function () {
        const arr = this;
        let pos = 0;
        const it = {
            __arr: arr,
            get __pos() { return pos; },
            set __pos(v) { pos = v; },
            next() { if (pos < arr.length)
                return { value: arr[pos++], done: false }; return { value: undefined, done: true }; },
            [Symbol.iterator]() { return this; },
            valueOf() { return pos; },
            return(v) { pos = arr.length; return { value: v, done: true }; },
        };
        return it;
    };
    void __origValues;
}
function __cpp_arr(first, last) {
    if (first == null)
        return { arr: [], start: 0, end: 0 };
    if (Array.isArray(first)) {
        const end = (last != null && typeof last === 'number') ? last
            : (last && last.__arr === first) ? last.__pos
                : first.length;
        return { arr: first, start: 0, end };
    }
    if (first && first.__arr !== undefined && Array.isArray(first.__arr)) {
        const arr = first.__arr;
        const start = first.__pos ?? 0;
        const end = (last && last.__arr === arr) ? (last.__pos ?? arr.length)
            : (last == null) ? arr.length
                : (typeof last === 'number') ? last
                    : arr.length;
        return { arr, start, end };
    }
    // Fallback: any iterable — materialise
    const arr = Array.from(first);
    return { arr, start: 0, end: arr.length };
}
function __cpp_iter(arr, pos) {
    return { __arr: arr, __pos: pos, valueOf() { return this.__pos; }, [Symbol.iterator]() { let i = this.__pos; const self = this; return { next() { if (i < self.__arr.length)
                return { value: self.__arr[i++], done: false }; return { value: undefined, done: true }; } }; } };
}
// C++20 27.2.3 [iterator.requirements]: iterator equality compares position
// within the same range. Lowering: it == v.end() and similar
// patterns through this helper because strict object-identity is meaningless
// across distinct iterator literals: __cpp_iter(v, n) === __cpp_iter(v, n)
// is false even when the positions are equal.
function __cpp_iter_eq(a, b) {
    const ap = (a && typeof a === 'object' && '__pos' in a) ? a.__pos : (typeof a === 'number' ? a : Number(a));
    const bp = (b && typeof b === 'object' && '__pos' in b) ? b.__pos : (typeof b === 'number' ? b : Number(b));
    return ap === bp;
}
// back_inserter: C++20 §25.5.2.1. Accepts a ref-box { value: array } or the
// raw array. Produces a sink object with __push(x) and __arr pointing at the
// destination so algorithm shims that append do so via __push.
function back_inserter(c) {
    const target = (c && 'value' in c) ? c.value : c;
    return { __arr: target, __push(x) { target.push(x); }, __isBackInserter: true };
}
function front_inserter(c) {
    const target = (c && 'value' in c) ? c.value : c;
    return { __arr: target, __push(x) { target.unshift(x); }, __isBackInserter: true };
}
function inserter(c, pos) {
    const target = (c && 'value' in c) ? c.value : c;
    let idx = (pos && pos.__pos !== undefined) ? pos.__pos : (typeof pos === 'number' ? pos : target.length);
    return { __arr: target, __push(x) { target.splice(idx++, 0, x); }, __isBackInserter: true };
}
function __cpp_write(out, values) {
    if (out == null)
        return null;
    if (out.__isBackInserter) {
        for (const v of values)
            out.__push(v);
        return out;
    }
    if (Array.isArray(out)) {
        for (let i = 0; i < values.length; i++)
            out[i] = values[i];
        return __cpp_iter(out, values.length);
    }
    if (out.__arr !== undefined && Array.isArray(out.__arr)) {
        const a = out.__arr;
        let p = out.__pos ?? 0;
        for (const v of values)
            a[p++] = v;
        return __cpp_iter(a, p);
    }
    return null;
}
function reduce(first, last, init, op) { const A = __cpp_arr(first, last); const f = op ?? ((a, b) => a + b); let acc = init ?? 0; for (let i = A.start; i < A.end; i++)
    acc = f(acc, A.arr[i]); return acc; }
function min(a, b, comp) { if (b === undefined) {
    if (Array.isArray(a))
        return a.reduce((m, x) => x < m ? x : m, a[0]);
    return a;
} const lt = comp ?? ((x, y) => x < y); return lt(b, a) ? b : a; }
function memcmp(a, b, n) {
    if (typeof a === 'string')
        a = cptr_from_string(a);
    if (typeof b === 'string')
        b = cptr_from_string(b);
    if (a?.value !== undefined && b?.value !== undefined) {
        return a.value === b.value ? 0 : (a.value < b.value ? -1 : 1);
    }
    for (let i = 0; i < n; i++) {
        const av = a?.buf ? a.buf[a.off + i] : (typeof a === 'string' ? a.charCodeAt(i) : a?.[i] ?? 0);
        const bv = b?.buf ? b.buf[b.off + i] : (typeof b === 'string' ? b.charCodeAt(i) : b?.[i] ?? 0);
        if (av !== bv)
            return av - bv;
    }
    return 0;
}
function __builtin_expect(x, v) { return x; }
function pow(x, y) { return Math.pow(x, y); }
function strnlen(s, maxlen) {
    if (typeof s === 'string')
        s = cptr_from_string(s);
    if (s == null)
        return 0;
    if (typeof s === 'string')
        return Math.min(s.length, maxlen);
    if (s?.buf) {
        let i = 0;
        while (i < maxlen && (s.buf[s.off + i] ?? 0) !== 0)
            i++;
        return i;
    }
    if (Array.isArray(s)) {
        let i = 0;
        while (i < maxlen && s[i] !== 0 && s[i] !== undefined)
            i++;
        return i;
    }
    return 0;
}
function fill(first, last, value) { const A = __cpp_arr(first, last); for (let i = A.start; i < A.end; i++)
    A.arr[i] = value; }
function max(a, b, comp) { if (b === undefined) {
    if (Array.isArray(a))
        return a.reduce((m, x) => x > m ? x : m, a[0]);
    return a;
} const lt = comp ?? ((x, y) => x < y); return lt(a, b) ? b : a; }
function trunc(x) { return Math.trunc(x); }
function unique(first, last, pred) { const A = __cpp_arr(first, last); const eq = pred ?? ((a, b) => a === b); if (A.end <= A.start)
    return __cpp_iter(A.arr, A.start); let w = A.start + 1; for (let i = A.start + 1; i < A.end; i++)
    if (!eq(A.arr[w - 1], A.arr[i]))
        A.arr[w++] = A.arr[i]; return __cpp_iter(A.arr, w); }
/* stdbool: true/false are native in TypeScript */
/* ═══════════════════════════════════════════════
 * TRANSLATOR DIAGNOSTICS
 * ═══════════════════════════════════════════════
 * One entry per unique (kind, reason). See emitter.diagnostics
 * for the full list with all source locations.
 *
 * ── ERRORS (1) ──
 *   [unsupported] [x3]
 *     inline assembly is platform-specific and cannot be translated to TypeScript: (asm template not exposed in AST)
 *
 * ── WARNINGS (2) ──
 *   [FullComment] [x3]
 *     unhandled expression node kind FullComment
 *   [unsupported-int128-arithmetic]
 *     __int128 / __uint128 arithmetic is a GCC extension (not in C17); lowered to BigInt — semantically correct but performance/representation differs from native 128-bit
 *
 * ═══════════════════════════════════════════════ */
function i32(x) { return x | 0; }
function u32(x) { return x >>> 0; }
function __as_bigint(x) { if (typeof x === 'bigint')
    return x; if (typeof x === 'number')
    return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) {
    const v = x.value;
    return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0)));
} if (typeof x === 'boolean')
    return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x) { return BigInt.asUintN(64, x); }
function __i64(x) { return BigInt.asIntN(64, x); }
function __safe_div_i64(a, b) { if (b === 0n)
    throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a, b) { if (b === 0n)
    throw new Error('Division by zero'); return a % b; }
const __rt_objId_map = new WeakMap();
const __rt_objId_inverse = new Map();
let __rt_objId_next = 64;
function __rt_objId(o) { if (o == null || typeof o !== 'object')
    return 0; let id = __rt_objId_map.get(o); if (id === undefined) {
    id = __rt_objId_next;
    __rt_objId_next += 64;
    __rt_objId_map.set(o, id);
    __rt_objId_inverse.set(id, o);
} return id; }
const __rt_cptrInt_byBuf = new WeakMap();
const __rt_cptrInt_inverse = new Map();
let __rt_cptrInt_next = -64;
function __rt_ptr_to_intptr(p) {
    if (typeof p === 'string')
        p = cptr_from_string(p);
    if (p == null)
        return 0;
    if (p && p.buf && typeof p.off !== 'undefined') {
        let m = __rt_cptrInt_byBuf.get(p.buf);
        if (!m) {
            m = new Map();
            __rt_cptrInt_byBuf.set(p.buf, m);
        }
        const off = p.off ?? 0;
        let id = m.get(off);
        if (id === undefined) {
            id = __rt_cptrInt_next;
            __rt_cptrInt_next -= 64;
            m.set(off, id);
            __rt_cptrInt_inverse.set(id, { buf: p.buf, off });
        }
        return id;
    }
    return __rt_objId(p);
}
function __rt_intptr_to_ptr(i) { if (i === 0 || i === 0n || i == null)
    return null; const n = typeof i === 'bigint' ? Number(i) : i; if (__rt_cptrInt_inverse.has(n))
    return __rt_cptrInt_inverse.get(n); if (__rt_objId_inverse.has(n))
    return __rt_objId_inverse.get(n); return n; }
function __struct_ptr_at(p, i) { if (p == null)
    return p; const idx = Number(i) | 0; if (Array.isArray(p))
    return p[idx]; if (p && p.__arr !== undefined)
    return p.__arr[(p.__idx ?? 0) + idx]; if (p && p.__cptr_overlay === true && idx !== 0) {
    return cptr_struct_overlay(p.__structT, p.__cptr, (p.__byteOff ?? 0) + idx * (p.__layout?.totalSize ?? 0));
} if (p && p.__field_ref === true && idx === 0) { /* C17 §6.3.2.3 p7: container_of round-trip recovery. Fire ONLY when explicit pointer arithmetic happened (byte_delta != 0) and the accumulated delta + field_offset cancels to 0. The byte_delta=0 case is direct field-ref dereference (`(&t.f)->subfield`) — the field-ref Proxy itself handles sub-field access via property forwarding, so returning the owner here would incorrectly resolve `(g.nilvalue_field_ref)->value_` to `g.value_` (undefined) instead of `g.nilvalue.value_`. The cast-back form `(T*)((char*)&t.m - offsetof(T,m))` still works through cptr_struct_overlay's separate round-trip path. */
    const bd = p.__byte_delta ?? 0;
    if (bd !== 0 && bd + (p.__field_offset ?? 0) === 0)
        return p.__owner;
} if (p && p.__field_at_offset === true && idx === 0) { /* C17 §6.3.2.3 p7 + §7.19: resolve inverse-container_of shape. byte_offset 0 with cast target == owner's type is round-trip back to owner; otherwise look up the field at byte offset on the owner's class. */
    const ctor = p.__owner ? p.__owner.constructor : null;
    const target = p.__byte_offset ?? 0;
    if (target === 0 && p.__cast_target === ctor)
        return p.__owner;
    if (ctor && ctor.__fieldNames) {
        if (ctor.__fieldOffsets) {
            for (let k = 0; k < ctor.__fieldNames.length; k++) {
                if (ctor.__fieldOffsets[k] === target)
                    return p.__owner[ctor.__fieldNames[k]];
            }
        }
        else if (ctor.__fieldTypes) {
            const SZ = { bool: 1, int8: 1, uint8: 1, char: 1, bytes: 1, int16: 2, uint16: 2, int32: 4, uint32: 4, float: 4, int64: 8, uint64: 8, double: 8, ptr: 8 };
            let off = 0;
            for (let k = 0; k < ctor.__fieldNames.length; k++) {
                if (off === target)
                    return p.__owner[ctor.__fieldNames[k]];
                off += SZ[ctor.__fieldTypes[k]] ?? 4;
            }
        }
    }
    if (target === 0)
        return p.__owner;
} return p; }
function __struct_array_with_tail(n, ctor, tail) { const a = Array.from({ length: n }, ctor); a[n] = { buf: new Uint8Array(Math.max(0, tail | 0)), off: 0 }; return a; }
function __cptr_overlay_layout(T) {
    if (T.__overlay_layout)
        return T.__overlay_layout;
    const types = T.__fieldTypes ?? [];
    const names = T.__fieldNames ?? [];
    const SZ = { 'bool': 1, 'int8': 1, 'int16': 2, 'int32': 4, 'int64': 8, 'float': 4, 'double': 8, 'bytes': 0 };
    const AL = { 'bool': 1, 'int8': 1, 'int16': 2, 'int32': 4, 'int64': 8, 'float': 4, 'double': 8, 'bytes': 1 };
    const isPacked = T.__packed === true;
    const isUnion = T.__union === true;
    const fields = [];
    let off = 0;
    let maxAl = 1;
    for (let i = 0; i < types.length; i++) {
        const ty = types[i];
        const sz = SZ[ty] ?? 4;
        const al = AL[ty] ?? sz;
        const isLast = i === types.length - 1;
        if (isUnion) {
            // C17 §6.7.2.1 p16: every union member shares offset 0.
            fields.push({ name: names[i], type: ty, offset: 0, size: sz });
            if (sz > off)
                off = sz;
            continue;
        }
        if (ty === 'bytes' && isLast) {
            fields.push({ name: names[i], type: ty, offset: off, size: 0 });
            continue;
        }
        if (!isPacked) {
            const pad = (al - (off % al)) % al;
            off += pad;
            if (al > maxAl)
                maxAl = al;
        }
        fields.push({ name: names[i], type: ty, offset: off, size: sz });
        off += sz;
    }
    T.__overlay_layout = { fields, totalSize: off };
    return T.__overlay_layout;
}
function cptr_struct_overlay(T, p, byteOff) {
    if (typeof p === 'string')
        p = cptr_from_string(p);
    if (p == null)
        return p;
    // C17 §6.3.2.3 p7 + §7.19: inverse-container_of bridge. When p was
    // produced by `(InnerT*)((char*)container + offsetof(ContainerT, f))`
    // (the inverse of container_of, used by intrusive-list libs like
    // uthash's HH_FROM_ELMT, Linux hlist, BSD sys/queue.h), resolve the
    // byte offset to the named field on the JS-class-backed container
    // and return the live nested struct. This makes writes through the
    // resulting pointer propagate to container.field.
    if (p && p.__field_at_offset === true) {
        const newOff = (p.__byte_offset ?? 0) + (byteOff ?? 0);
        const ownerCtor = p.__owner ? p.__owner.constructor : null;
        // Round-trip recovery: when the cast target matches the owner's
        // class and the accumulated offset is 0, return the owner directly
        // so pointer-equality (recovered == original) holds.
        if (newOff === 0 && T === ownerCtor)
            return p.__owner;
        // Tag with the cast target type and accumulate byteOff. Resolution
        // for non-round-trip cases happens in __struct_ptr_at when the
        // consumer dereferences. This preserves the back-reference chain
        // so a subsequent cptr_offset (the reverse direction in a
        // forward+reverse round-trip) can still recover the container.
        return { __field_at_offset: true, __owner: p.__owner, __byte_offset: newOff, __cast_target: T };
    }
    // C17 §6.5 p7 + §7.19: inverse-container_of via class-byte-view.
    // When p was produced by `(unsigned char *)container_ptr` followed
    // by `cptr_offset(view, off)` and is now being recast to a struct
    // pointer, route to the live container's field at byte offset `off`
    // — same recovery semantics as the __field_at_offset path. This
    // keeps writes through the resulting pointer propagating to the
    // original container.field instead of dead-ending on the snapshot
    // buffer. Round-trip when off === 0 and T === container's class.
    if (p && p.__class_byte_view === true && p.__instance) {
        const totalOff = (p.off ?? 0) + (byteOff ?? 0);
        const ownerCtor2 = p.__instance.constructor;
        if (totalOff === 0 && T === ownerCtor2)
            return p.__instance;
        return { __field_at_offset: true, __owner: p.__instance, __byte_offset: totalOff, __cast_target: T };
    }
    // C17 §6.3.2.3 p7 + §7.19: container_of round-trip recovery. If p
    // is a field reference whose accumulated byte_delta exactly cancels
    // its field_offset (`(T*)((char*)&t.m - offsetof(T, m))`), return
    // the containing struct. Otherwise the cast is UB per §6.3.2.3 p7;
    // best-effort: still return owner so misshapen code at least
    // doesn't crash. Future: emit a compile-time diagnostic.
    if (p && p.__field_ref === true) {
        return p.__owner;
    }
    if (Array.isArray(p))
        return p[0];
    if (p && p.__arr !== undefined)
        return p.__arr[(p.__idx ?? 0)];
    if (!(p && p.buf !== undefined))
        return p;
    // Bit-field struct: the class encodes per-field shift+mask; route the
    // class's internal DataView at the external buffer so its accessors
    // operate directly on the caller's bytes. C17 §6.7.2.1 p11.
    if (T.__bitfield === true && p.buf && (p.buf.buffer instanceof ArrayBuffer)) {
        return new T(p.buf, (p.off ?? 0) + (byteOff ?? 0));
    }
    const layout = __cptr_overlay_layout(T);
    const baseByteOff = byteOff ?? 0;
    const view = { __cptr_overlay: true, __cptr: p, __layout: layout, __byteOff: baseByteOff, __structT: T };
    for (const f of layout.fields) {
        const off = f.offset, ty = f.type, name = f.name;
        Object.defineProperty(view, name, {
            enumerable: true, configurable: false,
            get() {
                const buf = p.buf;
                const at = (p.off ?? 0) + baseByteOff + off;
                switch (ty) {
                    case 'bool':
                    case 'int8': {
                        const v = buf[at] & 0xFF;
                        return (v << 24) >> 24;
                    }
                    case 'int16': {
                        const v = (buf[at] & 0xFF) | ((buf[at + 1] & 0xFF) << 8);
                        return (v << 16) >> 16;
                    }
                    case 'int32': {
                        return ((buf[at] & 0xFF) | ((buf[at + 1] & 0xFF) << 8) | ((buf[at + 2] & 0xFF) << 16) | ((buf[at + 3] & 0xFF) << 24)) | 0;
                    }
                    case 'int64': {
                        const lo = ((buf[at] & 0xFF) | ((buf[at + 1] & 0xFF) << 8) | ((buf[at + 2] & 0xFF) << 16)) + ((buf[at + 3] & 0xFF) * 0x1000000);
                        const hi = ((buf[at + 4] & 0xFF) | ((buf[at + 5] & 0xFF) << 8) | ((buf[at + 6] & 0xFF) << 16)) + ((buf[at + 7] & 0xFF) * 0x1000000);
                        return lo + hi * 0x100000000;
                    }
                    case 'float': {
                        const dv = new DataView(new ArrayBuffer(4));
                        for (let k = 0; k < 4; k++)
                            dv.setUint8(k, buf[at + k] & 0xFF);
                        return dv.getFloat32(0, true);
                    }
                    case 'double': {
                        const dv = new DataView(new ArrayBuffer(8));
                        for (let k = 0; k < 8; k++)
                            dv.setUint8(k, buf[at + k] & 0xFF);
                        return dv.getFloat64(0, true);
                    }
                    case 'bytes': {
                        return new Proxy({}, { get: (_t, k) => { if (k === 'buf')
                                return buf; if (k === 'off')
                                return at; const ii = Number(k); if (!isNaN(ii))
                                return buf[at + ii] & 0xFF; return undefined; }, set: (_t, k, val) => { const ii = Number(k); if (!isNaN(ii))
                                buf[at + ii] = Number(val) & 0xFF; return true; } });
                    }
                }
                return undefined;
            },
            set(val) {
                const buf = p.buf;
                const at = (p.off ?? 0) + baseByteOff + off;
                switch (ty) {
                    case 'bool':
                    case 'int8': {
                        const v = Number(val) | 0;
                        buf[at] = v & 0xFF;
                        return;
                    }
                    case 'int16': {
                        const v = Number(val) | 0;
                        buf[at] = v & 0xFF;
                        buf[at + 1] = (v >> 8) & 0xFF;
                        return;
                    }
                    case 'int32': {
                        const v = Number(val) | 0;
                        buf[at] = v & 0xFF;
                        buf[at + 1] = (v >> 8) & 0xFF;
                        buf[at + 2] = (v >> 16) & 0xFF;
                        buf[at + 3] = (v >> 24) & 0xFF;
                        return;
                    }
                    case 'int64': {
                        let big = typeof val === 'bigint' ? val : BigInt(Math.trunc(Number(val)));
                        for (let k = 0; k < 8; k++) {
                            buf[at + k] = Number(big & 0xffn) & 0xFF;
                            big = big >> 8n;
                        }
                        return;
                    }
                    case 'float': {
                        const dv = new DataView(new ArrayBuffer(4));
                        dv.setFloat32(0, Number(val), true);
                        for (let k = 0; k < 4; k++)
                            buf[at + k] = dv.getUint8(k);
                        return;
                    }
                    case 'double': {
                        const dv = new DataView(new ArrayBuffer(8));
                        dv.setFloat64(0, Number(val), true);
                        for (let k = 0; k < 8; k++)
                            buf[at + k] = dv.getUint8(k);
                        return;
                    }
                }
            },
        });
    }
    return view;
}
function __field_ref_scalar(getOwner, ownerType, fieldName, fieldOffset) {
    let _buf = null;
    let _view = null;
    let _proxy = null;
    function _width() {
        const o = getOwner();
        if (!o || !o.constructor)
            return 4;
        const ft = o.constructor.__fieldTypes;
        const fn = o.constructor.__fieldNames;
        if (!ft || !fn)
            return 4;
        const i = fn.indexOf(fieldName);
        if (i < 0)
            return 4;
        const t = ft[i] || '';
        if (/int8|uint8|^char$|^bool$|bytes/.test(t))
            return 1;
        if (/int16|uint16|short/.test(t))
            return 2;
        if (/int64|uint64|long\s*long|double/.test(t))
            return 8;
        return 4;
    }
    function _ensureBuf() {
        if (_buf != null)
            return;
        const w = _width();
        _buf = new Uint8Array(w);
        _view = new DataView(_buf.buffer);
        const v = getOwner()?.[fieldName];
        if (w === 1)
            _buf[0] = (Number(v) | 0) & 0xFF;
        else if (w === 2)
            _view.setUint16(0, Number(v ?? 0) & 0xFFFF, true);
        else if (w === 4)
            _view.setUint32(0, (Number(v ?? 0)) >>> 0, true);
        else {
            const bv = typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0)));
            _view.setBigUint64(0, BigInt.asUintN(64, bv), true);
        }
    }
    function _unpack() {
        if (_buf == null || _view == null)
            return;
        const w = _width();
        let nv;
        if (w === 1)
            nv = _buf[0];
        else if (w === 2)
            nv = _view.getUint16(0, true);
        else if (w === 4)
            nv = _view.getUint32(0, true);
        else
            nv = _view.getBigUint64(0, true);
        getOwner()[fieldName] = nv;
    }
    return {
        __field_ref: true,
        __owner_type: ownerType, __field_name: fieldName,
        __field_offset: fieldOffset, __byte_delta: 0,
        off: 0,
        get __owner() { return getOwner(); },
        get value() { return getOwner()[fieldName]; },
        set value(v) { getOwner()[fieldName] = v; },
        get buf() {
            _ensureBuf();
            if (_proxy == null) {
                _proxy = new Proxy(_buf, {
                    get(t, p) { return t[p]; },
                    set(t, p, v) {
                        const isIdx = typeof p === 'string' && /^\d+$/.test(p);
                        t[p] = isIdx ? (Number(v) & 0xFF) : v;
                        if (isIdx)
                            _unpack();
                        return true;
                    },
                });
            }
            return _proxy;
        },
    };
}
function __field_ref_aggregate(getOwner, ownerType, fieldName, fieldOffset) {
    const meta = {
        __field_ref: true,
        __owner_type: ownerType, __field_name: fieldName,
        __field_offset: fieldOffset, __byte_delta: 0,
    };
    return new Proxy({}, {
        get(_t, prop) {
            if (prop === '__owner')
                return getOwner();
            if (prop in meta)
                return meta[prop];
            const inner = getOwner()[fieldName];
            return inner == null ? undefined : inner[prop];
        },
        set(_t, prop, val) {
            if (prop in meta) {
                meta[prop] = val;
                return true;
            }
            const inner = getOwner()[fieldName];
            if (inner != null)
                inner[prop] = val;
            return true;
        },
        has(_t, prop) { return prop in meta || (prop in (getOwner()[fieldName] ?? {})); },
    });
}
function container_of(p, _T, _member) {
    if (p == null)
        return null;
    if (p.__field_ref === true)
        return p.__owner;
    return p; /* best-effort identity; UB per C17 §6.3.2.3 p7 */
}
function __debugbreak() {
    (() => { throw new Error("inline asm not supported in TS translation: (asm template not exposed in AST)"); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
}
function __fastfail(_Code) {
    (() => { throw new Error("inline asm not supported in TS translation: (asm template not exposed in AST)"); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
    (() => { throw new Error("__builtin_unreachable reached"); })();
}
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class localeinfo_struct {
    locinfo;
    mbcinfo;
    constructor() {
        this.locinfo = undefined;
        this.mbcinfo = undefined;
    }
}
const _locale_tstruct = localeinfo_struct;
localeinfo_struct.__fieldTypes = ["int32", "int32"];
localeinfo_struct.__fieldNames = ["locinfo", "mbcinfo"];
localeinfo_struct.__fieldOffsets = [0, 8];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class tagLC_ID {
    wLanguage;
    wCountry;
    wCodePage;
    constructor() {
        this.wLanguage = 0;
        this.wCountry = 0;
        this.wCodePage = 0;
    }
}
const LC_ID = tagLC_ID;
tagLC_ID.__fieldTypes = ["int16", "int16", "int16"];
tagLC_ID.__fieldNames = ["wLanguage", "wCountry", "wCodePage"];
tagLC_ID.__fieldOffsets = [0, 2, 4];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class threadlocaleinfostruct {
    _locale_pctype;
    _locale_mb_cur_max;
    _locale_lc_codepage;
    constructor() {
        this._locale_pctype = null;
        this._locale_mb_cur_max = 0;
        this._locale_lc_codepage = 0;
    }
}
const threadlocinfo = threadlocaleinfostruct;
threadlocaleinfostruct.__fieldTypes = ["int64", "int32", "int32"];
threadlocaleinfostruct.__fieldNames = ["_locale_pctype", "_locale_mb_cur_max", "_locale_lc_codepage"];
threadlocaleinfostruct.__fieldOffsets = [0, 8, 12];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class max_align_t {
    __max_align_ll;
    __max_align_ld;
    constructor() {
        this.__max_align_ll = 0;
        this.__max_align_ld = 0.0;
    }
}
max_align_t.__fieldTypes = ["int64", "double"];
max_align_t.__fieldNames = ["__max_align_ll", "__max_align_ld"];
max_align_t.__fieldOffsets = [0, 16];
export const XXH_OK = 0;
export const XXH_ERROR = undefined /* UNSUPPORTED: unhandled expression node kind FullComment */;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class XXH32_canonical_t {
    digest = cptr_create(4);
    constructor() {
        this.digest = cptr_create(4);
    }
}
XXH32_canonical_t.__fieldTypes = ["bytes"];
XXH32_canonical_t.__fieldNames = ["digest"];
XXH32_canonical_t.__fieldOffsets = [0];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class XXH64_canonical_t {
    digest = cptr_create(8);
    constructor() {
        this.digest = cptr_create(8);
    }
}
XXH64_canonical_t.__fieldTypes = ["bytes"];
XXH64_canonical_t.__fieldNames = ["digest"];
XXH64_canonical_t.__fieldOffsets = [0];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class XXH128_hash_t {
    low64;
    high64;
    constructor() {
        this.low64 = 0;
        this.high64 = 0;
    }
}
XXH128_hash_t.__fieldTypes = ["int32", "int32"];
XXH128_hash_t.__fieldNames = ["low64", "high64"];
XXH128_hash_t.__fieldOffsets = [0, 8];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class XXH128_canonical_t {
    digest = cptr_create(16);
    constructor() {
        this.digest = cptr_create(16);
    }
}
XXH128_canonical_t.__fieldTypes = ["bytes"];
XXH128_canonical_t.__fieldNames = ["digest"];
XXH128_canonical_t.__fieldOffsets = [0];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class XXH32_state_s {
    total_len_32;
    large_len;
    v = new Array(4).fill(0);
    mem32 = new Array(4).fill(0);
    memsize;
    reserved;
    constructor() {
        this.total_len_32 = 0;
        this.large_len = 0;
        this.v = new Array(4).fill(0);
        this.mem32 = new Array(4).fill(0);
        this.memsize = 0;
        this.reserved = 0;
    }
}
const XXH32_state_t = XXH32_state_s;
XXH32_state_s.__fieldTypes = ["int32", "int32", "bytes", "bytes", "int32", "int32"];
XXH32_state_s.__fieldNames = ["total_len_32", "large_len", "v", "mem32", "memsize", "reserved"];
XXH32_state_s.__fieldOffsets = [0, 8, 16, 48, 80, 88];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class XXH64_state_s {
    total_len;
    v = new Array(4).fill(0);
    mem64 = new Array(4).fill(0);
    memsize;
    reserved32;
    reserved64;
    constructor() {
        this.total_len = 0;
        this.v = new Array(4).fill(0);
        this.mem64 = new Array(4).fill(0);
        this.memsize = 0;
        this.reserved32 = 0;
        this.reserved64 = 0;
    }
}
const XXH64_state_t = XXH64_state_s;
XXH64_state_s.__fieldTypes = ["int32", "bytes", "bytes", "int32", "int32", "int32"];
XXH64_state_s.__fieldNames = ["total_len", "v", "mem64", "memsize", "reserved32", "reserved64"];
XXH64_state_s.__fieldOffsets = [0, 8, 40, 72, 80, 88];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class XXH3_state_s {
    acc = new Array(8).fill(0);
    customSecret = cptr_create(192);
    buffer = cptr_create(256);
    bufferedSize;
    useSeed;
    nbStripesSoFar;
    totalLen;
    nbStripesPerBlock;
    secretLimit;
    seed;
    reserved64;
    extSecret;
    constructor() {
        this.acc = new Array(8).fill(0);
        this.customSecret = cptr_create(192);
        this.buffer = cptr_create(256);
        this.bufferedSize = 0;
        this.useSeed = 0;
        this.nbStripesSoFar = 0;
        this.totalLen = 0;
        this.nbStripesPerBlock = 0;
        this.secretLimit = 0;
        this.seed = 0;
        this.reserved64 = 0;
        this.extSecret = null;
    }
}
const XXH3_state_t = XXH3_state_s;
XXH3_state_s.__fieldTypes = ["bytes", "bytes", "bytes", "int32", "int32", "int64", "int32", "int64", "int64", "int32", "int32", "int64"];
XXH3_state_s.__fieldNames = ["acc", "customSecret", "buffer", "bufferedSize", "useSeed", "nbStripesSoFar", "totalLen", "nbStripesPerBlock", "secretLimit", "seed", "reserved64", "extSecret"];
XXH3_state_s.__fieldOffsets = [0, 64, 256, 512, 520, 528, 536, 544, 552, 560, 568, 576];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _div_t {
    quot;
    rem;
    constructor() {
        this.quot = 0;
        this.rem = 0;
    }
}
const div_t = _div_t;
_div_t.__fieldTypes = ["int32", "int32"];
_div_t.__fieldNames = ["quot", "rem"];
_div_t.__fieldOffsets = [0, 4];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _ldiv_t {
    quot;
    rem;
    constructor() {
        this.quot = 0;
        this.rem = 0;
    }
}
const ldiv_t = _ldiv_t;
_ldiv_t.__fieldTypes = ["int64", "int64"];
_ldiv_t.__fieldNames = ["quot", "rem"];
_ldiv_t.__fieldOffsets = [0, 8];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LDOUBLE {
    ld = cptr_create(10);
    constructor() {
        this.ld = cptr_create(10);
    }
}
_LDOUBLE.__fieldTypes = ["bytes"];
_LDOUBLE.__fieldNames = ["ld"];
_LDOUBLE.__fieldOffsets = [0];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _CRT_DOUBLE {
    x;
    constructor() {
        this.x = 0.0;
    }
}
_CRT_DOUBLE.__fieldTypes = ["double"];
_CRT_DOUBLE.__fieldNames = ["x"];
_CRT_DOUBLE.__fieldOffsets = [0];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _CRT_FLOAT {
    f;
    constructor() {
        this.f = 0.0;
    }
}
_CRT_FLOAT.__fieldTypes = ["float"];
_CRT_FLOAT.__fieldNames = ["f"];
_CRT_FLOAT.__fieldOffsets = [0];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LONGDOUBLE {
    x;
    constructor() {
        this.x = 0.0;
    }
}
_LONGDOUBLE.__fieldTypes = ["double"];
_LONGDOUBLE.__fieldNames = ["x"];
_LONGDOUBLE.__fieldOffsets = [0];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LDBL12 {
    ld12 = cptr_create(12);
    constructor() {
        this.ld12 = cptr_create(12);
    }
}
_LDBL12.__fieldTypes = ["bytes"];
_LDBL12.__fieldNames = ["ld12"];
_LDBL12.__fieldOffsets = [0];
export function _abs64(x) {
    return __builtin_llabs(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ x);
}
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class lldiv_t {
    quot;
    rem;
    constructor() {
        this.quot = 0;
        this.rem = 0;
    }
}
lldiv_t.__fieldTypes = ["int64", "int64"];
lldiv_t.__fieldNames = ["quot", "rem"];
lldiv_t.__fieldOffsets = [0, 8];
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _heapinfo {
    _pentry;
    _size;
    _useflag;
    constructor() {
        this._pentry = null;
        this._size = 0;
        this._useflag = 0;
    }
}
const _HEAPINFO = _heapinfo;
_heapinfo.__fieldTypes = ["int64", "int64", "int32"];
_heapinfo.__fieldNames = ["_pentry", "_size", "_useflag"];
_heapinfo.__fieldOffsets = [0, 8, 16];
export function _MarkAllocaS(_Ptr, _Marker) {
    if (_Ptr) {
        (() => { const __p = (((_Ptr))); const __v = (((_Marker) >>> 0)); if (__p && __p.__field_ref === true) {
            __p.value = __v;
        }
        else {
            cptr_write_uint32(__p, 0, __v);
        } })();
        _Ptr = cptr_offset((_Ptr), 16);
    }
    return cptr_clone(_Ptr);
}
export function _freea(_Memory) {
    let _Marker = 0;
    if (_Memory) {
        _Memory = cptr_offset((_Memory), -(16));
        _Marker = ((cptr_read_uint32((_Memory))) >>> 0);
        if ((((_Marker) >>> 0) == ((56797) >>> 0) ? 1 : 0)) {
            free(_Memory);
        }
    }
}
function XXH_malloc(s) {
    return cptr_clone(malloc(((s) >>> 0)));
}
function XXH_free(p) {
    free(p);
}
export function strnlen_s(_src, _count) {
    return (_src ? strnlen(cptr_clone(_src), ((_count) >>> 0)) : ((0) >>> 0));
}
export function wcsnlen_s(_src, _count) {
    return (_src ? wcsnlen(_src, ((_count) >>> 0)) : ((0) >>> 0));
}
function XXH_memcpy(dest, src, size) {
    return cptr_clone(memcpy(dest, src, ((size) >>> 0)));
}
function XXH_read32(ptr) {
    return ((cptr_read_uint32(((ptr)))) >>> 0);
}
function XXH_swap32(x) {
    return (((((((((x) >>> 0) << 24) >>> 0) & 4278190080) >>> 0) | ((((((x) >>> 0) << 8) >>> 0) & ((16711680) >>> 0)) >>> 0)) >>> 0 | ((((((x) >>> 0) >>> 8) >>> 0) & ((65280) >>> 0)) >>> 0)) >>> 0 | ((((((x) >>> 0) >>> 24) >>> 0) & ((255) >>> 0)) >>> 0)) >>> 0;
}
export const XXH_aligned = undefined /* UNSUPPORTED: unhandled expression node kind FullComment */;
export const XXH_unaligned = undefined /* UNSUPPORTED: unhandled expression node kind FullComment */;
function XXH_readLE32(ptr) {
    return (1 ? XXH_read32(ptr) : XXH_swap32(XXH_read32(ptr)));
}
function XXH_readBE32(ptr) {
    return (1 ? XXH_swap32(XXH_read32(ptr)) : XXH_read32(ptr));
}
function XXH_readLE32_align(ptr, align) {
    if ((((align) >>> 0) == ((XXH_unaligned) >>> 0) ? 1 : 0)) {
        return XXH_readLE32(ptr);
    }
    else {
        return (1 ? ((cptr_read_uint32((ptr))) >>> 0) : XXH_swap32(((cptr_read_uint32((ptr))) >>> 0)));
    }
}
export function XXH_versionNumber() {
    return (((i32(i32(Math.imul(Math.imul(0, 100), 100) + Math.imul(8, 100)) + 2))) >>> 0);
}
function XXH32_round(acc, input) {
    acc = u32(acc + (Math.imul(((input) >>> 0), 2246822519) >>> 0));
    acc = __builtin_rotateleft32(((acc) >>> 0), ((13) >>> 0));
    acc = (Math.imul(acc, 2654435761) >>> 0);
    return ((acc) >>> 0);
}
function XXH32_avalanche(hash) {
    hash ^= (((hash) >>> 0) >>> 15) >>> 0;
    hash = (Math.imul(hash, 2246822519) >>> 0);
    hash ^= (((hash) >>> 0) >>> 13) >>> 0;
    hash = (Math.imul(hash, 3266489917) >>> 0);
    hash ^= (((hash) >>> 0) >>> 16) >>> 0;
    return ((hash) >>> 0);
}
function XXH32_finalize(hash, ptr, len, align) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    if ((cptr_eq(ptr, (null)) ? 1 : 0)) {
        __builtin_assume(((((len) >>> 0) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
    }
    if ((!0 ? 1 : 0)) {
        len &= ((15) >>> 0);
        while ((((len) >>> 0) >= ((4) >>> 0) ? 1 : 0)) {
            do {
                hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                ptr = cptr_offset(ptr, 4);
                hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
            } while (0);
            len -= ((4) >>> 0);
        }
        while ((((len) >>> 0) > ((0) >>> 0) ? 1 : 0)) {
            do {
                hash = u32(hash + (Math.imul(((((((ptr.buf[ptr.off++]))) & 0xFF)) >>> 0), 374761393) >>> 0));
                hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((11) >>> 0)), 2654435761) >>> 0);
            } while (0);
            (len = u32(len - 1));
        }
        return XXH32_avalanche(((hash) >>> 0));
    }
    else {
        switch (((len) >>> 0) & ((15) >>> 0)) {
            case ((12) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((8) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((4) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
                return XXH32_avalanche(((hash) >>> 0));
            case ((13) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((9) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((5) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
                do {
                    hash = u32(hash + (Math.imul(((((((ptr.buf[ptr.off++]))) & 0xFF)) >>> 0), 374761393) >>> 0));
                    hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((11) >>> 0)), 2654435761) >>> 0);
                } while (0);
                return XXH32_avalanche(((hash) >>> 0));
            case ((14) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((10) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((6) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
                do {
                    hash = u32(hash + (Math.imul(((((((ptr.buf[ptr.off++]))) & 0xFF)) >>> 0), 374761393) >>> 0));
                    hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((11) >>> 0)), 2654435761) >>> 0);
                } while (0);
                do {
                    hash = u32(hash + (Math.imul(((((((ptr.buf[ptr.off++]))) & 0xFF)) >>> 0), 374761393) >>> 0));
                    hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((11) >>> 0)), 2654435761) >>> 0);
                } while (0);
                return XXH32_avalanche(((hash) >>> 0));
            case ((15) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((11) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((7) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(XXH_readLE32_align(ptr, align), 3266489917) >>> 0));
                        ptr = cptr_offset(ptr, 4);
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((17) >>> 0)), 668265263) >>> 0);
                    } while (0);
                }
            case ((3) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(((((((ptr.buf[ptr.off++]))) & 0xFF)) >>> 0), 374761393) >>> 0));
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((11) >>> 0)), 2654435761) >>> 0);
                    } while (0);
                }
            case ((2) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(((((((ptr.buf[ptr.off++]))) & 0xFF)) >>> 0), 374761393) >>> 0));
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((11) >>> 0)), 2654435761) >>> 0);
                    } while (0);
                }
            case ((1) >>> 0):
                {
                    do {
                        hash = u32(hash + (Math.imul(((((((ptr.buf[ptr.off++]))) & 0xFF)) >>> 0), 374761393) >>> 0));
                        hash = (Math.imul(__builtin_rotateleft32(((hash) >>> 0), ((11) >>> 0)), 2654435761) >>> 0);
                    } while (0);
                }
            case ((0) >>> 0):
                {
                    return XXH32_avalanche(((hash) >>> 0));
                }
        }
        __builtin_assume((0 ? 1 : 0));
        return ((hash) >>> 0);
    }
}
function XXH32_endian_align(input, len, seed, align) {
    let h32 = 0;
    if ((cptr_eq(input, (null)) ? 1 : 0)) {
        __builtin_assume(((((len) >>> 0) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
    }
    if ((((len) >>> 0) >= ((16) >>> 0) ? 1 : 0)) {
        let bEnd = cptr_offset(input, ((len) >>> 0)); /* &ref */
        let limit = cptr_offset(bEnd, -(15)); /* &ref */
        let v1 = u32(u32(((seed) >>> 0) + 2654435761) + 2246822519);
        let v2 = u32(((seed) >>> 0) + 2246822519);
        let v3 = u32(((seed) >>> 0) + ((0) >>> 0));
        let v4 = u32(((seed) >>> 0) - 2654435761);
        do {
            v1 = XXH32_round(((v1) >>> 0), XXH_readLE32_align(input, align));
            input = cptr_offset(input, 4);
            v2 = XXH32_round(((v2) >>> 0), XXH_readLE32_align(input, align));
            input = cptr_offset(input, 4);
            v3 = XXH32_round(((v3) >>> 0), XXH_readLE32_align(input, align));
            input = cptr_offset(input, 4);
            v4 = XXH32_round(((v4) >>> 0), XXH_readLE32_align(input, align));
            input = cptr_offset(input, 4);
        } while ((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
            return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb)
            return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(input, limit) ? 1 : 0));
        h32 = u32(u32(u32(__builtin_rotateleft32(((v1) >>> 0), ((1) >>> 0)) + __builtin_rotateleft32(((v2) >>> 0), ((7) >>> 0))) + __builtin_rotateleft32(((v3) >>> 0), ((12) >>> 0))) + __builtin_rotateleft32(((v4) >>> 0), ((18) >>> 0)));
    }
    else {
        h32 = u32(((seed) >>> 0) + 374761393);
    }
    h32 = u32(h32 + Number(BigInt.asIntN(32, __as_bigint(((len) >>> 0)))));
    return XXH32_finalize(((h32) >>> 0), input, ((len) >>> 0) & ((15) >>> 0), align);
}
export function XXH32(input, len, seed) {
    if (0) {
        if ((((((Math.trunc(+(__rt_ptr_to_intptr(input)))) >>> 0)) & ((3) >>> 0)) == ((0) >>> 0) ? 1 : 0)) {
            return XXH32_endian_align((input), ((len) >>> 0), ((seed) >>> 0), XXH_aligned);
        }
    }
    return XXH32_endian_align((input), ((len) >>> 0), ((seed) >>> 0), XXH_unaligned);
}
export function XXH32_createState() {
    return (new XXH32_state_s());
}
export function XXH32_freeState(statePtr) {
    XXH_free(statePtr);
    return XXH_OK;
}
export function XXH32_copyState(dstState, srcState) {
    XXH_memcpy(dstState, srcState, 96);
}
export function XXH32_reset(statePtr, seed) {
    __builtin_assume(((statePtr != (null) ? 1 : 0) ? 1 : 0));
    memset(statePtr, 0, 96);
    (__struct_ptr_at(statePtr, 0)).v[0] = u32(u32(((seed) >>> 0) + 2654435761) + 2246822519);
    (__struct_ptr_at(statePtr, 0)).v[1] = u32(((seed) >>> 0) + 2246822519);
    (__struct_ptr_at(statePtr, 0)).v[2] = u32(((seed) >>> 0) + ((0) >>> 0));
    (__struct_ptr_at(statePtr, 0)).v[3] = u32(((seed) >>> 0) - 2654435761);
    return XXH_OK;
}
export function XXH32_update(state, input, len) {
    if ((cptr_eq(input, (null)) ? 1 : 0)) {
        __builtin_assume(((((len) >>> 0) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
        return XXH_OK;
    }
    {
        let p = cptr_clone(cptr_clone((input))); /* &ref */
        let bEnd = cptr_offset(p, ((len) >>> 0)); /* &ref */
        (__struct_ptr_at(state, 0)).total_len_32 = u32((__struct_ptr_at(state, 0)).total_len_32 + Number(BigInt.asIntN(32, __as_bigint(((len) >>> 0)))));
        (__struct_ptr_at(state, 0)).large_len |= Math.trunc(+((((((len) >>> 0) >= ((16) >>> 0) ? 1 : 0)) | (((((__struct_ptr_at(state, 0)).total_len_32) >>> 0) >= ((16) >>> 0) ? 1 : 0)))));
        if (((((((__struct_ptr_at(state, 0)).memsize) >>> 0)) >>> 0) + ((len) >>> 0) < ((16) >>> 0) ? 1 : 0)) {
            XXH_memcpy(cptr_offset((((__struct_ptr_at(state, 0)).mem32)), (((__struct_ptr_at(state, 0)).memsize) >>> 0)), input, ((len) >>> 0));
            (__struct_ptr_at(state, 0)).memsize = u32((__struct_ptr_at(state, 0)).memsize + Number(BigInt.asIntN(32, __as_bigint(((len) >>> 0)))));
            return XXH_OK;
        }
        if ((((__struct_ptr_at(state, 0)).memsize) >>> 0)) {
            XXH_memcpy(cptr_offset((((__struct_ptr_at(state, 0)).mem32)), (((__struct_ptr_at(state, 0)).memsize) >>> 0)), input, ((u32(((16) >>> 0) - (((__struct_ptr_at(state, 0)).memsize) >>> 0))) >>> 0));
            {
                {
                    let p32 = (__struct_ptr_at(state, 0)).mem32; /* &ref */
                    (__struct_ptr_at(state, 0)).v[0] = XXH32_round((((__struct_ptr_at(state, 0)).v[0]) >>> 0), XXH_readLE32(p32));
                    (() => { const __v = p32; p32 = cptr_offset(p32, 4); return __v; })();
                    (__struct_ptr_at(state, 0)).v[1] = XXH32_round((((__struct_ptr_at(state, 0)).v[1]) >>> 0), XXH_readLE32(p32));
                    (() => { const __v = p32; p32 = cptr_offset(p32, 4); return __v; })();
                    (__struct_ptr_at(state, 0)).v[2] = XXH32_round((((__struct_ptr_at(state, 0)).v[2]) >>> 0), XXH_readLE32(p32));
                    (() => { const __v = p32; p32 = cptr_offset(p32, 4); return __v; })();
                    (__struct_ptr_at(state, 0)).v[3] = XXH32_round((((__struct_ptr_at(state, 0)).v[3]) >>> 0), XXH_readLE32(p32));
                }
            }
            p = cptr_offset(p, u32(((16) >>> 0) - (((__struct_ptr_at(state, 0)).memsize) >>> 0)));
            (__struct_ptr_at(state, 0)).memsize = ((0) >>> 0);
        }
        if ((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
            return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb)
            return (__rt_ptr_to_intptr(__l) <= __rt_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(p, cptr_offset(bEnd, -(16))) ? 1 : 0)) {
            let limit = cptr_offset(bEnd, -(16)); /* &ref */
            do {
                (__struct_ptr_at(state, 0)).v[0] = XXH32_round((((__struct_ptr_at(state, 0)).v[0]) >>> 0), XXH_readLE32(p));
                p = cptr_offset(p, 4);
                (__struct_ptr_at(state, 0)).v[1] = XXH32_round((((__struct_ptr_at(state, 0)).v[1]) >>> 0), XXH_readLE32(p));
                p = cptr_offset(p, 4);
                (__struct_ptr_at(state, 0)).v[2] = XXH32_round((((__struct_ptr_at(state, 0)).v[2]) >>> 0), XXH_readLE32(p));
                p = cptr_offset(p, 4);
                (__struct_ptr_at(state, 0)).v[3] = XXH32_round((((__struct_ptr_at(state, 0)).v[3]) >>> 0), XXH_readLE32(p));
                p = cptr_offset(p, 4);
            } while ((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
                return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb)
                return (__rt_ptr_to_intptr(__l) <= __rt_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(p, limit) ? 1 : 0));
        }
        if ((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
            return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb)
            return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(p, bEnd) ? 1 : 0)) {
            XXH_memcpy((__struct_ptr_at(state, 0)).mem32, p, ((Math.trunc(+((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
                return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(bEnd, p))))) >>> 0));
            (__struct_ptr_at(state, 0)).memsize = ((Math.trunc(+((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
                return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(bEnd, p))))) >>> 0);
        }
    }
    return XXH_OK;
}
export function XXH32_digest(state) {
    let h32 = 0;
    if ((((__struct_ptr_at(state, 0)).large_len) >>> 0)) {
        h32 = u32(u32(u32(__builtin_rotateleft32((((__struct_ptr_at(state, 0)).v[0]) >>> 0), ((1) >>> 0)) + __builtin_rotateleft32((((__struct_ptr_at(state, 0)).v[1]) >>> 0), ((7) >>> 0))) + __builtin_rotateleft32((((__struct_ptr_at(state, 0)).v[2]) >>> 0), ((12) >>> 0))) + __builtin_rotateleft32((((__struct_ptr_at(state, 0)).v[3]) >>> 0), ((18) >>> 0)));
    }
    else {
        h32 = u32((((__struct_ptr_at(state, 0)).v[2]) >>> 0) + 374761393);
    }
    h32 = u32(h32 + (((__struct_ptr_at(state, 0)).total_len_32) >>> 0));
    return XXH32_finalize(((h32) >>> 0), ((__struct_ptr_at(state, 0)).mem32), (((((__struct_ptr_at(state, 0)).memsize) >>> 0)) >>> 0), XXH_aligned);
}
export function XXH32_canonicalFromHash(dst, hash) {
    do {
    } while (0);
    if (1) {
        hash = XXH_swap32(((hash) >>> 0));
    }
    XXH_memcpy(dst, hash, 4);
}
export function XXH32_hashFromCanonical(src) {
    return XXH_readBE32(src);
}
function XXH_read64(ptr) {
    return cptr_read_uint64(((ptr)));
}
function XXH_swap64(x) {
    return __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(x) << __as_bigint(56)))) & __as_bigint(18374686479671623680n)))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(x) << __as_bigint(40)))) & __as_bigint(71776119061217280n)))))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(x) << __as_bigint(24)))) & __as_bigint(280375465082880n)))))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(x) << __as_bigint(8)))) & __as_bigint(1095216660480n)))))) | __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(x)) >> __as_bigint(8)))) & __as_bigint(4278190080n)))))) | __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(x)) >> __as_bigint(24)))) & __as_bigint(16711680n)))))) | __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(x)) >> __as_bigint(40)))) & __as_bigint(65280n)))))) | __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(x)) >> __as_bigint(56)))) & __as_bigint(255n)))));
}
function XXH_readLE64(ptr) {
    return (1 ? XXH_read64(ptr) : XXH_swap64(XXH_read64(ptr)));
}
function XXH_readBE64(ptr) {
    return (1 ? XXH_swap64(XXH_read64(ptr)) : XXH_read64(ptr));
}
function XXH_readLE64_align(ptr, align) {
    if ((((align) >>> 0) == ((XXH_unaligned) >>> 0) ? 1 : 0)) {
        return XXH_readLE64(ptr);
    }
    else {
        return (1 ? cptr_read_uint64((ptr)) : XXH_swap64(cptr_read_uint64((ptr))));
    }
}
function XXH64_round(acc, input) {
    acc = __u64(__as_bigint(acc) + __as_bigint(__u64(__as_bigint(input) * __as_bigint(14029467366897019727n))));
    acc = __builtin_rotateleft64(acc, new std_bitset(8, 31));
    acc = __u64(__as_bigint(acc) * __as_bigint(11400714785074694791n));
    return acc;
}
function XXH64_mergeRound(acc, val) {
    val = XXH64_round(0, val);
    acc = __u64(__as_bigint(acc) ^ __as_bigint(val));
    acc = __u64(__as_bigint(__u64(__as_bigint(acc) * __as_bigint(11400714785074694791n))) + __as_bigint(9650029242287828579n));
    return acc;
}
function XXH64_avalanche(hash) {
    hash = __u64(__as_bigint(hash) ^ __as_bigint(__u64(__u64(__as_bigint(hash)) >> __as_bigint(33))));
    hash = __u64(__as_bigint(hash) * __as_bigint(14029467366897019727n));
    hash = __u64(__as_bigint(hash) ^ __as_bigint(__u64(__u64(__as_bigint(hash)) >> __as_bigint(29))));
    hash = __u64(__as_bigint(hash) * __as_bigint(1609587929392839161n));
    hash = __u64(__as_bigint(hash) ^ __as_bigint(__u64(__u64(__as_bigint(hash)) >> __as_bigint(32))));
    return hash;
}
function XXH64_finalize(hash, ptr, len, align) {
    if (typeof ptr === 'string')
        ptr = cptr_from_string(ptr);
    if ((cptr_eq(ptr, (null)) ? 1 : 0)) {
        __builtin_assume(((((len) >>> 0) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
    }
    len &= ((31) >>> 0);
    while ((((len) >>> 0) >= ((8) >>> 0) ? 1 : 0)) {
        let k1 = XXH64_round(0, XXH_readLE64_align(ptr, align));
        ptr = cptr_offset(ptr, 8);
        hash = __u64(__as_bigint(hash) ^ __as_bigint(k1));
        hash = __u64(__as_bigint(__u64(__as_bigint(__builtin_rotateleft64(hash, new std_bitset(8, 27))) * __as_bigint(11400714785074694791n))) + __as_bigint(9650029242287828579n));
        len -= ((8) >>> 0);
    }
    if ((((len) >>> 0) >= ((4) >>> 0) ? 1 : 0)) {
        hash = __u64(__as_bigint(hash) ^ __as_bigint(__u64(__as_bigint(__u64(__as_bigint((XXH_readLE32_align(ptr, align))))) * __as_bigint(11400714785074694791n))));
        ptr = cptr_offset(ptr, 4);
        hash = __u64(__as_bigint(__u64(__as_bigint(__builtin_rotateleft64(hash, new std_bitset(8, 23))) * __as_bigint(14029467366897019727n))) + __as_bigint(1609587929392839161n));
        len -= ((4) >>> 0);
    }
    while ((((len) >>> 0) > ((0) >>> 0) ? 1 : 0)) {
        hash = __u64(__as_bigint(hash) ^ __as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((((ptr.buf[ptr.off++]))) & 0xFF)) * __as_bigint(2870177450012600261n))));
        hash = __u64(__as_bigint(__builtin_rotateleft64(hash, new std_bitset(8, 11))) * __as_bigint(11400714785074694791n));
        (len = u32(len - 1));
    }
    return XXH64_avalanche(hash);
}
function XXH64_endian_align(input, len, seed, align) {
    let h64 = 0;
    if ((cptr_eq(input, (null)) ? 1 : 0)) {
        __builtin_assume(((((len) >>> 0) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
    }
    if ((((len) >>> 0) >= ((32) >>> 0) ? 1 : 0)) {
        let bEnd = cptr_offset(input, ((len) >>> 0)); /* &ref */
        let limit = cptr_offset(bEnd, -(31)); /* &ref */
        let v1 = __u64(__as_bigint(__u64(__as_bigint(seed) + __as_bigint(11400714785074694791n))) + __as_bigint(14029467366897019727n));
        let v2 = __u64(__as_bigint(seed) + __as_bigint(14029467366897019727n));
        let v3 = __u64(__as_bigint(seed) + __as_bigint(0));
        let v4 = __u64(__as_bigint(seed) - __as_bigint(11400714785074694791n));
        do {
            v1 = XXH64_round(v1, XXH_readLE64_align(input, align));
            input = cptr_offset(input, 8);
            v2 = XXH64_round(v2, XXH_readLE64_align(input, align));
            input = cptr_offset(input, 8);
            v3 = XXH64_round(v3, XXH_readLE64_align(input, align));
            input = cptr_offset(input, 8);
            v4 = XXH64_round(v4, XXH_readLE64_align(input, align));
            input = cptr_offset(input, 8);
        } while ((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
            return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb)
            return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(input, limit) ? 1 : 0));
        h64 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__builtin_rotateleft64(v1, new std_bitset(8, 1))) + __as_bigint(__builtin_rotateleft64(v2, new std_bitset(8, 7))))) + __as_bigint(__builtin_rotateleft64(v3, new std_bitset(8, 12))))) + __as_bigint(__builtin_rotateleft64(v4, new std_bitset(8, 18))));
        h64 = XXH64_mergeRound(h64, v1);
        h64 = XXH64_mergeRound(h64, v2);
        h64 = XXH64_mergeRound(h64, v3);
        h64 = XXH64_mergeRound(h64, v4);
    }
    else {
        h64 = __u64(__as_bigint(seed) + __as_bigint(2870177450012600261n));
    }
    h64 = __u64(__as_bigint(h64) + __as_bigint(__u64(__as_bigint(((len) >>> 0)))));
    return XXH64_finalize(h64, input, ((len) >>> 0), align);
}
export function XXH64(input, len, seed) {
    if (0) {
        if ((((((Math.trunc(+(__rt_ptr_to_intptr(input)))) >>> 0)) & ((7) >>> 0)) == ((0) >>> 0) ? 1 : 0)) {
            return XXH64_endian_align((input), ((len) >>> 0), seed, XXH_aligned);
        }
    }
    return XXH64_endian_align((input), ((len) >>> 0), seed, XXH_unaligned);
}
export function XXH64_createState() {
    return (new XXH64_state_s());
}
export function XXH64_freeState(statePtr) {
    XXH_free(statePtr);
    return XXH_OK;
}
export function XXH64_copyState(dstState, srcState) {
    XXH_memcpy(dstState, srcState, 96);
}
export function XXH64_reset(statePtr, seed) {
    __builtin_assume(((statePtr != (null) ? 1 : 0) ? 1 : 0));
    memset(statePtr, 0, 96);
    (__struct_ptr_at(statePtr, 0)).v[0] = __u64(__as_bigint(__u64(__as_bigint(seed) + __as_bigint(11400714785074694791n))) + __as_bigint(14029467366897019727n));
    (__struct_ptr_at(statePtr, 0)).v[1] = __u64(__as_bigint(seed) + __as_bigint(14029467366897019727n));
    (__struct_ptr_at(statePtr, 0)).v[2] = __u64(__as_bigint(seed) + __as_bigint(0));
    (__struct_ptr_at(statePtr, 0)).v[3] = __u64(__as_bigint(seed) - __as_bigint(11400714785074694791n));
    return XXH_OK;
}
export function XXH64_update(state, input, len) {
    if ((cptr_eq(input, (null)) ? 1 : 0)) {
        __builtin_assume(((((len) >>> 0) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
        return XXH_OK;
    }
    {
        let p = cptr_clone(cptr_clone((input))); /* &ref */
        let bEnd = cptr_offset(p, ((len) >>> 0)); /* &ref */
        (__struct_ptr_at(state, 0)).total_len = __u64(__as_bigint((__struct_ptr_at(state, 0)).total_len) + __as_bigint(((len) >>> 0)));
        if (((((((__struct_ptr_at(state, 0)).memsize) >>> 0)) >>> 0) + ((len) >>> 0) < ((32) >>> 0) ? 1 : 0)) {
            XXH_memcpy(cptr_offset((((__struct_ptr_at(state, 0)).mem64)), (((__struct_ptr_at(state, 0)).memsize) >>> 0)), input, ((len) >>> 0));
            (__struct_ptr_at(state, 0)).memsize = u32((__struct_ptr_at(state, 0)).memsize + Number(BigInt.asIntN(32, __as_bigint(((len) >>> 0)))));
            return XXH_OK;
        }
        if ((((__struct_ptr_at(state, 0)).memsize) >>> 0)) {
            XXH_memcpy(cptr_offset((((__struct_ptr_at(state, 0)).mem64)), (((__struct_ptr_at(state, 0)).memsize) >>> 0)), input, ((u32(((32) >>> 0) - (((__struct_ptr_at(state, 0)).memsize) >>> 0))) >>> 0));
            (__struct_ptr_at(state, 0)).v[0] = XXH64_round((__struct_ptr_at(state, 0)).v[0], XXH_readLE64(cptr_offset((__struct_ptr_at(state, 0)).mem64, (0) * 8)));
            (__struct_ptr_at(state, 0)).v[1] = XXH64_round((__struct_ptr_at(state, 0)).v[1], XXH_readLE64(cptr_offset((__struct_ptr_at(state, 0)).mem64, (1) * 8)));
            (__struct_ptr_at(state, 0)).v[2] = XXH64_round((__struct_ptr_at(state, 0)).v[2], XXH_readLE64(cptr_offset((__struct_ptr_at(state, 0)).mem64, (2) * 8)));
            (__struct_ptr_at(state, 0)).v[3] = XXH64_round((__struct_ptr_at(state, 0)).v[3], XXH_readLE64(cptr_offset((__struct_ptr_at(state, 0)).mem64, (3) * 8)));
            p = cptr_offset(p, u32(((32) >>> 0) - (((__struct_ptr_at(state, 0)).memsize) >>> 0)));
            (__struct_ptr_at(state, 0)).memsize = ((0) >>> 0);
        }
        if ((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
            return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb)
            return (__rt_ptr_to_intptr(__l) <= __rt_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(cptr_offset(p, 32), bEnd) ? 1 : 0)) {
            let limit = cptr_offset(bEnd, -(32)); /* &ref */
            do {
                (__struct_ptr_at(state, 0)).v[0] = XXH64_round((__struct_ptr_at(state, 0)).v[0], XXH_readLE64(p));
                p = cptr_offset(p, 8);
                (__struct_ptr_at(state, 0)).v[1] = XXH64_round((__struct_ptr_at(state, 0)).v[1], XXH_readLE64(p));
                p = cptr_offset(p, 8);
                (__struct_ptr_at(state, 0)).v[2] = XXH64_round((__struct_ptr_at(state, 0)).v[2], XXH_readLE64(p));
                p = cptr_offset(p, 8);
                (__struct_ptr_at(state, 0)).v[3] = XXH64_round((__struct_ptr_at(state, 0)).v[3], XXH_readLE64(p));
                p = cptr_offset(p, 8);
            } while ((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
                return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb)
                return (__rt_ptr_to_intptr(__l) <= __rt_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(p, limit) ? 1 : 0));
        }
        if ((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
            return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb)
            return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(p, bEnd) ? 1 : 0)) {
            XXH_memcpy((__struct_ptr_at(state, 0)).mem64, p, ((Math.trunc(+((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
                return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(bEnd, p))))) >>> 0));
            (__struct_ptr_at(state, 0)).memsize = ((Math.trunc(+((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
                return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(bEnd, p))))) >>> 0);
        }
    }
    return XXH_OK;
}
export function XXH64_digest(state) {
    let h64 = 0;
    if (((__as_bigint((__struct_ptr_at(state, 0)).total_len) >= __as_bigint(32)) ? 1 : 0)) {
        h64 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__builtin_rotateleft64((__struct_ptr_at(state, 0)).v[0], new std_bitset(8, 1))) + __as_bigint(__builtin_rotateleft64((__struct_ptr_at(state, 0)).v[1], new std_bitset(8, 7))))) + __as_bigint(__builtin_rotateleft64((__struct_ptr_at(state, 0)).v[2], new std_bitset(8, 12))))) + __as_bigint(__builtin_rotateleft64((__struct_ptr_at(state, 0)).v[3], new std_bitset(8, 18))));
        h64 = XXH64_mergeRound(h64, (__struct_ptr_at(state, 0)).v[0]);
        h64 = XXH64_mergeRound(h64, (__struct_ptr_at(state, 0)).v[1]);
        h64 = XXH64_mergeRound(h64, (__struct_ptr_at(state, 0)).v[2]);
        h64 = XXH64_mergeRound(h64, (__struct_ptr_at(state, 0)).v[3]);
    }
    else {
        h64 = __u64(__as_bigint((__struct_ptr_at(state, 0)).v[2]) + __as_bigint(2870177450012600261n));
    }
    h64 = __u64(__as_bigint(h64) + __as_bigint(__u64(__as_bigint((__struct_ptr_at(state, 0)).total_len))));
    return XXH64_finalize(h64, ((__struct_ptr_at(state, 0)).mem64), ((Number(BigInt.asIntN(32, __as_bigint((__struct_ptr_at(state, 0)).total_len)))) >>> 0), XXH_aligned);
}
export function XXH64_canonicalFromHash(dst, hash) {
    do {
    } while (0);
    if (1) {
        hash = XXH_swap64(hash);
    }
    XXH_memcpy(dst, hash, 8);
}
export function XXH64_hashFromCanonical(src) {
    return XXH_readBE64(src);
}
/* BRIDGE: _Alignas(64) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
const XXH3_kSecret = (() => { const __b = cptr_create(192); __b.buf[0] = (((184) & 0xFF)) & 0xFF; __b.buf[1] = (((254) & 0xFF)) & 0xFF; __b.buf[2] = (((108) & 0xFF)) & 0xFF; __b.buf[3] = (((57) & 0xFF)) & 0xFF; __b.buf[4] = (((35) & 0xFF)) & 0xFF; __b.buf[5] = (((164) & 0xFF)) & 0xFF; __b.buf[6] = (((75) & 0xFF)) & 0xFF; __b.buf[7] = (((190) & 0xFF)) & 0xFF; __b.buf[8] = (((124) & 0xFF)) & 0xFF; __b.buf[9] = (((1) & 0xFF)) & 0xFF; __b.buf[10] = (((129) & 0xFF)) & 0xFF; __b.buf[11] = (((44) & 0xFF)) & 0xFF; __b.buf[12] = (((247) & 0xFF)) & 0xFF; __b.buf[13] = (((33) & 0xFF)) & 0xFF; __b.buf[14] = (((173) & 0xFF)) & 0xFF; __b.buf[15] = (((28) & 0xFF)) & 0xFF; __b.buf[16] = (((222) & 0xFF)) & 0xFF; __b.buf[17] = (((212) & 0xFF)) & 0xFF; __b.buf[18] = (((109) & 0xFF)) & 0xFF; __b.buf[19] = (((233) & 0xFF)) & 0xFF; __b.buf[20] = (((131) & 0xFF)) & 0xFF; __b.buf[21] = (((144) & 0xFF)) & 0xFF; __b.buf[22] = (((151) & 0xFF)) & 0xFF; __b.buf[23] = (((219) & 0xFF)) & 0xFF; __b.buf[24] = (((114) & 0xFF)) & 0xFF; __b.buf[25] = (((64) & 0xFF)) & 0xFF; __b.buf[26] = (((164) & 0xFF)) & 0xFF; __b.buf[27] = (((164) & 0xFF)) & 0xFF; __b.buf[28] = (((183) & 0xFF)) & 0xFF; __b.buf[29] = (((179) & 0xFF)) & 0xFF; __b.buf[30] = (((103) & 0xFF)) & 0xFF; __b.buf[31] = (((31) & 0xFF)) & 0xFF; __b.buf[32] = (((203) & 0xFF)) & 0xFF; __b.buf[33] = (((121) & 0xFF)) & 0xFF; __b.buf[34] = (((230) & 0xFF)) & 0xFF; __b.buf[35] = (((78) & 0xFF)) & 0xFF; __b.buf[36] = (((204) & 0xFF)) & 0xFF; __b.buf[37] = (((192) & 0xFF)) & 0xFF; __b.buf[38] = (((229) & 0xFF)) & 0xFF; __b.buf[39] = (((120) & 0xFF)) & 0xFF; __b.buf[40] = (((130) & 0xFF)) & 0xFF; __b.buf[41] = (((90) & 0xFF)) & 0xFF; __b.buf[42] = (((208) & 0xFF)) & 0xFF; __b.buf[43] = (((125) & 0xFF)) & 0xFF; __b.buf[44] = (((204) & 0xFF)) & 0xFF; __b.buf[45] = (((255) & 0xFF)) & 0xFF; __b.buf[46] = (((114) & 0xFF)) & 0xFF; __b.buf[47] = (((33) & 0xFF)) & 0xFF; __b.buf[48] = (((184) & 0xFF)) & 0xFF; __b.buf[49] = (((8) & 0xFF)) & 0xFF; __b.buf[50] = (((70) & 0xFF)) & 0xFF; __b.buf[51] = (((116) & 0xFF)) & 0xFF; __b.buf[52] = (((247) & 0xFF)) & 0xFF; __b.buf[53] = (((67) & 0xFF)) & 0xFF; __b.buf[54] = (((36) & 0xFF)) & 0xFF; __b.buf[55] = (((142) & 0xFF)) & 0xFF; __b.buf[56] = (((224) & 0xFF)) & 0xFF; __b.buf[57] = (((53) & 0xFF)) & 0xFF; __b.buf[58] = (((144) & 0xFF)) & 0xFF; __b.buf[59] = (((230) & 0xFF)) & 0xFF; __b.buf[60] = (((129) & 0xFF)) & 0xFF; __b.buf[61] = (((58) & 0xFF)) & 0xFF; __b.buf[62] = (((38) & 0xFF)) & 0xFF; __b.buf[63] = (((76) & 0xFF)) & 0xFF; __b.buf[64] = (((60) & 0xFF)) & 0xFF; __b.buf[65] = (((40) & 0xFF)) & 0xFF; __b.buf[66] = (((82) & 0xFF)) & 0xFF; __b.buf[67] = (((187) & 0xFF)) & 0xFF; __b.buf[68] = (((145) & 0xFF)) & 0xFF; __b.buf[69] = (((195) & 0xFF)) & 0xFF; __b.buf[70] = (((0) & 0xFF)) & 0xFF; __b.buf[71] = (((203) & 0xFF)) & 0xFF; __b.buf[72] = (((136) & 0xFF)) & 0xFF; __b.buf[73] = (((208) & 0xFF)) & 0xFF; __b.buf[74] = (((101) & 0xFF)) & 0xFF; __b.buf[75] = (((139) & 0xFF)) & 0xFF; __b.buf[76] = (((27) & 0xFF)) & 0xFF; __b.buf[77] = (((83) & 0xFF)) & 0xFF; __b.buf[78] = (((46) & 0xFF)) & 0xFF; __b.buf[79] = (((163) & 0xFF)) & 0xFF; __b.buf[80] = (((113) & 0xFF)) & 0xFF; __b.buf[81] = (((100) & 0xFF)) & 0xFF; __b.buf[82] = (((72) & 0xFF)) & 0xFF; __b.buf[83] = (((151) & 0xFF)) & 0xFF; __b.buf[84] = (((162) & 0xFF)) & 0xFF; __b.buf[85] = (((13) & 0xFF)) & 0xFF; __b.buf[86] = (((249) & 0xFF)) & 0xFF; __b.buf[87] = (((78) & 0xFF)) & 0xFF; __b.buf[88] = (((56) & 0xFF)) & 0xFF; __b.buf[89] = (((25) & 0xFF)) & 0xFF; __b.buf[90] = (((239) & 0xFF)) & 0xFF; __b.buf[91] = (((70) & 0xFF)) & 0xFF; __b.buf[92] = (((169) & 0xFF)) & 0xFF; __b.buf[93] = (((222) & 0xFF)) & 0xFF; __b.buf[94] = (((172) & 0xFF)) & 0xFF; __b.buf[95] = (((216) & 0xFF)) & 0xFF; __b.buf[96] = (((168) & 0xFF)) & 0xFF; __b.buf[97] = (((250) & 0xFF)) & 0xFF; __b.buf[98] = (((118) & 0xFF)) & 0xFF; __b.buf[99] = (((63) & 0xFF)) & 0xFF; __b.buf[100] = (((227) & 0xFF)) & 0xFF; __b.buf[101] = (((156) & 0xFF)) & 0xFF; __b.buf[102] = (((52) & 0xFF)) & 0xFF; __b.buf[103] = (((63) & 0xFF)) & 0xFF; __b.buf[104] = (((249) & 0xFF)) & 0xFF; __b.buf[105] = (((220) & 0xFF)) & 0xFF; __b.buf[106] = (((187) & 0xFF)) & 0xFF; __b.buf[107] = (((199) & 0xFF)) & 0xFF; __b.buf[108] = (((199) & 0xFF)) & 0xFF; __b.buf[109] = (((11) & 0xFF)) & 0xFF; __b.buf[110] = (((79) & 0xFF)) & 0xFF; __b.buf[111] = (((29) & 0xFF)) & 0xFF; __b.buf[112] = (((138) & 0xFF)) & 0xFF; __b.buf[113] = (((81) & 0xFF)) & 0xFF; __b.buf[114] = (((224) & 0xFF)) & 0xFF; __b.buf[115] = (((75) & 0xFF)) & 0xFF; __b.buf[116] = (((205) & 0xFF)) & 0xFF; __b.buf[117] = (((180) & 0xFF)) & 0xFF; __b.buf[118] = (((89) & 0xFF)) & 0xFF; __b.buf[119] = (((49) & 0xFF)) & 0xFF; __b.buf[120] = (((200) & 0xFF)) & 0xFF; __b.buf[121] = (((159) & 0xFF)) & 0xFF; __b.buf[122] = (((126) & 0xFF)) & 0xFF; __b.buf[123] = (((201) & 0xFF)) & 0xFF; __b.buf[124] = (((217) & 0xFF)) & 0xFF; __b.buf[125] = (((120) & 0xFF)) & 0xFF; __b.buf[126] = (((115) & 0xFF)) & 0xFF; __b.buf[127] = (((100) & 0xFF)) & 0xFF; __b.buf[128] = (((234) & 0xFF)) & 0xFF; __b.buf[129] = (((197) & 0xFF)) & 0xFF; __b.buf[130] = (((172) & 0xFF)) & 0xFF; __b.buf[131] = (((131) & 0xFF)) & 0xFF; __b.buf[132] = (((52) & 0xFF)) & 0xFF; __b.buf[133] = (((211) & 0xFF)) & 0xFF; __b.buf[134] = (((235) & 0xFF)) & 0xFF; __b.buf[135] = (((195) & 0xFF)) & 0xFF; __b.buf[136] = (((197) & 0xFF)) & 0xFF; __b.buf[137] = (((129) & 0xFF)) & 0xFF; __b.buf[138] = (((160) & 0xFF)) & 0xFF; __b.buf[139] = (((255) & 0xFF)) & 0xFF; __b.buf[140] = (((250) & 0xFF)) & 0xFF; __b.buf[141] = (((19) & 0xFF)) & 0xFF; __b.buf[142] = (((99) & 0xFF)) & 0xFF; __b.buf[143] = (((235) & 0xFF)) & 0xFF; __b.buf[144] = (((23) & 0xFF)) & 0xFF; __b.buf[145] = (((13) & 0xFF)) & 0xFF; __b.buf[146] = (((221) & 0xFF)) & 0xFF; __b.buf[147] = (((81) & 0xFF)) & 0xFF; __b.buf[148] = (((183) & 0xFF)) & 0xFF; __b.buf[149] = (((240) & 0xFF)) & 0xFF; __b.buf[150] = (((218) & 0xFF)) & 0xFF; __b.buf[151] = (((73) & 0xFF)) & 0xFF; __b.buf[152] = (((211) & 0xFF)) & 0xFF; __b.buf[153] = (((22) & 0xFF)) & 0xFF; __b.buf[154] = (((85) & 0xFF)) & 0xFF; __b.buf[155] = (((38) & 0xFF)) & 0xFF; __b.buf[156] = (((41) & 0xFF)) & 0xFF; __b.buf[157] = (((212) & 0xFF)) & 0xFF; __b.buf[158] = (((104) & 0xFF)) & 0xFF; __b.buf[159] = (((158) & 0xFF)) & 0xFF; __b.buf[160] = (((43) & 0xFF)) & 0xFF; __b.buf[161] = (((22) & 0xFF)) & 0xFF; __b.buf[162] = (((190) & 0xFF)) & 0xFF; __b.buf[163] = (((88) & 0xFF)) & 0xFF; __b.buf[164] = (((125) & 0xFF)) & 0xFF; __b.buf[165] = (((71) & 0xFF)) & 0xFF; __b.buf[166] = (((161) & 0xFF)) & 0xFF; __b.buf[167] = (((252) & 0xFF)) & 0xFF; __b.buf[168] = (((143) & 0xFF)) & 0xFF; __b.buf[169] = (((248) & 0xFF)) & 0xFF; __b.buf[170] = (((184) & 0xFF)) & 0xFF; __b.buf[171] = (((209) & 0xFF)) & 0xFF; __b.buf[172] = (((122) & 0xFF)) & 0xFF; __b.buf[173] = (((208) & 0xFF)) & 0xFF; __b.buf[174] = (((49) & 0xFF)) & 0xFF; __b.buf[175] = (((206) & 0xFF)) & 0xFF; __b.buf[176] = (((69) & 0xFF)) & 0xFF; __b.buf[177] = (((203) & 0xFF)) & 0xFF; __b.buf[178] = (((58) & 0xFF)) & 0xFF; __b.buf[179] = (((143) & 0xFF)) & 0xFF; __b.buf[180] = (((149) & 0xFF)) & 0xFF; __b.buf[181] = (((22) & 0xFF)) & 0xFF; __b.buf[182] = (((4) & 0xFF)) & 0xFF; __b.buf[183] = (((40) & 0xFF)) & 0xFF; __b.buf[184] = (((175) & 0xFF)) & 0xFF; __b.buf[185] = (((215) & 0xFF)) & 0xFF; __b.buf[186] = (((251) & 0xFF)) & 0xFF; __b.buf[187] = (((202) & 0xFF)) & 0xFF; __b.buf[188] = (((187) & 0xFF)) & 0xFF; __b.buf[189] = (((75) & 0xFF)) & 0xFF; __b.buf[190] = (((64) & 0xFF)) & 0xFF; __b.buf[191] = (((126) & 0xFF)) & 0xFF; return __b; })();
const PRIME_MX1 = 1609587791953885689n;
const PRIME_MX2 = 11507291218515648293n;
function XXH_mult64to128(lhs, rhs) {
    let product = (__as_bigint((lhs)) * __as_bigint((rhs)));
    let r128 = new XXH128_hash_t();
    r128.low64 = __u64(__as_bigint((product)));
    r128.high64 = __u64(__as_bigint(((__as_bigint(product) >> __as_bigint(64)))));
    return r128;
}
function XXH3_mul128_fold64(lhs, rhs) {
    let product = XXH_mult64to128(lhs, rhs);
    return __u64(__as_bigint(product.low64) ^ __as_bigint(product.high64));
}
function XXH_xorshift64(v64, shift) {
    __builtin_assume(((((0 <= shift ? 1 : 0) && (shift < 64 ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    return __u64(__as_bigint(v64) ^ __as_bigint((__u64(__u64(__as_bigint(v64)) >> __as_bigint(shift)))));
}
function XXH3_avalanche(h64) {
    h64 = XXH_xorshift64(h64, 37);
    h64 = __u64(__as_bigint(h64) * __as_bigint(PRIME_MX1));
    h64 = XXH_xorshift64(h64, 32);
    return h64;
}
function XXH3_rrmxmx(h64, len) {
    h64 = __u64(__as_bigint(h64) ^ __as_bigint(__u64(__as_bigint(__builtin_rotateleft64(h64, new std_bitset(8, 49))) ^ __as_bigint(__builtin_rotateleft64(h64, new std_bitset(8, 24))))));
    h64 = __u64(__as_bigint(h64) * __as_bigint(PRIME_MX2));
    h64 = __u64(__as_bigint(h64) ^ __as_bigint(__u64(__as_bigint((__u64(__u64(__as_bigint(h64)) >> __as_bigint(35)))) + __as_bigint(len))));
    h64 = __u64(__as_bigint(h64) * __as_bigint(PRIME_MX2));
    return XXH_xorshift64(h64, 28);
}
function XXH3_len_1to3_64b(input, len, secret, seed) {
    if (typeof input === 'string')
        input = cptr_from_string(input);
    __builtin_assume(((!cptr_eq(input, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((((((1) >>> 0) <= ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((3) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((!cptr_eq(secret, (null)) ? 1 : 0) ? 1 : 0));
    {
        let c1 = ((input.buf[(input.off ?? 0) + 0]) & 0xFF);
        let c2 = ((input.buf[(input.off ?? 0) + Math.trunc(((len) >>> 0) / Math.pow(2, 1))]) & 0xFF);
        let c3 = ((input.buf[(input.off ?? 0) + ((len) >>> 0) - ((1) >>> 0)]) & 0xFF);
        let combined = (((((Math.trunc(+(((c1) & 0xFF))) << 16) >>> 0) | ((Math.trunc(+(((c2) & 0xFF))) << 24) >>> 0)) >>> 0 | ((Math.trunc(+(((c3) & 0xFF))) << 0) >>> 0)) >>> 0 | ((Number(BigInt.asIntN(32, __as_bigint(((len) >>> 0)))) << 8) >>> 0)) >>> 0;
        let bitflip = __u64(__as_bigint(((XXH_readLE32(secret) ^ XXH_readLE32(cptr_offset(secret, 4))) >>> 0)) + __as_bigint(seed));
        let keyed = __u64(__as_bigint(__u64(__as_bigint(((combined) >>> 0)))) ^ __as_bigint(bitflip));
        return XXH64_avalanche(keyed);
    }
}
function XXH3_len_4to8_64b(input, len, secret, seed) {
    __builtin_assume(((!cptr_eq(input, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((!cptr_eq(secret, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((((((4) >>> 0) <= ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((8) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    seed = __u64(__as_bigint(seed) ^ __as_bigint(__u64(__as_bigint(__u64(__as_bigint(XXH_swap32(Number(BigInt.asIntN(32, __as_bigint(seed))))))) << __as_bigint(32))));
    {
        let input1 = XXH_readLE32(input);
        let input2 = XXH_readLE32(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(4)));
        let bitflip = __u64(__as_bigint((__u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 8))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 16)))))) - __as_bigint(seed));
        let input64 = __u64(__as_bigint(((input2) >>> 0)) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((input1) >>> 0))))) << __as_bigint(32)))));
        let keyed = __u64(__as_bigint(input64) ^ __as_bigint(bitflip));
        return XXH3_rrmxmx(keyed, __as_bigint(((len) >>> 0)));
    }
}
function XXH3_len_9to16_64b(input, len, secret, seed) {
    __builtin_assume(((!cptr_eq(input, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((!cptr_eq(secret, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((((((9) >>> 0) <= ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((16) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    {
        let bitflip1 = __u64(__as_bigint((__u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 24))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 32)))))) + __as_bigint(seed));
        let bitflip2 = __u64(__as_bigint((__u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 40))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 48)))))) - __as_bigint(seed));
        let input_lo = __u64(__as_bigint(XXH_readLE64(input)) ^ __as_bigint(bitflip1));
        let input_hi = __u64(__as_bigint(XXH_readLE64(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(8)))) ^ __as_bigint(bitflip2));
        let acc = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(((len) >>> 0)) + __as_bigint(XXH_swap64(input_lo)))) + __as_bigint(input_hi))) + __as_bigint(XXH3_mul128_fold64(input_lo, input_hi)));
        return XXH3_avalanche(acc);
    }
}
function XXH3_len_0to16_64b(input, len, secret, seed) {
    __builtin_assume(((((len) >>> 0) <= ((16) >>> 0) ? 1 : 0) ? 1 : 0));
    {
        if (__builtin_expect((((len) >>> 0) > ((8) >>> 0) ? 1 : 0), 1)) {
            return XXH3_len_9to16_64b(input, ((len) >>> 0), secret, seed);
        }
        if (__builtin_expect((((len) >>> 0) >= ((4) >>> 0) ? 1 : 0), 1)) {
            return XXH3_len_4to8_64b(input, ((len) >>> 0), secret, seed);
        }
        if (((len) >>> 0)) {
            return XXH3_len_1to3_64b(input, ((len) >>> 0), secret, seed);
        }
        return XXH64_avalanche(__u64(__as_bigint(seed) ^ __as_bigint((__u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 56))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 64))))))));
    }
}
function XXH3_mix16B(input, secret, seed64) {
    {
        let input_lo = XXH_readLE64(input);
        let input_hi = XXH_readLE64(cptr_offset(input, 8));
        return (() => { const __rtl_0_1 = __u64(__as_bigint(input_hi) ^ __as_bigint((__u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 8))) - __as_bigint(seed64))))); const __rtl_0_0 = __u64(__as_bigint(input_lo) ^ __as_bigint((__u64(__as_bigint(XXH_readLE64(secret)) + __as_bigint(seed64))))); return XXH3_mul128_fold64(__rtl_0_0, __rtl_0_1); })();
    }
}
function XXH3_len_17to128_64b(input, len, secret, secretSize, seed) {
    __builtin_assume(((((secretSize) >>> 0) >= ((136) >>> 0) ? 1 : 0) ? 1 : 0));
    (((secretSize) >>> 0));
    __builtin_assume(((((((16) >>> 0) < ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((128) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    {
        let acc = __u64(__as_bigint(((len) >>> 0)) * __as_bigint(11400714785074694791n));
        if ((((len) >>> 0) > ((32) >>> 0) ? 1 : 0)) {
            if ((((len) >>> 0) > ((64) >>> 0) ? 1 : 0)) {
                if ((((len) >>> 0) > ((96) >>> 0) ? 1 : 0)) {
                    acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(input, 48), cptr_offset(secret, 96), seed)));
                    acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(64)), cptr_offset(secret, 112), seed)));
                }
                acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(input, 32), cptr_offset(secret, 64), seed)));
                acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(48)), cptr_offset(secret, 80), seed)));
            }
            acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(input, 16), cptr_offset(secret, 32), seed)));
            acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(32)), cptr_offset(secret, 48), seed)));
        }
        acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(input, 0), cptr_offset(secret, 0), seed)));
        acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(16)), cptr_offset(secret, 16), seed)));
        return XXH3_avalanche(acc);
    }
}
function XXH3_len_129to240_64b(input, len, secret, secretSize, seed) {
    __builtin_assume(((((secretSize) >>> 0) >= ((136) >>> 0) ? 1 : 0) ? 1 : 0));
    (((secretSize) >>> 0));
    __builtin_assume(((((((128) >>> 0) < ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((240) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    {
        let acc = __u64(__as_bigint(((len) >>> 0)) * __as_bigint(11400714785074694791n));
        let acc_end = 0;
        let nbRounds = __safe_div(((Number(BigInt.asUintN(32, __as_bigint(((len) >>> 0))))) >>> 0), ((16) >>> 0));
        let i = 0;
        __builtin_assume(((((((128) >>> 0) < ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((240) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
        for (i = ((0) >>> 0); (((i) >>> 0) < ((8) >>> 0) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
            acc = __u64(__as_bigint(acc) + __as_bigint(XXH3_mix16B(cptr_offset(input, ((Math.imul(((16) >>> 0), ((i) >>> 0)) >>> 0))), cptr_offset(secret, ((Math.imul(((16) >>> 0), ((i) >>> 0)) >>> 0))), seed)));
        }
        acc_end = XXH3_mix16B(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(16)), cptr_offset(cptr_offset(secret, 136), -(17)), seed);
        __builtin_assume(((((nbRounds) >>> 0) >= ((8) >>> 0) ? 1 : 0) ? 1 : 0));
        acc = XXH3_avalanche(acc);
        for (i = ((8) >>> 0); (((i) >>> 0) < ((nbRounds) >>> 0) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
            (() => { throw new Error("inline asm not supported in TS translation: (asm template not exposed in AST)"); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
            acc_end = __u64(__as_bigint(acc_end) + __as_bigint(XXH3_mix16B(cptr_offset(input, ((Math.imul(((16) >>> 0), ((i) >>> 0)) >>> 0))), cptr_offset(cptr_offset(secret, ((Math.imul(((16) >>> 0), (u32(((i) >>> 0) - ((8) >>> 0)))) >>> 0))), 3), seed)));
        }
        return XXH3_avalanche(__u64(__as_bigint(acc) + __as_bigint(acc_end)));
    }
}
function XXH_writeLE64(dst, v64) {
    if ((!1 ? 1 : 0)) {
        v64 = XXH_swap64(v64);
    }
    XXH_memcpy(dst, v64, 8);
}
function XXH_mult32to64_add64(lhs, rhs, acc) {
    return __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint(Math.trunc(+((Number(BigInt.asIntN(32, __as_bigint(lhs))))))))) * __as_bigint(__u64(__as_bigint(Math.trunc(+((Number(BigInt.asIntN(32, __as_bigint(rhs)))))))))))) + __as_bigint(acc));
}
function XXH3_scalarRound(acc, input, secret, lane) {
    let xacc = cptr_clone((acc)); /* &ref */
    let xinput = cptr_clone(cptr_clone((input))); /* &ref */
    let xsecret = cptr_clone(cptr_clone((secret))); /* &ref */
    __builtin_assume(((((lane) >>> 0) < (__safe_div(64, 8)) ? 1 : 0) ? 1 : 0));
    __builtin_assume((((((Math.trunc(+(__rt_ptr_to_intptr(acc)))) >>> 0) & (((i32(8 - 1))) >>> 0)) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
    {
        let data_val = XXH_readLE64(cptr_offset(xinput, ((lane) >>> 0) * ((8) >>> 0)));
        let data_key = __u64(__as_bigint(data_val) ^ __as_bigint(XXH_readLE64(cptr_offset(xsecret, ((lane) >>> 0) * ((8) >>> 0)))));
        cptr_write_uint64(xacc, ((lane) >>> 0) ^ ((1) >>> 0), cptr_read_uint64(xacc, ((lane) >>> 0) ^ ((1) >>> 0)) + (data_val));
        cptr_write_uint64(xacc, ((lane) >>> 0), XXH_mult32to64_add64(data_key, __u64(__u64(__as_bigint(data_key)) >> __as_bigint(32)), cptr_read_uint64(xacc, ((lane) >>> 0))));
    }
}
function XXH3_accumulate_512_scalar(acc, input, secret) {
    let i = 0;
    for (i = ((0) >>> 0); (((i) >>> 0) < (__safe_div(64, 8)) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
        XXH3_scalarRound(acc, input, secret, ((i) >>> 0));
    }
}
function XXH3_accumulate_scalar(acc, input, secret, nbStripes) {
    let n = 0;
    for (n = ((0) >>> 0); (((n) >>> 0) < ((nbStripes) >>> 0) ? 1 : 0); (() => { const _t = n; n = u32(n + 1); return _t; })()) {
        let _in = cptr_offset(input, ((n) >>> 0) * ((64) >>> 0)); /* &ref */
        __builtin_prefetch((cptr_offset(_in, 320)), 0, 3);
        XXH3_accumulate_512_scalar(acc, _in, cptr_offset(secret, ((n) >>> 0) * ((8) >>> 0)));
    }
}
function XXH3_scalarScrambleRound(acc, secret, lane) {
    let xacc = cptr_clone((acc)); /* &ref */
    let xsecret = cptr_clone(cptr_clone((secret))); /* &ref */
    __builtin_assume(((((((Math.trunc(+(__rt_ptr_to_intptr(acc)))) >>> 0)) & (((i32(8 - 1))) >>> 0)) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((((lane) >>> 0) < (__safe_div(64, 8)) ? 1 : 0) ? 1 : 0));
    {
        let key64 = XXH_readLE64(cptr_offset(xsecret, ((lane) >>> 0) * ((8) >>> 0)));
        let acc64 = cptr_read_uint64(xacc, ((lane) >>> 0));
        acc64 = XXH_xorshift64(acc64, 47);
        acc64 = __u64(__as_bigint(acc64) ^ __as_bigint(key64));
        acc64 = __u64(__as_bigint(acc64) * __as_bigint(2654435761));
        cptr_write_uint64(xacc, ((lane) >>> 0), acc64);
    }
}
function XXH3_scrambleAcc_scalar(acc, secret) {
    let i = 0;
    for (i = ((0) >>> 0); (((i) >>> 0) < (__safe_div(64, 8)) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
        XXH3_scalarScrambleRound(acc, secret, ((i) >>> 0));
    }
}
function XXH3_initCustomSecret_scalar(customSecret, seed64) {
    let kSecretPtr = cptr_clone(cptr_clone(XXH3_kSecret)); /* &ref */
    do {
    } while (0);
    {
        let nbRounds = __safe_div(192, 16);
        let i = 0;
        for (i = 0; (i < nbRounds ? 1 : 0); i++) {
            let lo = __u64(__as_bigint(XXH_readLE64(cptr_offset(kSecretPtr, Math.imul(16, i)))) + __as_bigint(seed64));
            let hi = __u64(__as_bigint(XXH_readLE64(cptr_offset(cptr_offset(kSecretPtr, Math.imul(16, i)), 8))) - __as_bigint(seed64));
            XXH_writeLE64(cptr_offset((customSecret), Math.imul(16, i)), lo);
            XXH_writeLE64(cptr_offset(cptr_offset((customSecret), Math.imul(16, i)), 8), hi);
        }
    }
}
function XXH3_hashLong_internal_loop(acc, input, len, secret, secretSize, f_acc, f_scramble) {
    let nbStripesPerBlock = __safe_div((((secretSize) >>> 0) - ((64) >>> 0)), ((8) >>> 0));
    let block_len = ((64) >>> 0) * ((nbStripesPerBlock) >>> 0);
    let nb_blocks = __safe_div((((len) >>> 0) - ((1) >>> 0)), ((block_len) >>> 0));
    let n = 0;
    __builtin_assume(((((secretSize) >>> 0) >= ((136) >>> 0) ? 1 : 0) ? 1 : 0));
    for (n = ((0) >>> 0); (((n) >>> 0) < ((nb_blocks) >>> 0) ? 1 : 0); (() => { const _t = n; n = u32(n + 1); return _t; })()) {
        f_acc(acc, cptr_offset(input, ((n) >>> 0) * ((block_len) >>> 0)), secret, ((nbStripesPerBlock) >>> 0));
        f_scramble(acc, cptr_offset(cptr_offset(secret, ((secretSize) >>> 0)), -(64)));
    }
    __builtin_assume(((((len) >>> 0) > ((64) >>> 0) ? 1 : 0) ? 1 : 0));
    {
        let nbStripes = __safe_div(((((len) >>> 0) - ((1) >>> 0)) - (((block_len) >>> 0) * ((nb_blocks) >>> 0))), ((64) >>> 0));
        __builtin_assume(((((nbStripes) >>> 0) <= (__safe_div(((secretSize) >>> 0), ((8) >>> 0))) ? 1 : 0) ? 1 : 0));
        f_acc(acc, cptr_offset(input, ((nb_blocks) >>> 0) * ((block_len) >>> 0)), secret, ((nbStripes) >>> 0));
        {
            {
                let p = cptr_offset(cptr_offset(input, ((len) >>> 0)), -(64)); /* &ref */
                XXH3_accumulate_512_scalar(acc, p, cptr_offset(cptr_offset(cptr_offset(secret, ((secretSize) >>> 0)), -(64)), -(7)));
            }
        }
    }
}
function XXH3_mix2Accs(acc, secret) {
    return (() => { const __rtl_1_1 = __u64(__as_bigint(cptr_read_uint64(acc, 1)) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 8)))); const __rtl_1_0 = __u64(__as_bigint(cptr_read_uint64(acc, 0)) ^ __as_bigint(XXH_readLE64(secret))); return XXH3_mul128_fold64(__rtl_1_0, __rtl_1_1); })();
}
function XXH3_mergeAccs(acc, secret, start) {
    let result64 = start;
    let i = ((0) >>> 0);
    for (i = ((0) >>> 0); (((i) >>> 0) < ((4) >>> 0) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
        result64 = __u64(__as_bigint(result64) + __as_bigint(XXH3_mix2Accs(cptr_offset(acc, (((2) >>> 0) * ((i) >>> 0)) * 8), cptr_offset(secret, ((16) >>> 0) * ((i) >>> 0)))));
    }
    return XXH3_avalanche(result64);
}
function XXH3_hashLong_64b_internal(input, len, secret, secretSize, f_acc, f_scramble) {
    /* BRIDGE: _Alignas(8) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
    let acc = [3266489917, 11400714785074694791n, 14029467366897019727n, 1609587929392839161n, 9650029242287828579n, 2246822519, 2870177450012600261n, 2654435761];
    XXH3_hashLong_internal_loop(acc, (input), ((len) >>> 0), (secret), ((secretSize) >>> 0), f_acc, f_scramble);
    do {
    } while (0);
    __builtin_assume(((((secretSize) >>> 0) >= 64 + 11 ? 1 : 0) ? 1 : 0));
    return XXH3_mergeAccs(acc, cptr_offset((secret), 11), __u64(__as_bigint(__u64(__as_bigint(((len) >>> 0)))) * __as_bigint(11400714785074694791n)));
}
function XXH3_hashLong_64b_withSecret(input, len, seed64, secret, secretLen) {
    (seed64);
    return XXH3_hashLong_64b_internal(input, ((len) >>> 0), secret, ((secretLen) >>> 0), XXH3_accumulate_scalar, XXH3_scrambleAcc_scalar);
}
function XXH3_hashLong_64b_default(input, len, seed64, secret, secretLen) {
    (seed64);
    (secret);
    (((secretLen) >>> 0));
    return XXH3_hashLong_64b_internal(input, ((len) >>> 0), XXH3_kSecret, 1536, XXH3_accumulate_scalar, XXH3_scrambleAcc_scalar);
}
function XXH3_hashLong_64b_withSeed_internal(input, len, seed, f_acc, f_scramble, f_initSec) {
    if ((seed == 0 ? 1 : 0)) {
        return XXH3_hashLong_64b_internal(input, ((len) >>> 0), XXH3_kSecret, 1536, f_acc, f_scramble);
    }
    {
        /* BRIDGE: _Alignas(8) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
        let secret = cptr_create(192);
        f_initSec(secret, seed);
        return XXH3_hashLong_64b_internal(input, ((len) >>> 0), secret, 1536, f_acc, f_scramble);
    }
}
function XXH3_hashLong_64b_withSeed(input, len, seed, secret, secretLen) {
    (secret);
    (((secretLen) >>> 0));
    return XXH3_hashLong_64b_withSeed_internal(input, ((len) >>> 0), seed, XXH3_accumulate_scalar, XXH3_scrambleAcc_scalar, XXH3_initCustomSecret_scalar);
}
function XXH3_64bits_internal(input, len, seed64, secret, secretLen, f_hashLong) {
    __builtin_assume(((((secretLen) >>> 0) >= ((136) >>> 0) ? 1 : 0) ? 1 : 0));
    if ((((len) >>> 0) <= ((16) >>> 0) ? 1 : 0)) {
        return XXH3_len_0to16_64b((input), ((len) >>> 0), (secret), seed64);
    }
    if ((((len) >>> 0) <= ((128) >>> 0) ? 1 : 0)) {
        return XXH3_len_17to128_64b((input), ((len) >>> 0), (secret), ((secretLen) >>> 0), seed64);
    }
    if ((((len) >>> 0) <= ((240) >>> 0) ? 1 : 0)) {
        return XXH3_len_129to240_64b((input), ((len) >>> 0), (secret), ((secretLen) >>> 0), seed64);
    }
    return f_hashLong(input, ((len) >>> 0), seed64, (secret), ((secretLen) >>> 0));
}
export function XXH3_64bits(input, length) {
    return XXH3_64bits_internal(input, ((length) >>> 0), 0, XXH3_kSecret, 1536, XXH3_hashLong_64b_default);
}
export function XXH3_64bits_withSecret(input, length, secret, secretSize) {
    return XXH3_64bits_internal(input, ((length) >>> 0), 0, secret, ((secretSize) >>> 0), XXH3_hashLong_64b_withSecret);
}
export function XXH3_64bits_withSeed(input, length, seed) {
    return XXH3_64bits_internal(input, ((length) >>> 0), seed, XXH3_kSecret, 1536, XXH3_hashLong_64b_withSeed);
}
export function XXH3_64bits_withSecretandSeed(input, length, secret, secretSize, seed) {
    if ((((length) >>> 0) <= ((240) >>> 0) ? 1 : 0)) {
        return XXH3_64bits_internal(input, ((length) >>> 0), seed, XXH3_kSecret, 1536, null);
    }
    return XXH3_hashLong_64b_withSecret(input, ((length) >>> 0), seed, (secret), ((secretSize) >>> 0));
}
function XXH_alignedMalloc(s, align) {
    __builtin_assume(((((((align) >>> 0) <= ((128) >>> 0) ? 1 : 0) && (((align) >>> 0) >= ((8) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    __builtin_assume((((((align) >>> 0) & (((align) >>> 0) - ((1) >>> 0))) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((((((s) >>> 0) != ((0) >>> 0) ? 1 : 0) && (((s) >>> 0) < (((s) >>> 0) + ((align) >>> 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    {
        let base = (XXH_malloc(((s) >>> 0) + ((align) >>> 0))); /* &ref */
        if ((!cptr_eq(base, (null)) ? 1 : 0)) {
            let offset = ((align) >>> 0) - (((Math.trunc(+(__rt_ptr_to_intptr(base)))) >>> 0) & (((align) >>> 0) - ((1) >>> 0)));
            let ptr = cptr_offset(base, ((offset) >>> 0)); /* &ref */
            __builtin_assume(((__safe_mod(((Math.trunc(+(__rt_ptr_to_intptr(ptr)))) >>> 0), ((align) >>> 0)) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
            ptr.buf[(ptr.off ?? 0) + -1] = Number(BigInt.asIntN(32, __as_bigint(((offset) >>> 0))));
            return cptr_clone(ptr);
        }
        return cptr_clone((null));
    }
}
function XXH_alignedFree(p) {
    if ((!cptr_eq(p, (null)) ? 1 : 0)) {
        let ptr = cptr_clone(cptr_clone((p))); /* &ref */
        let offset = ((ptr.buf[(ptr.off ?? 0) + -1]) & 0xFF);
        let base = cptr_offset(ptr, -(((offset) & 0xFF))); /* &ref */
        XXH_free(base);
    }
}
export function XXH3_createState() {
    let state = (new XXH3_state_t()); /* &ref */
    if ((state == (null) ? 1 : 0)) {
        return null;
    }
    do {
        let tmp_xxh3_state_ptr = (state); /* &ref */
        (__struct_ptr_at(tmp_xxh3_state_ptr, 0)).seed = 0;
        (__struct_ptr_at(tmp_xxh3_state_ptr, 0)).extSecret = null;
    } while (0);
    return state;
}
export function XXH3_freeState(statePtr) {
    XXH_alignedFree(statePtr);
    return XXH_OK;
}
export function XXH3_copyState(dst_state, src_state) {
    XXH_memcpy(dst_state, src_state, 584);
}
function XXH3_reset_internal(statePtr, seed, secret, secretSize) {
    let initStart = 0;
    let initLength = 0 - ((initStart) >>> 0);
    __builtin_assume(((0 > ((initStart) >>> 0) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((statePtr != (null) ? 1 : 0) ? 1 : 0));
    memset(cptr_offset((statePtr), ((initStart) >>> 0)), 0, ((Number(BigInt.asUintN(32, __as_bigint(initLength)))) >>> 0));
    (__struct_ptr_at(statePtr, 0)).acc[0] = 3266489917;
    (__struct_ptr_at(statePtr, 0)).acc[1] = 11400714785074694791n;
    (__struct_ptr_at(statePtr, 0)).acc[2] = 14029467366897019727n;
    (__struct_ptr_at(statePtr, 0)).acc[3] = 1609587929392839161n;
    (__struct_ptr_at(statePtr, 0)).acc[4] = 9650029242287828579n;
    (__struct_ptr_at(statePtr, 0)).acc[5] = 2246822519;
    (__struct_ptr_at(statePtr, 0)).acc[6] = 2870177450012600261n;
    (__struct_ptr_at(statePtr, 0)).acc[7] = 2654435761;
    (__struct_ptr_at(statePtr, 0)).seed = seed;
    (__struct_ptr_at(statePtr, 0)).useSeed = ((((seed != 0 ? 1 : 0))) >>> 0);
    (__struct_ptr_at(statePtr, 0)).extSecret = (secret);
    __builtin_assume(((((secretSize) >>> 0) >= ((136) >>> 0) ? 1 : 0) ? 1 : 0));
    (__struct_ptr_at(statePtr, 0)).secretLimit = ((secretSize) >>> 0) - ((64) >>> 0);
    (__struct_ptr_at(statePtr, 0)).nbStripesPerBlock = __safe_div((((__struct_ptr_at(statePtr, 0)).secretLimit) >>> 0), ((8) >>> 0));
}
export function XXH3_64bits_reset(statePtr) {
    if ((statePtr == (null) ? 1 : 0)) {
        return XXH_ERROR;
    }
    XXH3_reset_internal(statePtr, 0, XXH3_kSecret, ((192) >>> 0));
    return XXH_OK;
}
export function XXH3_64bits_reset_withSecret(statePtr, secret, secretSize) {
    if ((statePtr == (null) ? 1 : 0)) {
        return XXH_ERROR;
    }
    XXH3_reset_internal(statePtr, 0, secret, ((secretSize) >>> 0));
    if ((cptr_eq(secret, (null)) ? 1 : 0)) {
        return XXH_ERROR;
    }
    if ((((secretSize) >>> 0) < ((136) >>> 0) ? 1 : 0)) {
        return XXH_ERROR;
    }
    return XXH_OK;
}
export function XXH3_64bits_reset_withSeed(statePtr, seed) {
    if ((statePtr == (null) ? 1 : 0)) {
        return XXH_ERROR;
    }
    if ((seed == 0 ? 1 : 0)) {
        return XXH3_64bits_reset(statePtr);
    }
    if ((((((__as_bigint(seed) != __as_bigint((__struct_ptr_at(statePtr, 0)).seed)) ? 1 : 0)) || ((!cptr_eq((__struct_ptr_at(statePtr, 0)).extSecret, (null)) ? 1 : 0))) ? 1 : 0)) {
        XXH3_initCustomSecret_scalar((__struct_ptr_at(statePtr, 0)).customSecret, seed);
    }
    XXH3_reset_internal(statePtr, seed, null, ((192) >>> 0));
    return XXH_OK;
}
export function XXH3_64bits_reset_withSecretandSeed(statePtr, secret, secretSize, seed64) {
    if ((statePtr == (null) ? 1 : 0)) {
        return XXH_ERROR;
    }
    if ((cptr_eq(secret, (null)) ? 1 : 0)) {
        return XXH_ERROR;
    }
    if ((((secretSize) >>> 0) < ((136) >>> 0) ? 1 : 0)) {
        return XXH_ERROR;
    }
    XXH3_reset_internal(statePtr, seed64, secret, ((secretSize) >>> 0));
    (__struct_ptr_at(statePtr, 0)).useSeed = ((1) >>> 0);
    return XXH_OK;
}
// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: nbStripesSoFarPtr.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function XXH3_consumeStripes(acc, nbStripesSoFarPtr, nbStripesPerBlock, input, nbStripes, secret, secretLimit, f_acc, f_scramble) {
    let initialSecret = cptr_offset(secret, ((nbStripesSoFarPtr.value) >>> 0) * ((8) >>> 0)); /* &ref */
    if ((((nbStripes) >>> 0) >= (((nbStripesPerBlock) >>> 0) - ((nbStripesSoFarPtr.value) >>> 0)) ? 1 : 0)) {
        let nbStripesThisIter = ((nbStripesPerBlock) >>> 0) - ((nbStripesSoFarPtr.value) >>> 0);
        do {
            f_acc(acc, input, initialSecret, ((nbStripesThisIter) >>> 0));
            f_scramble(acc, cptr_offset(secret, ((secretLimit) >>> 0)));
            input = cptr_offset(input, ((nbStripesThisIter) >>> 0) * ((64) >>> 0));
            nbStripes -= ((nbStripesThisIter) >>> 0);
            nbStripesThisIter = ((nbStripesPerBlock) >>> 0);
            initialSecret = secret;
        } while ((((nbStripes) >>> 0) >= ((nbStripesPerBlock) >>> 0) ? 1 : 0));
        nbStripesSoFarPtr.value = ((0) >>> 0);
    }
    if ((((nbStripes) >>> 0) > ((0) >>> 0) ? 1 : 0)) {
        f_acc(acc, input, initialSecret, ((nbStripes) >>> 0));
        input = cptr_offset(input, ((nbStripes) >>> 0) * ((64) >>> 0));
        nbStripesSoFarPtr.value += ((nbStripes) >>> 0);
    }
    return cptr_clone(input);
}
function XXH3_update(state, input, len, f_acc, f_scramble) {
    if ((cptr_eq(input, (null)) ? 1 : 0)) {
        __builtin_assume(((((len) >>> 0) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
        return XXH_OK;
    }
    __builtin_assume(((state != (null) ? 1 : 0) ? 1 : 0));
    {
        let bEnd = cptr_offset(input, ((len) >>> 0)); /* &ref */
        let secret = (((cptr_eq((__struct_ptr_at(state, 0)).extSecret, (null)) ? 1 : 0)) ? (__struct_ptr_at(state, 0)).customSecret : (__struct_ptr_at(state, 0)).extSecret); /* &ref */
        let acc = cptr_from_uint64_array((__struct_ptr_at(state, 0)).acc);
        (__struct_ptr_at(state, 0)).totalLen = __u64(__as_bigint((__struct_ptr_at(state, 0)).totalLen) + __as_bigint(((len) >>> 0)));
        __builtin_assume((((((__struct_ptr_at(state, 0)).bufferedSize) >>> 0) <= ((256) >>> 0) ? 1 : 0) ? 1 : 0));
        if ((((len) >>> 0) <= ((u32(((256) >>> 0) - (((__struct_ptr_at(state, 0)).bufferedSize) >>> 0))) >>> 0) ? 1 : 0)) {
            XXH_memcpy(cptr_offset((__struct_ptr_at(state, 0)).buffer, (((__struct_ptr_at(state, 0)).bufferedSize) >>> 0)), input, ((len) >>> 0));
            (__struct_ptr_at(state, 0)).bufferedSize = u32((__struct_ptr_at(state, 0)).bufferedSize + Number(BigInt.asIntN(32, __as_bigint(((len) >>> 0)))));
            return XXH_OK;
        }
        do {
        } while (0);
        if ((((__struct_ptr_at(state, 0)).bufferedSize) >>> 0)) {
            let loadSize = ((u32(((256) >>> 0) - (((__struct_ptr_at(state, 0)).bufferedSize) >>> 0))) >>> 0);
            XXH_memcpy(cptr_offset((__struct_ptr_at(state, 0)).buffer, (((__struct_ptr_at(state, 0)).bufferedSize) >>> 0)), input, ((loadSize) >>> 0));
            input = cptr_offset(input, ((loadSize) >>> 0));
            XXH3_consumeStripes(acc, __field_ref_scalar(() => (__struct_ptr_at(state, 0)), "XXH3_state_t", "nbStripesSoFar", 528), (((__struct_ptr_at(state, 0)).nbStripesPerBlock) >>> 0), (__struct_ptr_at(state, 0)).buffer, (((__safe_div(256, 64))) >>> 0), secret, (((__struct_ptr_at(state, 0)).secretLimit) >>> 0), f_acc, f_scramble);
            (__struct_ptr_at(state, 0)).bufferedSize = ((0) >>> 0);
        }
        __builtin_assume(((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
            return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb)
            return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(input, bEnd) ? 1 : 0) ? 1 : 0));
        if ((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
            return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(bEnd, input) > 256 ? 1 : 0)) {
            let nbStripes = __safe_div(((Math.trunc(+((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
                return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(cptr_offset(bEnd, -(1)), input))))) >>> 0), ((64) >>> 0));
            input = XXH3_consumeStripes(acc, __field_ref_scalar(() => (__struct_ptr_at(state, 0)), "XXH3_state_t", "nbStripesSoFar", 528), (((__struct_ptr_at(state, 0)).nbStripesPerBlock) >>> 0), input, ((nbStripes) >>> 0), cptr_clone(secret), (((__struct_ptr_at(state, 0)).secretLimit) >>> 0), f_acc, f_scramble);
            XXH_memcpy(cptr_offset(cptr_offset((__struct_ptr_at(state, 0)).buffer, 256), -(64)), cptr_offset(input, -(64)), ((64) >>> 0));
        }
        __builtin_assume(((((__l, __r) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb)
            return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb)
            return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(input, bEnd) ? 1 : 0) ? 1 : 0));
        __builtin_assume(((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
            return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(bEnd, input) <= 256 ? 1 : 0) ? 1 : 0));
        __builtin_assume((((((__struct_ptr_at(state, 0)).bufferedSize) >>> 0) == ((0) >>> 0) ? 1 : 0) ? 1 : 0));
        XXH_memcpy((__struct_ptr_at(state, 0)).buffer, input, ((Math.trunc(+((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
            return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(bEnd, input))))) >>> 0));
        (__struct_ptr_at(state, 0)).bufferedSize = Math.trunc(+((((__lp, __rp) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb)
            return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(bEnd, input))));
    }
    return XXH_OK;
}
export function XXH3_64bits_update(state, input, len) {
    return XXH3_update(state, (input), ((len) >>> 0), XXH3_accumulate_scalar, XXH3_scrambleAcc_scalar);
}
function XXH3_digest_long(acc, state, secret) {
    let lastStripe = cptr_create(64);
    let lastStripePtr = null;
    XXH_memcpy(acc, (__struct_ptr_at(state, 0)).acc, 64);
    if (((((__struct_ptr_at(state, 0)).bufferedSize) >>> 0) >= ((64) >>> 0) ? 1 : 0)) {
        let nbStripes = ((__safe_div((u32((((__struct_ptr_at(state, 0)).bufferedSize) >>> 0) - ((1) >>> 0))), ((64) >>> 0))) >>> 0);
        let nbStripesSoFar_box = { value: (((__struct_ptr_at(state, 0)).nbStripesSoFar) >>> 0) };
        XXH3_consumeStripes(acc, nbStripesSoFar_box, (((__struct_ptr_at(state, 0)).nbStripesPerBlock) >>> 0), (__struct_ptr_at(state, 0)).buffer, ((nbStripes) >>> 0), secret, (((__struct_ptr_at(state, 0)).secretLimit) >>> 0), XXH3_accumulate_scalar, XXH3_scrambleAcc_scalar);
        lastStripePtr = cptr_offset(cptr_offset((__struct_ptr_at(state, 0)).buffer, (((__struct_ptr_at(state, 0)).bufferedSize) >>> 0)), -(64));
    }
    else {
        let catchupSize = ((u32(((64) >>> 0) - (((__struct_ptr_at(state, 0)).bufferedSize) >>> 0))) >>> 0);
        __builtin_assume((((((__struct_ptr_at(state, 0)).bufferedSize) >>> 0) > ((0) >>> 0) ? 1 : 0) ? 1 : 0));
        XXH_memcpy(lastStripe, cptr_offset(cptr_offset((__struct_ptr_at(state, 0)).buffer, 256), -(((catchupSize) >>> 0))), ((catchupSize) >>> 0));
        XXH_memcpy(cptr_offset(lastStripe, ((catchupSize) >>> 0)), (__struct_ptr_at(state, 0)).buffer, (((((__struct_ptr_at(state, 0)).bufferedSize) >>> 0)) >>> 0));
        lastStripePtr = lastStripe;
    }
    XXH3_accumulate_512_scalar(acc, lastStripePtr, cptr_offset(cptr_offset(secret, (((__struct_ptr_at(state, 0)).secretLimit) >>> 0)), -(7)));
}
export function XXH3_64bits_digest(state) {
    let secret = (((cptr_eq((__struct_ptr_at(state, 0)).extSecret, (null)) ? 1 : 0)) ? (__struct_ptr_at(state, 0)).customSecret : (__struct_ptr_at(state, 0)).extSecret); /* &ref */
    if (((__as_bigint((__struct_ptr_at(state, 0)).totalLen) > __as_bigint(240)) ? 1 : 0)) {
        /* BRIDGE: _Alignas(8) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
        let acc = new Array(8).fill(0);
        XXH3_digest_long(acc, state, cptr_clone(secret));
        return XXH3_mergeAccs(acc, cptr_offset(secret, 11), __u64(__as_bigint(__u64(__as_bigint((__struct_ptr_at(state, 0)).totalLen))) * __as_bigint(11400714785074694791n)));
    }
    if ((((__struct_ptr_at(state, 0)).useSeed) >>> 0)) {
        return XXH3_64bits_withSeed((__struct_ptr_at(state, 0)).buffer, ((Number(BigInt.asIntN(32, __as_bigint((__struct_ptr_at(state, 0)).totalLen)))) >>> 0), (__struct_ptr_at(state, 0)).seed);
    }
    return XXH3_64bits_withSecret((__struct_ptr_at(state, 0)).buffer, ((Number(BigInt.asIntN(32, __as_bigint(((__struct_ptr_at(state, 0)).totalLen))))) >>> 0), secret, (((__struct_ptr_at(state, 0)).secretLimit) >>> 0) + ((64) >>> 0));
}
function XXH3_len_1to3_128b(input, len, secret, seed) {
    if (typeof input === 'string')
        input = cptr_from_string(input);
    __builtin_assume(((!cptr_eq(input, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((((((1) >>> 0) <= ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((3) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((!cptr_eq(secret, (null)) ? 1 : 0) ? 1 : 0));
    {
        let c1 = ((input.buf[(input.off ?? 0) + 0]) & 0xFF);
        let c2 = ((input.buf[(input.off ?? 0) + Math.trunc(((len) >>> 0) / Math.pow(2, 1))]) & 0xFF);
        let c3 = ((input.buf[(input.off ?? 0) + ((len) >>> 0) - ((1) >>> 0)]) & 0xFF);
        let combinedl = (((((Math.trunc(+(((c1) & 0xFF))) << 16) >>> 0) | ((Math.trunc(+(((c2) & 0xFF))) << 24) >>> 0)) >>> 0 | ((Math.trunc(+(((c3) & 0xFF))) << 0) >>> 0)) >>> 0 | ((Number(BigInt.asIntN(32, __as_bigint(((len) >>> 0)))) << 8) >>> 0)) >>> 0;
        let combinedh = __builtin_rotateleft32(XXH_swap32(((combinedl) >>> 0)), ((13) >>> 0));
        let bitflipl = __u64(__as_bigint(((XXH_readLE32(secret) ^ XXH_readLE32(cptr_offset(secret, 4))) >>> 0)) + __as_bigint(seed));
        let bitfliph = __u64(__as_bigint(((XXH_readLE32(cptr_offset(secret, 8)) ^ XXH_readLE32(cptr_offset(secret, 12))) >>> 0)) - __as_bigint(seed));
        let keyed_lo = __u64(__as_bigint(__u64(__as_bigint(((combinedl) >>> 0)))) ^ __as_bigint(bitflipl));
        let keyed_hi = __u64(__as_bigint(__u64(__as_bigint(((combinedh) >>> 0)))) ^ __as_bigint(bitfliph));
        let h128 = new XXH128_hash_t();
        h128.low64 = XXH64_avalanche(keyed_lo);
        h128.high64 = XXH64_avalanche(keyed_hi);
        return h128;
    }
}
function XXH3_len_4to8_128b(input, len, secret, seed) {
    __builtin_assume(((!cptr_eq(input, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((!cptr_eq(secret, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((((((4) >>> 0) <= ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((8) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    seed = __u64(__as_bigint(seed) ^ __as_bigint(__u64(__as_bigint(__u64(__as_bigint(XXH_swap32(Number(BigInt.asIntN(32, __as_bigint(seed))))))) << __as_bigint(32))));
    {
        let input_lo = XXH_readLE32(input);
        let input_hi = XXH_readLE32(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(4)));
        let input_64 = __u64(__as_bigint(((input_lo) >>> 0)) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((input_hi) >>> 0)))) << __as_bigint(32)))));
        let bitflip = __u64(__as_bigint((__u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 16))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 24)))))) + __as_bigint(seed));
        let keyed = __u64(__as_bigint(input_64) ^ __as_bigint(bitflip));
        let m128 = XXH_mult64to128(keyed, __u64(__as_bigint(11400714785074694791n) + __as_bigint(((((len) >>> 0) * Math.pow(2, 2))))));
        m128.high64 = __u64(__as_bigint(m128.high64) + __as_bigint((__u64(__as_bigint(m128.low64) << __as_bigint(1)))));
        m128.low64 = __u64(__as_bigint(m128.low64) ^ __as_bigint((__u64(__u64(__as_bigint(m128.high64)) >> __as_bigint(3)))));
        m128.low64 = XXH_xorshift64(m128.low64, 35);
        m128.low64 = __u64(__as_bigint(m128.low64) * __as_bigint(PRIME_MX2));
        m128.low64 = XXH_xorshift64(m128.low64, 28);
        m128.high64 = XXH3_avalanche(m128.high64);
        return m128;
    }
}
function XXH3_len_9to16_128b(input, len, secret, seed) {
    __builtin_assume(((!cptr_eq(input, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((!cptr_eq(secret, (null)) ? 1 : 0) ? 1 : 0));
    __builtin_assume(((((((9) >>> 0) <= ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((16) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    {
        let bitflipl = __u64(__as_bigint((__u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 32))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 40)))))) - __as_bigint(seed));
        let bitfliph = __u64(__as_bigint((__u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 48))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 56)))))) + __as_bigint(seed));
        let input_lo = XXH_readLE64(input);
        let input_hi = XXH_readLE64(cptr_offset(cptr_offset(input, ((len) >>> 0)), -(8)));
        let m128 = XXH_mult64to128(__u64(__as_bigint(__u64(__as_bigint(input_lo) ^ __as_bigint(input_hi))) ^ __as_bigint(bitflipl)), 11400714785074694791n);
        m128.low64 = __u64(__as_bigint(m128.low64) + __as_bigint(__u64(__as_bigint(__u64(__as_bigint((((len) >>> 0) - ((1) >>> 0))))) << __as_bigint(54))));
        input_hi = __u64(__as_bigint(input_hi) ^ __as_bigint(bitfliph));
        if (0) {
            m128.high64 = __u64(__as_bigint(m128.high64) + __as_bigint(__u64(__as_bigint((__u64(__as_bigint(input_hi) & __as_bigint(18446744069414584320n)))) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint(Math.trunc(+((Number(BigInt.asIntN(32, __as_bigint(input_hi))))))))) * __as_bigint(__u64(__as_bigint(Math.trunc(+((2246822519))))))))))));
        }
        else {
            m128.high64 = __u64(__as_bigint(m128.high64) + __as_bigint(__u64(__as_bigint(input_hi) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint(Math.trunc(+((Number(BigInt.asIntN(32, __as_bigint(input_hi))))))))) * __as_bigint(__u64(__as_bigint(Math.trunc(+((u32(2246822519 - ((1) >>> 0))))))))))))));
        }
        m128.low64 = __u64(__as_bigint(m128.low64) ^ __as_bigint(XXH_swap64(m128.high64)));
        {
            {
                let h128 = XXH_mult64to128(m128.low64, 14029467366897019727n);
                h128.high64 = __u64(__as_bigint(h128.high64) + __as_bigint(__u64(__as_bigint(m128.high64) * __as_bigint(14029467366897019727n))));
                h128.low64 = XXH3_avalanche(h128.low64);
                h128.high64 = XXH3_avalanche(h128.high64);
                return h128;
            }
        }
    }
}
function XXH3_len_0to16_128b(input, len, secret, seed) {
    __builtin_assume(((((len) >>> 0) <= ((16) >>> 0) ? 1 : 0) ? 1 : 0));
    {
        if ((((len) >>> 0) > ((8) >>> 0) ? 1 : 0)) {
            return XXH3_len_9to16_128b(input, ((len) >>> 0), secret, seed);
        }
        if ((((len) >>> 0) >= ((4) >>> 0) ? 1 : 0)) {
            return XXH3_len_4to8_128b(input, ((len) >>> 0), secret, seed);
        }
        if (((len) >>> 0)) {
            return XXH3_len_1to3_128b(input, ((len) >>> 0), secret, seed);
        }
        {
            {
                let h128 = new XXH128_hash_t();
                let bitflipl = __u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 64))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 72))));
                let bitfliph = __u64(__as_bigint(XXH_readLE64(cptr_offset(secret, 80))) ^ __as_bigint(XXH_readLE64(cptr_offset(secret, 88))));
                h128.low64 = XXH64_avalanche(__u64(__as_bigint(seed) ^ __as_bigint(bitflipl)));
                h128.high64 = XXH64_avalanche(__u64(__as_bigint(seed) ^ __as_bigint(bitfliph)));
                return h128;
            }
        }
    }
}
function XXH128_mix32B(acc, input_1, input_2, secret, seed) {
    acc.low64 = __u64(__as_bigint(acc.low64) + __as_bigint(XXH3_mix16B(input_1, cptr_offset(secret, 0), seed)));
    acc.low64 = __u64(__as_bigint(acc.low64) ^ __as_bigint(__u64(__as_bigint(XXH_readLE64(input_2)) + __as_bigint(XXH_readLE64(cptr_offset(input_2, 8))))));
    acc.high64 = __u64(__as_bigint(acc.high64) + __as_bigint(XXH3_mix16B(input_2, cptr_offset(secret, 16), seed)));
    acc.high64 = __u64(__as_bigint(acc.high64) ^ __as_bigint(__u64(__as_bigint(XXH_readLE64(input_1)) + __as_bigint(XXH_readLE64(cptr_offset(input_1, 8))))));
    return acc;
}
function XXH3_len_17to128_128b(input, len, secret, secretSize, seed) {
    __builtin_assume(((((secretSize) >>> 0) >= ((136) >>> 0) ? 1 : 0) ? 1 : 0));
    (((secretSize) >>> 0));
    __builtin_assume(((((((16) >>> 0) < ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((128) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    {
        let acc = new XXH128_hash_t();
        acc.low64 = __u64(__as_bigint(((len) >>> 0)) * __as_bigint(11400714785074694791n));
        acc.high64 = 0;
        if ((((len) >>> 0) > ((32) >>> 0) ? 1 : 0)) {
            if ((((len) >>> 0) > ((64) >>> 0) ? 1 : 0)) {
                if ((((len) >>> 0) > ((96) >>> 0) ? 1 : 0)) {
                    Object.assign(acc, XXH128_mix32B(Object.assign(new XXH128_hash_t(), acc), cptr_offset(input, 48), cptr_offset(cptr_offset(input, ((len) >>> 0)), -(64)), cptr_offset(secret, 96), seed));
                }
                Object.assign(acc, XXH128_mix32B(Object.assign(new XXH128_hash_t(), acc), cptr_offset(input, 32), cptr_offset(cptr_offset(input, ((len) >>> 0)), -(48)), cptr_offset(secret, 64), seed));
            }
            Object.assign(acc, XXH128_mix32B(Object.assign(new XXH128_hash_t(), acc), cptr_offset(input, 16), cptr_offset(cptr_offset(input, ((len) >>> 0)), -(32)), cptr_offset(secret, 32), seed));
        }
        Object.assign(acc, XXH128_mix32B(Object.assign(new XXH128_hash_t(), acc), input, cptr_offset(cptr_offset(input, ((len) >>> 0)), -(16)), secret, seed));
        {
            {
                let h128 = new XXH128_hash_t();
                h128.low64 = __u64(__as_bigint(acc.low64) + __as_bigint(acc.high64));
                h128.high64 = __u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint(acc.low64) * __as_bigint(11400714785074694791n)))) + __as_bigint((__u64(__as_bigint(acc.high64) * __as_bigint(9650029242287828579n)))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((len) >>> 0)) - __as_bigint(seed)))) * __as_bigint(14029467366897019727n)))));
                h128.low64 = XXH3_avalanche(h128.low64);
                h128.high64 = __u64(__as_bigint(__u64(__as_bigint(0))) - __as_bigint(XXH3_avalanche(h128.high64)));
                return h128;
            }
        }
    }
}
function XXH3_len_129to240_128b(input, len, secret, secretSize, seed) {
    __builtin_assume(((((secretSize) >>> 0) >= ((136) >>> 0) ? 1 : 0) ? 1 : 0));
    (((secretSize) >>> 0));
    __builtin_assume(((((((128) >>> 0) < ((len) >>> 0) ? 1 : 0) && (((len) >>> 0) <= ((240) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0));
    {
        let acc = new XXH128_hash_t();
        let i = 0;
        acc.low64 = __u64(__as_bigint(((len) >>> 0)) * __as_bigint(11400714785074694791n));
        acc.high64 = 0;
        for (i = ((32) >>> 0); (((i) >>> 0) < ((160) >>> 0) ? 1 : 0); i = u32(i + ((32) >>> 0))) {
            Object.assign(acc, XXH128_mix32B(Object.assign(new XXH128_hash_t(), acc), cptr_offset(cptr_offset(input, ((i) >>> 0)), -(32)), cptr_offset(cptr_offset(input, ((i) >>> 0)), -(16)), cptr_offset(cptr_offset(secret, ((i) >>> 0)), -(32)), seed));
        }
        acc.low64 = XXH3_avalanche(acc.low64);
        acc.high64 = XXH3_avalanche(acc.high64);
        for (i = ((160) >>> 0); (((((i) >>> 0)) >>> 0) <= ((len) >>> 0) ? 1 : 0); i = u32(i + ((32) >>> 0))) {
            Object.assign(acc, XXH128_mix32B(Object.assign(new XXH128_hash_t(), acc), cptr_offset(cptr_offset(input, ((i) >>> 0)), -(32)), cptr_offset(cptr_offset(input, ((i) >>> 0)), -(16)), cptr_offset(cptr_offset(cptr_offset(secret, 3), ((i) >>> 0)), -(160)), seed));
        }
        Object.assign(acc, XXH128_mix32B(Object.assign(new XXH128_hash_t(), acc), cptr_offset(cptr_offset(input, ((len) >>> 0)), -(16)), cptr_offset(cptr_offset(input, ((len) >>> 0)), -(32)), cptr_offset(cptr_offset(cptr_offset(secret, 136), -(17)), -(16)), __u64(__as_bigint(__u64(__as_bigint(0))) - __as_bigint(seed))));
        {
            {
                let h128 = new XXH128_hash_t();
                h128.low64 = __u64(__as_bigint(acc.low64) + __as_bigint(acc.high64));
                h128.high64 = __u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint(acc.low64) * __as_bigint(11400714785074694791n)))) + __as_bigint((__u64(__as_bigint(acc.high64) * __as_bigint(9650029242287828579n)))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((len) >>> 0)) - __as_bigint(seed)))) * __as_bigint(14029467366897019727n)))));
                h128.low64 = XXH3_avalanche(h128.low64);
                h128.high64 = __u64(__as_bigint(__u64(__as_bigint(0))) - __as_bigint(XXH3_avalanche(h128.high64)));
                return h128;
            }
        }
    }
}
function XXH3_hashLong_128b_internal(input, len, secret, secretSize, f_acc, f_scramble) {
    /* BRIDGE: _Alignas(8) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
    let acc = [3266489917, 11400714785074694791n, 14029467366897019727n, 1609587929392839161n, 9650029242287828579n, 2246822519, 2870177450012600261n, 2654435761];
    XXH3_hashLong_internal_loop(acc, (input), ((len) >>> 0), secret, ((secretSize) >>> 0), f_acc, f_scramble);
    do {
    } while (0);
    __builtin_assume(((((secretSize) >>> 0) >= 64 + 11 ? 1 : 0) ? 1 : 0));
    {
        let h128 = new XXH128_hash_t();
        h128.low64 = XXH3_mergeAccs(acc, cptr_offset(secret, 11), __u64(__as_bigint(__u64(__as_bigint(((len) >>> 0)))) * __as_bigint(11400714785074694791n)));
        h128.high64 = XXH3_mergeAccs(acc, cptr_offset(cptr_offset(cptr_offset(secret, ((secretSize) >>> 0)), -(64)), -(11)), __u64(~__as_bigint((__u64(__as_bigint(__u64(__as_bigint(((len) >>> 0)))) * __as_bigint(14029467366897019727n))))));
        return h128;
    }
}
function XXH3_hashLong_128b_default(input, len, seed64, secret, secretLen) {
    (seed64);
    (secret);
    (((secretLen) >>> 0));
    return XXH3_hashLong_128b_internal(input, ((len) >>> 0), XXH3_kSecret, 1536, XXH3_accumulate_scalar, XXH3_scrambleAcc_scalar);
}
function XXH3_hashLong_128b_withSecret(input, len, seed64, secret, secretLen) {
    (seed64);
    return XXH3_hashLong_128b_internal(input, ((len) >>> 0), (secret), ((secretLen) >>> 0), XXH3_accumulate_scalar, XXH3_scrambleAcc_scalar);
}
function XXH3_hashLong_128b_withSeed_internal(input, len, seed64, f_acc, f_scramble, f_initSec) {
    if ((seed64 == 0 ? 1 : 0)) {
        return XXH3_hashLong_128b_internal(input, ((len) >>> 0), XXH3_kSecret, 1536, f_acc, f_scramble);
    }
    {
        /* BRIDGE: _Alignas(8) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
        let secret = cptr_create(192);
        f_initSec(secret, seed64);
        return XXH3_hashLong_128b_internal(input, ((len) >>> 0), (secret), 1536, f_acc, f_scramble);
    }
}
function XXH3_hashLong_128b_withSeed(input, len, seed64, secret, secretLen) {
    (secret);
    (((secretLen) >>> 0));
    return XXH3_hashLong_128b_withSeed_internal(input, ((len) >>> 0), seed64, XXH3_accumulate_scalar, XXH3_scrambleAcc_scalar, XXH3_initCustomSecret_scalar);
}
function XXH3_128bits_internal(input, len, seed64, secret, secretLen, f_hl128) {
    __builtin_assume(((((secretLen) >>> 0) >= ((136) >>> 0) ? 1 : 0) ? 1 : 0));
    if ((((len) >>> 0) <= ((16) >>> 0) ? 1 : 0)) {
        return XXH3_len_0to16_128b((input), ((len) >>> 0), (secret), seed64);
    }
    if ((((len) >>> 0) <= ((128) >>> 0) ? 1 : 0)) {
        return XXH3_len_17to128_128b((input), ((len) >>> 0), (secret), ((secretLen) >>> 0), seed64);
    }
    if ((((len) >>> 0) <= ((240) >>> 0) ? 1 : 0)) {
        return XXH3_len_129to240_128b((input), ((len) >>> 0), (secret), ((secretLen) >>> 0), seed64);
    }
    return f_hl128(input, ((len) >>> 0), seed64, secret, ((secretLen) >>> 0));
}
export function XXH3_128bits(input, len) {
    return XXH3_128bits_internal(input, ((len) >>> 0), 0, XXH3_kSecret, 1536, XXH3_hashLong_128b_default);
}
export function XXH3_128bits_withSecret(input, len, secret, secretSize) {
    return XXH3_128bits_internal(input, ((len) >>> 0), 0, (secret), ((secretSize) >>> 0), XXH3_hashLong_128b_withSecret);
}
export function XXH3_128bits_withSeed(input, len, seed) {
    return XXH3_128bits_internal(input, ((len) >>> 0), seed, XXH3_kSecret, 1536, XXH3_hashLong_128b_withSeed);
}
export function XXH3_128bits_withSecretandSeed(input, len, secret, secretSize, seed) {
    if ((((len) >>> 0) <= ((240) >>> 0) ? 1 : 0)) {
        return XXH3_128bits_internal(input, ((len) >>> 0), seed, XXH3_kSecret, 1536, null);
    }
    return XXH3_hashLong_128b_withSecret(input, ((len) >>> 0), seed, secret, ((secretSize) >>> 0));
}
export function XXH128(input, len, seed) {
    return XXH3_128bits_withSeed(input, ((len) >>> 0), seed);
}
export function XXH3_128bits_reset(statePtr) {
    return XXH3_64bits_reset(statePtr);
}
export function XXH3_128bits_reset_withSecret(statePtr, secret, secretSize) {
    return XXH3_64bits_reset_withSecret(statePtr, secret, ((secretSize) >>> 0));
}
export function XXH3_128bits_reset_withSeed(statePtr, seed) {
    return XXH3_64bits_reset_withSeed(statePtr, seed);
}
export function XXH3_128bits_reset_withSecretandSeed(statePtr, secret, secretSize, seed) {
    return XXH3_64bits_reset_withSecretandSeed(statePtr, secret, ((secretSize) >>> 0), seed);
}
export function XXH3_128bits_update(state, input, len) {
    return XXH3_64bits_update(state, input, ((len) >>> 0));
}
export function XXH3_128bits_digest(state) {
    let secret = (((cptr_eq((__struct_ptr_at(state, 0)).extSecret, (null)) ? 1 : 0)) ? (__struct_ptr_at(state, 0)).customSecret : (__struct_ptr_at(state, 0)).extSecret); /* &ref */
    if (((__as_bigint((__struct_ptr_at(state, 0)).totalLen) > __as_bigint(240)) ? 1 : 0)) {
        /* BRIDGE: _Alignas(8) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
        let acc = new Array(8).fill(0);
        XXH3_digest_long(acc, state, cptr_clone(secret));
        __builtin_assume((((((__struct_ptr_at(state, 0)).secretLimit) >>> 0) + ((64) >>> 0) >= 64 + 11 ? 1 : 0) ? 1 : 0));
        {
            {
                let h128 = new XXH128_hash_t();
                h128.low64 = XXH3_mergeAccs(acc, cptr_offset(secret, 11), __u64(__as_bigint(__u64(__as_bigint((__struct_ptr_at(state, 0)).totalLen))) * __as_bigint(11400714785074694791n)));
                h128.high64 = XXH3_mergeAccs(acc, cptr_offset(cptr_offset(cptr_offset(cptr_offset(secret, (((__struct_ptr_at(state, 0)).secretLimit) >>> 0)), 64), -(64)), -(11)), __u64(~__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__struct_ptr_at(state, 0)).totalLen))) * __as_bigint(14029467366897019727n))))));
                return h128;
            }
        }
    }
    if ((__struct_ptr_at(state, 0)).seed) {
        return XXH3_128bits_withSeed((__struct_ptr_at(state, 0)).buffer, ((Number(BigInt.asIntN(32, __as_bigint((__struct_ptr_at(state, 0)).totalLen)))) >>> 0), (__struct_ptr_at(state, 0)).seed);
    }
    return XXH3_128bits_withSecret((__struct_ptr_at(state, 0)).buffer, ((Number(BigInt.asIntN(32, __as_bigint(((__struct_ptr_at(state, 0)).totalLen))))) >>> 0), secret, (((__struct_ptr_at(state, 0)).secretLimit) >>> 0) + ((64) >>> 0));
}
export function XXH128_isEqual(h1, h2) {
    return ((!(memcmp(h1, h2, 16)) ? 1 : 0) ? 1 : 0);
}
export function XXH128_cmp(h128_1, h128_2) {
    let h1 = cptr_struct_overlay(XXH128_hash_t, h128_1);
    let h2 = cptr_struct_overlay(XXH128_hash_t, h128_2);
    let hcmp = i32((((__as_bigint(h1.high64) > __as_bigint(h2.high64)) ? 1 : 0)) - (((__as_bigint(h2.high64) > __as_bigint(h1.high64)) ? 1 : 0)));
    if (hcmp) {
        return hcmp;
    }
    return i32((((__as_bigint(h1.low64) > __as_bigint(h2.low64)) ? 1 : 0)) - (((__as_bigint(h2.low64) > __as_bigint(h1.low64)) ? 1 : 0)));
}
export function XXH128_canonicalFromHash(dst, hash) {
    do {
    } while (0);
    if (1) {
        hash.high64 = XXH_swap64(hash.high64);
        hash.low64 = XXH_swap64(hash.low64);
    }
    XXH_memcpy(dst, __field_ref_scalar(() => hash, "XXH128_hash_t", "high64", 8), 8);
    XXH_memcpy(cptr_offset((dst), 8), __field_ref_scalar(() => hash, "XXH128_hash_t", "low64", 0), 8);
}
export function XXH128_hashFromCanonical(src) {
    let h = new XXH128_hash_t();
    h.high64 = XXH_readBE64(src);
    h.low64 = XXH_readBE64(cptr_offset((__struct_ptr_at(src, 0)).digest, 8));
    return h;
}
function XXH3_combine16(dst, h128) {
    XXH_writeLE64(dst, __u64(__as_bigint(XXH_readLE64(dst)) ^ __as_bigint(h128.low64)));
    XXH_writeLE64(cptr_offset((dst), 8), __u64(__as_bigint(XXH_readLE64(cptr_offset((dst), 8))) ^ __as_bigint(h128.high64)));
}
export function XXH3_generateSecret(secretBuffer, secretSize, customSeed, customSeedSize) {
    if ((cptr_eq(secretBuffer, (null)) ? 1 : 0)) {
        return XXH_ERROR;
    }
    if ((((secretSize) >>> 0) < ((136) >>> 0) ? 1 : 0)) {
        return XXH_ERROR;
    }
    if ((((customSeedSize) >>> 0) == ((0) >>> 0) ? 1 : 0)) {
        customSeed = XXH3_kSecret;
        customSeedSize = ((192) >>> 0);
    }
    if ((cptr_eq(customSeed, (null)) ? 1 : 0)) {
        return XXH_ERROR;
    }
    {
        let pos = ((0) >>> 0);
        while ((((pos) >>> 0) < ((secretSize) >>> 0) ? 1 : 0)) {
            let toCopy = ((((((((secretSize) >>> 0) - ((pos) >>> 0))) > (((customSeedSize)) >>> 0) ? 1 : 0)) ? (((customSeedSize)) >>> 0) : ((((secretSize) >>> 0) - ((pos) >>> 0)))));
            memcpy(cptr_offset((secretBuffer), ((pos) >>> 0)), customSeed, ((toCopy) >>> 0));
            pos += ((toCopy) >>> 0);
        }
    }
    {
        let nbSeg16 = __safe_div(((secretSize) >>> 0), ((16) >>> 0));
        let n = 0;
        let scrambler = new XXH128_canonical_t();
        XXH128_canonicalFromHash(scrambler, Object.assign(new XXH128_hash_t(), XXH128(customSeed, ((customSeedSize) >>> 0), 0)));
        for (n = ((0) >>> 0); (((n) >>> 0) < ((nbSeg16) >>> 0) ? 1 : 0); (() => { const _t = n; n = u32(n + 1); return _t; })()) {
            let h128 = XXH128(scrambler, 16, ((n) >>> 0));
            XXH3_combine16(cptr_offset((secretBuffer), ((n) >>> 0) * ((16) >>> 0)), Object.assign(new XXH128_hash_t(), h128));
        }
        XXH3_combine16(cptr_offset(cptr_offset((secretBuffer), ((secretSize) >>> 0)), -(16)), Object.assign(new XXH128_hash_t(), XXH128_hashFromCanonical(scrambler)));
    }
    return XXH_OK;
}
export function XXH3_generateSecret_fromSeed(secretBuffer, seed) {
    /* BRIDGE: _Alignas(8) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
    let secret = cptr_create(192);
    XXH3_initCustomSecret_scalar(secret, seed);
    __builtin_assume(((!cptr_eq(secretBuffer, (null)) ? 1 : 0) ? 1 : 0));
    memcpy(secretBuffer, secret, 192);
}
