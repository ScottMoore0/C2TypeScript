/**
 * ts-mtwister - TypeScript port of ESultanik/mtwister (Mersenne Twister PRNG
 * with the *6069 LCG seeding constant). For canonical MT19937 see ts-mt19937.
 *
 * Public API facade - re-exports only the user-facing symbols and hides
 * internal runtime shims (cptr_*, __cpp_*, __safe_*, __struct_ptr_at, etc.)
 * emitted by the C-to-TypeScript translator.
 */

export {
  seedRand,
  genRandLong,
  genRand,
  tagMTRand,
} from './mtwister.js';
