/**
 * ts-sds
 *
 * TypeScript port of sds (Simple Dynamic Strings), a string library for C
 * originally written for Redis by Salvatore Sanfilippo.
 * Original C version copyright (c) 2006-2015, Salvatore Sanfilippo <antirez at gmail dot com>.
 * TypeScript translation copyright (c) 2026 Scott Moore.
 * Licensed under the BSD 2-Clause License.
 */

// Header struct types (BRIDGE: struct-as-class).
export {
  sdshdr5,
  sdshdr8,
  sdshdr16,
  sdshdr32,
  sdshdr64,
} from './sds.js';

// Core constructors and lifecycle.
export {
  SDS_NOINIT,
  sdsnewlen,
  sdsempty,
  sdsnew,
  sdsdup,
  sdsfree,
} from './sds.js';

// Header-inline length / capacity inspectors (sds.h `static inline`).
// These are the hot-path read accessors used everywhere in the C version.
export {
  sdslen,
  sdsavail,
  sdssetlen,
  sdsinclen,
  sdsalloc,
  sdssetalloc,
} from './sds.js';

// Length / capacity management.
export {
  sdsupdatelen,
  sdsclear,
  sdsMakeRoomFor,
  sdsRemoveFreeSpace,
  sdsAllocSize,
  sdsAllocPtr,
  sdsIncrLen,
  sdsgrowzero,
} from './sds.js';

// Concatenation, copy, formatting.
export {
  sdscatlen,
  sdscat,
  sdscatsds,
  sdscpylen,
  sdscpy,
  sdsll2str,
  sdsull2str,
  sdsfromlonglong,
  sdscatvprintf,
  sdscatprintf,
  sdscatfmt,
} from './sds.js';

// Trimming, ranges, case conversion, comparison.
export {
  sdstrim,
  sdsrange,
  sdstolower,
  sdstoupper,
  sdscmp,
} from './sds.js';

// Splitting, joining, escaping, character mapping.
export {
  sdssplitlen,
  sdsfreesplitres,
  sdscatrepr,
  sdssplitargs,
  sdsmapchars,
  sdsjoin,
  sdsjoinsds,
} from './sds.js';

// Allocator hooks (sds_malloc/realloc/free).
export {
  sds_malloc,
  sds_realloc,
  sds_free,
} from './sds.js';

// Hex helpers used by sdssplitargs.
export {
  is_hex_digit,
  hex_digit_to_int,
} from './sds.js';
