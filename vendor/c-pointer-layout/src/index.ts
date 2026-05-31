// Basalt — TypeScript Semantic Runtime Core
// The foundational substrate for hosting translated C/C++ programs.

// Memory: CPtr pointer model + heap allocator
export {
  type CPtr,
  NULLPTR,
  isNull,
  create,
  fromBuffer,
  fromString,
  add,
  addScaled,
  sub,
  diff,
  diffScaled,
  eq,
  lt,
  le,
  readByte,
  writeByte,
  readInt8,
  writeInt8,
  readUint8,
  writeUint8,
  readInt16,
  writeInt16,
  readUint16,
  writeUint16,
  readInt32,
  writeInt32,
  readUint32,
  writeUint32,
  readFloat32,
  writeFloat32,
  readFloat64,
  writeFloat64,
  toString,
  strlen,
  memcpy,
  memset,
  memcmp,
  clone
} from "./memory/cptr.js";

export { Heap, type AllocationInfo } from "./memory/heap.js";

// Numeric: C integer/float semantics
export {
  INT8_MIN, INT8_MAX, UINT8_MAX,
  INT16_MIN, INT16_MAX, UINT16_MAX,
  INT32_MIN, INT32_MAX, UINT32_MAX,
  INT64_MIN, INT64_MAX, UINT64_MAX,
  toInt8, toInt16, toInt32,
  toUint8, toUint16, toUint32,
  toFloat32,
  addInt32, subInt32, mulInt32,
  addUint32, subUint32, mulUint32,
  divInt32, modInt32, divUint32, modUint32,
  shl32, shr32, shrUnsigned32,
  bitwiseAnd32, bitwiseOr32, bitwiseXor32, bitwiseNot32,
  floatToInt32, floatToUint32,
  fitsInt32, fitsUint32,
  cBool, boolToInt
} from "./numeric/types.js";

// Numeric: int64_t / uint64_t via BigInt (C17 §6.2.5 ¶6–¶9)
export {
  I64_MIN, I64_MAX, U64_MAX,
  i64, u64,
  i64_add, i64_sub, i64_mul, i64_div, i64_mod, i64_neg,
  u64_add, u64_sub, u64_mul, u64_div, u64_mod,
  i64_shl, i64_shr, i64_sar,
  i64_and, i64_or, i64_xor, i64_not,
  i64_to_number, number_to_i64, i64_to_u64, u64_to_i64,
  i64_take_warning,
  cptr_read_int64, cptr_write_int64,
  cptr_read_uint64, cptr_write_uint64
} from "./numeric/int64.js";

// Numeric: long double (graceful degradation — see module NOTE)
export {
  LONG_DOUBLE_EPSILON, LONG_DOUBLE_MAX, LONG_DOUBLE_MIN, LONG_DOUBLE_SIZE,
  long_double_precision_ok, long_double_diagnose, long_double_drain_warnings,
  cptr_read_long_double, cptr_write_long_double
} from "./numeric/long-double.js";

// Numeric: C99 _Complex (<complex.h>, C17 §7.3)
export {
  type Complex,
  I, COMPLEX_SIZE,
  complex,
  c_creal, c_cimag, c_conj, c_cabs, c_carg, c_cproj,
  c_cadd, c_csub, c_cmul, c_cdiv, c_cneg,
  c_cexp, c_clog, c_cpow, c_csqrt,
  c_csin, c_ccos, c_ctan, c_casin, c_cacos, c_catan,
  c_csinh, c_ccosh, c_ctanh, c_casinh, c_cacosh, c_catanh,
  c_cexpf, c_cexpl, c_clogf, c_clogl, c_cpowf, c_cpowl, c_csqrtf, c_csqrtl,
  c_csinf, c_csinl, c_ccosf, c_ccosl, c_ctanf, c_ctanl,
  c_casinf, c_casinl, c_cacosf, c_cacosl, c_catanf, c_catanl,
  c_csinhf, c_csinhl, c_ccoshf, c_ccoshl, c_ctanhf, c_ctanhl,
  c_casinhf, c_casinhl, c_cacoshf, c_cacoshl, c_catanhf, c_catanhl,
  c_cabsf, c_cabsl, c_cargf, c_cargl, c_conjf, c_conjl, c_cprojf, c_cprojl,
  c_crealf, c_creall, c_cimagf, c_cimagl,
  cptr_read_complex, cptr_write_complex
} from "./numeric/complex.js";

// GCC/MSVC Extensions: __int128 / unsigned __int128 via BigInt
export {
  I128_MIN, I128_MAX, U128_MAX,
  i128, u128,
  i128_add, i128_sub, i128_mul, i128_div, i128_mod, i128_neg,
  u128_add, u128_sub, u128_mul, u128_div, u128_mod,
  i128_shl, i128_shr, i128_sar,
  i128_and, i128_or, i128_xor, i128_not,
  i128_to_number, number_to_i128,
  i128_to_u128, u128_to_i128, i128_to_i64,
  i128_take_warning,
  cptr_read_int128, cptr_write_int128,
  cptr_read_uint128, cptr_write_uint128
} from "./numeric/int128.js";

// SIMD (opaque): Intel/AMD vector type tags (__m64/__m128/__m256/__m512)
export {
  type M64, type M128, type M256, type M512,
  m64_zero, m128_zero, m256_zero, m512_zero,
  m128_load_float32x4, m128_store_float32x4,
  m128_load_float64x2, m128_store_float64x2,
  m128_load_int32x4, m128_store_int32x4,
  m128_load_int64x2, m128_store_int64x2,
  m256_load_float32x8, m256_store_float32x8,
  m256_load_float64x4, m256_store_float64x4,
  m256_load_int32x8, m256_store_int32x8,
  m128_add_float32x4, m128_mul_float32x4,
  m256_add_float32x8
} from "./numeric/simd.js";

// Struct Layout: attributes (packed / aligned / vector_size / may_alias)
export {
  type LayoutAttribute, type AttrField, type PackedLayoutResult,
  DEFAULT_ATTRIBUTES,
  parseLayoutAttributes,
  computePackedLayout,
  offsetOfPacked
} from "./layout/attributes.js";

// Struct Layout: bit-fields (C17 §6.7.2.1 ¶10–¶12)
export {
  type BitField, type BitFieldOffset, type BitFieldLayout,
  computeBitFieldLayout,
  readBitField, writeBitField
} from "./layout/bitfields.js";

// Struct Layout: __builtin_offsetof precise implementation
export {
  type OffsetField,
  register_alignof, register_struct, clear_registered_structs,
  alignof_type, sizeof_type,
  builtin_offsetof
} from "./layout/offsetof.js";

// Layout: struct/union layout computation
export {
  type FieldType, type FieldLayout, type StructLayout,
  CHAR, INT8, UINT8, INT16, UINT16, INT32, UINT32,
  INT64, UINT64, FLOAT, DOUBLE, PTR,
  arrayType, structType,
  alignUp,
  computeStructLayout, computeUnionLayout, offsetof
} from "./layout/struct.js";

// Runtime: shared execution context
export { Runtime, ExitSignal } from "./runtime.js";
