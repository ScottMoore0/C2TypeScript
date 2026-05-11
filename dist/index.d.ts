/**
 * ts-xxhash
 *
 * A zero-dependency TypeScript port of xxHash, the fast
 * non-cryptographic hash algorithm by Yann Collet. Provides XXH32,
 * XXH64, and XXH3 (64-bit and 128-bit) hashing for byte buffers and
 * supports both one-shot and streaming (state-based) APIs.
 *
 * Original C: copyright (c) 2012-2021 Yann Collet, BSD-2-Clause.
 * TypeScript translation: copyright (c) 2026 Scott Moore, released
 * under the same BSD-2-Clause license.
 *
 * See: https://github.com/Cyan4973/xxHash
 */
export { XXH32, XXH64, XXH3_64bits, XXH3_64bits_withSeed, XXH3_64bits_withSecret, XXH3_64bits_withSecretandSeed, XXH3_128bits, XXH3_128bits_withSeed, XXH3_128bits_withSecret, XXH3_128bits_withSecretandSeed, XXH128, } from './xxhash.js';
export { XXH32_createState, XXH32_freeState, XXH32_copyState, XXH32_reset, XXH32_update, XXH32_digest, XXH32_canonicalFromHash, XXH32_hashFromCanonical, } from './xxhash.js';
export { XXH64_createState, XXH64_freeState, XXH64_copyState, XXH64_reset, XXH64_update, XXH64_digest, XXH64_canonicalFromHash, XXH64_hashFromCanonical, } from './xxhash.js';
export { XXH3_createState, XXH3_freeState, XXH3_copyState, XXH3_64bits_reset, XXH3_64bits_reset_withSeed, XXH3_64bits_reset_withSecret, XXH3_64bits_reset_withSecretandSeed, XXH3_64bits_update, XXH3_64bits_digest, XXH3_128bits_reset, XXH3_128bits_reset_withSeed, XXH3_128bits_reset_withSecret, XXH3_128bits_reset_withSecretandSeed, XXH3_128bits_update, XXH3_128bits_digest, } from './xxhash.js';
export { XXH128_isEqual, XXH128_cmp, XXH128_canonicalFromHash, XXH128_hashFromCanonical, XXH3_generateSecret, XXH3_generateSecret_fromSeed, } from './xxhash.js';
export { XXH32_state_s, XXH64_state_s, XXH3_state_s, XXH32_canonical_t, XXH64_canonical_t, XXH128_canonical_t, XXH128_hash_t, } from './xxhash.js';
export { XXH_versionNumber } from './xxhash.js';
export declare const XXH_OK: number;
export declare const XXH_ERROR: number;
