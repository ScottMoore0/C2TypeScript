/**
 * ts-rxi-vec - TypeScript port of rxi/vec
 *
 * The upstream rxi/vec library is a header-only C macro library; this
 * package is the output of an automated C-to-TypeScript translator
 * applied to a driver TU that pre-instantiates the public macro set
 * across six element types (int, unsigned int, float, double, char*,
 * void*). The translation is faithful to the original semantics; the
 * surface here is a stable typed-vector wrapper API (init, push, pop,
 * sort, find, etc.) per element type, plus the underlying vec_*_t
 * struct classes.
 *
 * Original C version copyright (c) 2014 rxi.
 * TypeScript translation copyright (c) 2026 Scott Moore.
 * Licensed under the MIT License.
 */

// ----------------------------- vector struct types -----------------------------
export {
  vec_int_t,
  vec_uint_t,
  vec_double_t,
  vec_float_t,
  vec_str_t,
  vec_void_t,
  vec_char_t,
} from "./driver.js";

// ----------------------------- vec_int_t wrappers -----------------------------
export {
  rxi_vec_int_init,
  rxi_vec_int_deinit,
  rxi_vec_int_push,
  rxi_vec_int_pop,
  rxi_vec_int_length,
  rxi_vec_int_capacity,
  rxi_vec_int_get,
  rxi_vec_int_set,
  rxi_vec_int_first,
  rxi_vec_int_last,
  rxi_vec_int_insert,
  rxi_vec_int_splice,
  rxi_vec_int_swapsplice,
  rxi_vec_int_swap,
  rxi_vec_int_truncate,
  rxi_vec_int_clear,
  rxi_vec_int_reserve,
  rxi_vec_int_compact,
  rxi_vec_int_pusharr,
  rxi_vec_int_extend,
  rxi_vec_int_find,
  rxi_vec_int_remove,
  rxi_vec_int_reverse,
  rxi_vec_int_sort,
  rxi_vec_int_sum,
  rxi_vec_int_sum_rev,
} from "./driver.js";

// ----------------------------- vec_uint_t wrappers -----------------------------
export {
  rxi_vec_uint_init,
  rxi_vec_uint_deinit,
  rxi_vec_uint_push,
  rxi_vec_uint_pop,
  rxi_vec_uint_length,
  rxi_vec_uint_capacity,
  rxi_vec_uint_get,
  rxi_vec_uint_set,
  rxi_vec_uint_first,
  rxi_vec_uint_last,
  rxi_vec_uint_insert,
  rxi_vec_uint_splice,
  rxi_vec_uint_swapsplice,
  rxi_vec_uint_swap,
  rxi_vec_uint_truncate,
  rxi_vec_uint_clear,
  rxi_vec_uint_reserve,
  rxi_vec_uint_compact,
  rxi_vec_uint_pusharr,
  rxi_vec_uint_extend,
  rxi_vec_uint_find,
  rxi_vec_uint_remove,
  rxi_vec_uint_reverse,
  rxi_vec_uint_sort,
} from "./driver.js";

// ----------------------------- vec_double_t wrappers -----------------------------
export {
  rxi_vec_double_init,
  rxi_vec_double_deinit,
  rxi_vec_double_push,
  rxi_vec_double_pop,
  rxi_vec_double_length,
  rxi_vec_double_capacity,
  rxi_vec_double_get,
  rxi_vec_double_set,
  rxi_vec_double_first,
  rxi_vec_double_last,
  rxi_vec_double_insert,
  rxi_vec_double_splice,
  rxi_vec_double_swapsplice,
  rxi_vec_double_swap,
  rxi_vec_double_truncate,
  rxi_vec_double_clear,
  rxi_vec_double_reserve,
  rxi_vec_double_compact,
  rxi_vec_double_pusharr,
  rxi_vec_double_extend,
  rxi_vec_double_find,
  rxi_vec_double_remove,
  rxi_vec_double_reverse,
  rxi_vec_double_sort,
  rxi_vec_double_sum,
} from "./driver.js";

// ----------------------------- vec_float_t wrappers -----------------------------
export {
  rxi_vec_float_init,
  rxi_vec_float_deinit,
  rxi_vec_float_push,
  rxi_vec_float_pop,
  rxi_vec_float_length,
  rxi_vec_float_capacity,
  rxi_vec_float_get,
  rxi_vec_float_set,
  rxi_vec_float_first,
  rxi_vec_float_last,
  rxi_vec_float_insert,
  rxi_vec_float_splice,
  rxi_vec_float_swapsplice,
  rxi_vec_float_swap,
  rxi_vec_float_truncate,
  rxi_vec_float_clear,
  rxi_vec_float_reserve,
  rxi_vec_float_compact,
  rxi_vec_float_pusharr,
  rxi_vec_float_extend,
  rxi_vec_float_find,
  rxi_vec_float_remove,
  rxi_vec_float_reverse,
  rxi_vec_float_sort,
} from "./driver.js";

// ----------------------------- vec_str_t wrappers -----------------------------
export {
  rxi_vec_str_init,
  rxi_vec_str_deinit,
  rxi_vec_str_push,
  rxi_vec_str_pop,
  rxi_vec_str_length,
  rxi_vec_str_capacity,
  rxi_vec_str_get,
  rxi_vec_str_set,
  rxi_vec_str_first,
  rxi_vec_str_last,
  rxi_vec_str_insert,
  rxi_vec_str_splice,
  rxi_vec_str_swapsplice,
  rxi_vec_str_swap,
  rxi_vec_str_truncate,
  rxi_vec_str_clear,
  rxi_vec_str_reserve,
  rxi_vec_str_compact,
  rxi_vec_str_pusharr,
  rxi_vec_str_extend,
  rxi_vec_str_find,
  rxi_vec_str_remove,
  rxi_vec_str_reverse,
  rxi_vec_str_sort,
} from "./driver.js";

// ----------------------------- vec_void_t wrappers -----------------------------
// Note: no rxi_vec_void_sort - void* has no canonical comparator.
export {
  rxi_vec_void_init,
  rxi_vec_void_deinit,
  rxi_vec_void_push,
  rxi_vec_void_pop,
  rxi_vec_void_length,
  rxi_vec_void_capacity,
  rxi_vec_void_get,
  rxi_vec_void_set,
  rxi_vec_void_first,
  rxi_vec_void_last,
  rxi_vec_void_insert,
  rxi_vec_void_splice,
  rxi_vec_void_swapsplice,
  rxi_vec_void_swap,
  rxi_vec_void_truncate,
  rxi_vec_void_clear,
  rxi_vec_void_reserve,
  rxi_vec_void_compact,
  rxi_vec_void_pusharr,
  rxi_vec_void_extend,
  rxi_vec_void_find,
  rxi_vec_void_remove,
  rxi_vec_void_reverse,
} from "./driver.js";

// ----------------------------- combined smoke entry -----------------------------
export { rxi_vec_smoke } from "./driver.js";
