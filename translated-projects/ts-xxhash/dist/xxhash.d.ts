export declare class std_bitset {
    private _val;
    private _size;
    constructor(size: number, val?: any);
    count(): number;
    test(pos: number): boolean;
    set(pos?: number, val?: boolean): this;
    reset(pos?: number): this;
    flip(pos?: number): this;
    to_string(): string;
    to_ulong(): number;
    to_ullong(): number;
    size(): number;
    any(): boolean;
    none(): boolean;
    all(): boolean;
    valueOf(): number;
    [Symbol.toPrimitive](hint: string): any;
}
export declare class localeinfo_struct {
    locinfo: any;
    mbcinfo: any;
    constructor();
}
export declare class tagLC_ID {
    wLanguage: number;
    wCountry: number;
    wCodePage: number;
    constructor();
}
export declare class threadlocaleinfostruct {
    _locale_pctype: number | null;
    _locale_mb_cur_max: number;
    _locale_lc_codepage: number;
    constructor();
}
export declare class max_align_t {
    __max_align_ll: number;
    __max_align_ld: number;
    constructor();
}
export declare const XXH_OK: number;
export declare const XXH_ERROR: number;
type XXH_errorcode = number;
type XXH32_hash_t = number;
type XXH32_state_t = any;
export declare class XXH32_canonical_t {
    digest: any;
    constructor();
}
type XXH64_hash_t = any;
type XXH64_state_t = any;
export declare class XXH64_canonical_t {
    digest: any;
    constructor();
}
type XXH3_state_t = any;
export declare class XXH128_hash_t {
    low64: XXH64_hash_t;
    high64: XXH64_hash_t;
    constructor();
}
export declare class XXH128_canonical_t {
    digest: any;
    constructor();
}
export declare class XXH32_state_s {
    total_len_32: XXH32_hash_t;
    large_len: XXH32_hash_t;
    v: any;
    mem32: any;
    memsize: XXH32_hash_t;
    reserved: XXH32_hash_t;
    constructor();
}
declare const XXH32_state_t: typeof XXH32_state_s;
export declare class XXH64_state_s {
    total_len: XXH64_hash_t;
    v: any;
    mem64: any;
    memsize: XXH32_hash_t;
    reserved32: XXH32_hash_t;
    reserved64: XXH64_hash_t;
    constructor();
}
declare const XXH64_state_t: typeof XXH64_state_s;
export declare class XXH3_state_s {
    acc: any;
    customSecret: any;
    buffer: any;
    bufferedSize: XXH32_hash_t;
    useSeed: XXH32_hash_t;
    nbStripesSoFar: number;
    totalLen: XXH64_hash_t;
    nbStripesPerBlock: number;
    secretLimit: number;
    seed: XXH64_hash_t;
    reserved64: XXH64_hash_t;
    extSecret: any | null;
    constructor();
}
declare const XXH3_state_t: typeof XXH3_state_s;
export declare class _div_t {
    quot: number;
    rem: number;
    constructor();
}
export declare class _ldiv_t {
    quot: number;
    rem: number;
    constructor();
}
export declare class _LDOUBLE {
    ld: any;
    constructor();
}
export declare class _CRT_DOUBLE {
    x: number;
    constructor();
}
export declare class _CRT_FLOAT {
    f: number;
    constructor();
}
export declare class _LONGDOUBLE {
    x: number;
    constructor();
}
export declare class _LDBL12 {
    ld12: any;
    constructor();
}
export declare function _abs64(x: number): number;
export declare class lldiv_t {
    quot: number;
    rem: number;
    constructor();
}
export declare class _heapinfo {
    _pentry: number | null;
    _size: number;
    _useflag: number;
    constructor();
}
export declare function _MarkAllocaS(_Ptr: any, _Marker: number): any | null;
export declare function _freea(_Memory: any | null): void;
export declare function strnlen_s(_src: any, _count: number): number;
export declare function wcsnlen_s(_src: number | null, _count: number): number;
export declare const XXH_aligned: number;
export declare const XXH_unaligned: number;
export declare function XXH_versionNumber(): number;
export declare function XXH32(input: any | null, len: number, seed: XXH32_hash_t): XXH32_hash_t;
export declare function XXH32_createState(): XXH32_state_t | null;
export declare function XXH32_freeState(statePtr: XXH32_state_t | null): XXH_errorcode;
export declare function XXH32_copyState(dstState: XXH32_state_t | null, srcState: XXH32_state_t | null): void;
export declare function XXH32_reset(statePtr: XXH32_state_t | null, seed: XXH32_hash_t): XXH_errorcode;
export declare function XXH32_update(state: XXH32_state_t | null, input: any | null, len: number): XXH_errorcode;
export declare function XXH32_digest(state: XXH32_state_t | null): XXH32_hash_t;
export declare function XXH32_canonicalFromHash(dst: XXH32_canonical_t | null, hash: XXH32_hash_t): void;
export declare function XXH32_hashFromCanonical(src: XXH32_canonical_t | null): XXH32_hash_t;
export declare function XXH64(input: any | null, len: number, seed: XXH64_hash_t): XXH64_hash_t;
export declare function XXH64_createState(): XXH64_state_t | null;
export declare function XXH64_freeState(statePtr: XXH64_state_t | null): XXH_errorcode;
export declare function XXH64_copyState(dstState: XXH64_state_t | null, srcState: XXH64_state_t | null): void;
export declare function XXH64_reset(statePtr: XXH64_state_t | null, seed: XXH64_hash_t): XXH_errorcode;
export declare function XXH64_update(state: XXH64_state_t | null, input: any | null, len: number): XXH_errorcode;
export declare function XXH64_digest(state: XXH64_state_t | null): XXH64_hash_t;
export declare function XXH64_canonicalFromHash(dst: XXH64_canonical_t | null, hash: XXH64_hash_t): void;
export declare function XXH64_hashFromCanonical(src: XXH64_canonical_t | null): XXH64_hash_t;
export declare function XXH3_64bits(input: any | null, length: number): XXH64_hash_t;
export declare function XXH3_64bits_withSecret(input: any | null, length: number, secret: any | null, secretSize: number): XXH64_hash_t;
export declare function XXH3_64bits_withSeed(input: any | null, length: number, seed: XXH64_hash_t): XXH64_hash_t;
export declare function XXH3_64bits_withSecretandSeed(input: any | null, length: number, secret: any | null, secretSize: number, seed: XXH64_hash_t): XXH64_hash_t;
export declare function XXH3_createState(): XXH3_state_t | null;
export declare function XXH3_freeState(statePtr: XXH3_state_t | null): XXH_errorcode;
export declare function XXH3_copyState(dst_state: XXH3_state_t | null, src_state: XXH3_state_t | null): void;
export declare function XXH3_64bits_reset(statePtr: XXH3_state_t | null): XXH_errorcode;
export declare function XXH3_64bits_reset_withSecret(statePtr: XXH3_state_t | null, secret: any | null, secretSize: number): XXH_errorcode;
export declare function XXH3_64bits_reset_withSeed(statePtr: XXH3_state_t | null, seed: XXH64_hash_t): XXH_errorcode;
export declare function XXH3_64bits_reset_withSecretandSeed(statePtr: XXH3_state_t | null, secret: any, secretSize: number, seed64: XXH64_hash_t): XXH_errorcode;
export declare function XXH3_64bits_update(state: XXH3_state_t | null, input: any | null, len: number): XXH_errorcode;
export declare function XXH3_64bits_digest(state: XXH3_state_t | null): XXH64_hash_t;
export declare function XXH3_128bits(input: any | null, len: number): XXH128_hash_t;
export declare function XXH3_128bits_withSecret(input: any | null, len: number, secret: any | null, secretSize: number): XXH128_hash_t;
export declare function XXH3_128bits_withSeed(input: any | null, len: number, seed: XXH64_hash_t): XXH128_hash_t;
export declare function XXH3_128bits_withSecretandSeed(input: any | null, len: number, secret: any | null, secretSize: number, seed: XXH64_hash_t): XXH128_hash_t;
export declare function XXH128(input: any | null, len: number, seed: XXH64_hash_t): XXH128_hash_t;
export declare function XXH3_128bits_reset(statePtr: XXH3_state_t | null): XXH_errorcode;
export declare function XXH3_128bits_reset_withSecret(statePtr: XXH3_state_t | null, secret: any | null, secretSize: number): XXH_errorcode;
export declare function XXH3_128bits_reset_withSeed(statePtr: XXH3_state_t | null, seed: XXH64_hash_t): XXH_errorcode;
export declare function XXH3_128bits_reset_withSecretandSeed(statePtr: XXH3_state_t | null, secret: any | null, secretSize: number, seed: XXH64_hash_t): XXH_errorcode;
export declare function XXH3_128bits_update(state: XXH3_state_t | null, input: any | null, len: number): XXH_errorcode;
export declare function XXH3_128bits_digest(state: XXH3_state_t | null): XXH128_hash_t;
export declare function XXH128_isEqual(h1: XXH128_hash_t, h2: XXH128_hash_t): number;
export declare function XXH128_cmp(h128_1: any | null, h128_2: any | null): number;
export declare function XXH128_canonicalFromHash(dst: XXH128_canonical_t | null, hash: XXH128_hash_t): void;
export declare function XXH128_hashFromCanonical(src: XXH128_canonical_t | null): XXH128_hash_t;
export declare function XXH3_generateSecret(secretBuffer: any | null, secretSize: number, customSeed: any | null, customSeedSize: number): XXH_errorcode;
export declare function XXH3_generateSecret_fromSeed(secretBuffer: any, seed: XXH64_hash_t): void;
export {};
