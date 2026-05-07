/**
 * ts-mt19937 - TypeScript port of the canonical Matsumoto/Nishimura
 * MT19937 Mersenne Twister reference C implementation (mt19937ar.c).
 *
 * This is the textbook "improved 2002/1/26" version with the
 * 1812433253 seeding constant, producing the canonical reference
 * outputs (3499211612, 581869302, 3890346734, 3586334585, 545404204,
 * ...) for init_genrand(5489).
 *
 * Public API: the eight functions documented in the upstream header.
 * Internal CPtr/runtime helpers (cptr_*, __safe_*, __cpp_*) are not
 * re-exported.
 */

export {
  init_genrand,
  init_by_array,
  genrand_int32,
  genrand_int31,
  genrand_real1,
  genrand_real2,
  genrand_real3,
  genrand_res53,
} from './mt19937ar.js';
