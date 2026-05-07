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
function rand() { _rng_state = (_rng_state * 1103515245 + 12345) & 0x7fffffff; return (_rng_state >>> 16) & 0x7fff; }
let _rng_state = 42;
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
function cptr_from_uint8_array(arr) { return __cptr_cached_array(arr, "__cptr_uint8", arr.length, (v, i, x) => v.setUint8(i, x & 0xFF), 1); }
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
    return { buf: ptr.buf, off: (ptr.off ?? 0) + n, __src_arr: ptr.__src_arr, __src_writer: ptr.__src_writer, __elem_size: ptr.__elem_size }; if (Array.isArray(ptr)) { /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: const T *arr[N] init-then-decay produces a T** that survives cptr_offset/cptr_read_ptr. Detect "JS array of pointers" by element shape (CPtr-like {buf,...} or null) and lift to a slot-bearing CPtr. Plain numeric arrays fall through to the int32-DataView path. */
    const isPtrArr = ptr.length > 0 && ptr.some((e) => e == null || (typeof e === 'object' && (e?.buf || e?.slots)));
    if (isPtrArr) {
        return { buf: new Uint8Array(ptr.length * 8), off: Number(n) * 8, slots: ptr.slice(), __ptr_arr: true };
    }
    const b = new Uint8Array(ptr.length * 4);
    const v = new DataView(b.buffer);
    for (let i = 0; i < ptr.length; i++)
        v.setInt32(i * 4, ptr[i], true);
    return { buf: b, off: n };
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
function cptr_read_int8(ptr, i = 0) { if (!ptr?.buf) {
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
function cptr_read_int16(ptr, i = 0) { if (!ptr?.buf) {
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
function cptr_read_uint16(ptr, i = 0) { if (!ptr?.buf) {
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
function cptr_read_uint32(ptr, i = 0) { if (!ptr?.buf) {
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
function cptr_read_int64(ptr, i = 0) { if (!ptr?.buf) {
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
function cptr_read_uint64(ptr, i = 0) { if (!ptr?.buf) {
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
// C++20 iterator helpers — shared by <algorithm> / <numeric>.
// The emitter lowers `v[Symbol.iterator]()` to `v.values()` (C++20 §22.3.11). We patch
// Array.prototype.values once so the returned iterator carries __arr/__pos and
// coerces to its position via valueOf, so iterator arithmetic expressions like
// `it - v[Symbol.iterator]()` (from std::distance lowerings) evaluate to a position index
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
// within the same range. The emitter lowers it == __cpp_iter(v, v.length) and similar
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
function fill(first, last, value) { const A = __cpp_arr(first, last); for (let i = A.start; i < A.end; i++)
    A.arr[i] = value; }
function trunc(x) { return Math.trunc(x); }
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
// Static local variables
let _static_mag01_0 = [0, 2567483615];
let mt = new Array(624).fill(0);
let mti = i32(624 + 1);
export function init_genrand(s) {
    mt[0] = (((s) >>> 0) & 4294967295) >>> 0;
    for (mti = 1; mti < 624; mti++) {
        mt[mti] = (u32((Math.imul(1812433253, ((((mt[i32(mti - 1)]) >>> 0) ^ ((((mt[i32(mti - 1)]) >>> 0) >>> 30) >>> 0)) >>> 0)) >>> 0) + ((mti) >>> 0)));
        mt[mti] = (mt[mti] & 4294967295) >>> 0;
    }
}
export function init_by_array(init_key, key_length) {
    let i = 0;
    let j = 0;
    let k = 0;
    init_genrand(19650218);
    i = 1;
    j = 0;
    k = ((624 > key_length ? 624 : key_length));
    for (; k; k--) {
        mt[i] = u32(u32(((((mt[i]) >>> 0) ^ ((Math.imul(((((mt[i32(i - 1)]) >>> 0) ^ ((((mt[i32(i - 1)]) >>> 0) >>> 30) >>> 0)) >>> 0), 1664525) >>> 0))) >>> 0) + ((cptr_read_uint32(init_key, j)) >>> 0)) + ((j) >>> 0));
        mt[i] = (mt[i] & 4294967295) >>> 0;
        i++;
        j++;
        if (i >= 624) {
            mt[0] = ((mt[i32(624 - 1)]) >>> 0);
            i = 1;
        }
        if (j >= key_length) {
            j = 0;
        }
    }
    for (k = i32(624 - 1); k; k--) {
        mt[i] = u32(((((mt[i]) >>> 0) ^ ((Math.imul(((((mt[i32(i - 1)]) >>> 0) ^ ((((mt[i32(i - 1)]) >>> 0) >>> 30) >>> 0)) >>> 0), 1566083941) >>> 0))) >>> 0) - ((i) >>> 0));
        mt[i] = (mt[i] & 4294967295) >>> 0;
        i++;
        if (i >= 624) {
            mt[0] = ((mt[i32(624 - 1)]) >>> 0);
            i = 1;
        }
    }
    mt[0] = 2147483648;
}
export function genrand_int32() {
    let y = 0;
    if (mti >= 624) {
        let kk = 0;
        if (mti == i32(624 + 1)) {
            init_genrand(5489);
        }
        for (kk = 0; kk < i32(624 - 397); kk++) {
            y = (((((mt[kk]) >>> 0) & 2147483648) >>> 0) | ((((mt[i32(kk + 1)]) >>> 0) & 2147483647) >>> 0)) >>> 0;
            mt[kk] = ((((mt[i32(kk + 397)]) >>> 0) ^ ((((y) >>> 0) >>> 1) >>> 0)) >>> 0 ^ ((_static_mag01_0[(((y) >>> 0) & 1) >>> 0]) >>> 0)) >>> 0;
        }
        for (; kk < i32(624 - 1); kk++) {
            y = (((((mt[kk]) >>> 0) & 2147483648) >>> 0) | ((((mt[i32(kk + 1)]) >>> 0) & 2147483647) >>> 0)) >>> 0;
            mt[kk] = ((((mt[i32(kk + (i32(397 - 624)))]) >>> 0) ^ ((((y) >>> 0) >>> 1) >>> 0)) >>> 0 ^ ((_static_mag01_0[(((y) >>> 0) & 1) >>> 0]) >>> 0)) >>> 0;
        }
        y = (((((mt[i32(624 - 1)]) >>> 0) & 2147483648) >>> 0) | ((((mt[0]) >>> 0) & 2147483647) >>> 0)) >>> 0;
        mt[i32(624 - 1)] = ((((mt[i32(397 - 1)]) >>> 0) ^ ((((y) >>> 0) >>> 1) >>> 0)) >>> 0 ^ ((_static_mag01_0[(((y) >>> 0) & 1) >>> 0]) >>> 0)) >>> 0;
        mti = 0;
    }
    y = ((mt[mti++]) >>> 0);
    y = (y ^ ((((y) >>> 0) >>> 11) >>> 0)) >>> 0;
    y = (y ^ (((((y) >>> 0) << 7) >>> 0) & 2636928640) >>> 0) >>> 0;
    y = (y ^ (((((y) >>> 0) << 15) >>> 0) & 4022730752) >>> 0) >>> 0;
    y = (y ^ ((((y) >>> 0) >>> 18) >>> 0)) >>> 0;
    return ((y) >>> 0);
}
export function genrand_int31() {
    return (Math.trunc(+(((genrand_int32() >>> 1) >>> 0))) | 0);
}
export function genrand_real1() {
    return genrand_int32() * (1 / 4294967295);
}
export function genrand_real2() {
    return genrand_int32() * (1 / 4294967296);
}
export function genrand_real3() {
    return (((genrand_int32())) + 0.5) * (1 / 4294967296);
}
export function genrand_res53() {
    let a = (genrand_int32() >>> 5) >>> 0;
    let b = (genrand_int32() >>> 6) >>> 0;
    return (((a) >>> 0) * 67108864 + ((b) >>> 0)) * (1 / 9007199254740992);
}
