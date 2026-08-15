/**
 * ts-pcg-basic -- TypeScript port of pcg-c-basic
 *
 * A zero-dependency TypeScript implementation of the PCG (Permuted
 * Congruential Generator) basic C library by Melissa O'Neill.
 * See https://www.pcg-random.org for details on the PCG family.
 */

export {
  pcg_state_setseq_64,
  pcg32_srandom_r,
  pcg32_srandom,
  pcg32_random_r,
  pcg32_random,
  pcg32_boundedrand_r,
  pcg32_boundedrand,
} from './pcg_basic.js';
