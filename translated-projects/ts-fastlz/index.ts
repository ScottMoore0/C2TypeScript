/**
 * ts-fastlz
 *
 * TypeScript port of FastLZ, a lightning-fast lossless compression library.
 * Original C version copyright (c) 2005-2020 Ariya Hidayat.
 * TypeScript translation copyright (c) 2026 Scott Moore.
 * Licensed under the MIT License.
 */

export {
  fastlz_compress,
  fastlz_compress_level,
  fastlz_decompress,
} from './fastlz.js';
