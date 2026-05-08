/**
 * ts-fnv-hash
 *
 * A zero-dependency TypeScript port of the Fowler-Noll-Vo (FNV) hash
 * by Landon Curt Noll. Provides FNV-1 32-bit and 64-bit hashing for
 * both byte buffers and strings.
 *
 * Original C: public domain.
 * TypeScript translation: copyright (c) 2026 Scott Moore, released
 * into the public domain under the Unlicense.
 *
 * See: http://www.isthe.com/chongo/tech/comp/fnv/
 */

// 32-bit FNV API
export {
  fnv_32_buf,
  fnv_32_str,
  Fnv64_t,
  fnv_type,
  FNV_NONE,
  FNV0_32,
  FNV1_32,
  FNV1a_32,
  FNV0_64,
  FNV1_64,
  FNV1a_64,
} from './hash_32.js';

// 64-bit FNV API and seed constants
export {
  fnv_64_buf,
  fnv_64_str,
  fnv0_64_init,
  fnv1_64_init,
} from './hash_64.js';

// 32-bit FNV seed constants (from the FNV reference)
export const FNV1_32_INIT: number = 0x811c9dc5;
export const FNV1_32A_INIT: number = 0x811c9dc5;
export const FNV0_32_INIT: number = 0;
export const FNV_32_PRIME: number = 0x01000193;
