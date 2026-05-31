// Forge — C Runtime in TypeScript

// stdio — formatting (C17 §7.21.6)
export {
  formatPrintf, sprintf, snprintf,
  c_strfromf, c_strfromd, c_strfroml
} from "./stdio/printf.js";
export { sscanf, type ScanResult } from "./stdio/scanf.js";

// stdio — file I/O (C17 §7.21)
export {
  type CFile,
  c_stdout, c_stderr, c_stdin,
  c_fopen, c_freopen, c_fclose, c_fflush,
  c_fread, c_fwrite,
  c_fgetc, c_fputc, c_getc, c_putc, c_ungetc,
  c_fgets, c_fputs,
  SEEK_SET, SEEK_CUR, SEEK_END,
  c_fseek, c_ftell, c_rewind,
  c_clearerr, c_feof, c_ferror,
  c_fprintf, c_printf,
  c_remove, c_rename, c_tmpfile, c_perror,
  c_puts, c_putchar, c_getchar,
  _IOFBF, _IOLBF, _IONBF, c_setbuf, c_setvbuf,
  c_vfprintf, c_vprintf, c_vsprintf, c_vsnprintf,
  c_fgetpos, c_fsetpos, c_tmpnam,
  c_sscanf, c_fscanf, c_vfscanf, c_vsscanf, sscanfWithConsumed,
  type FileVfs, mountVfs,
  type MemStream, c_fmemopen, c_open_memstream
} from "./stdio/file.js";

// string (C17 §7.24)
export {
  type CPtr,
  c_strlen, c_strcpy, c_strncpy, c_strcat, c_strncat,
  c_strcmp, c_strncmp, c_strchr, c_strrchr, c_strstr,
  c_memcpy, c_memmove, c_memset, c_memcmp,
  c_fromString, c_toString,
  c_strtok, c_strtok_r, c_strpbrk, c_strspn, c_strcspn, c_memchr,
  c_strerror, c_strdup, c_strndup,
  c_strxfrm, c_strcoll,
  c_memccpy, c_memrchr, c_strchrnul, c_stpcpy, c_stpncpy,
  c_bcmp, c_bcopy, c_bzero
} from "./string/string.js";

// stdlib (C17 §7.22)
export {
  c_atoi, c_atof, c_atol, c_atoll,
  c_strtol, c_strtod, c_strtof, c_strtold, c_strtoul, c_strtoll, c_strtoull,
  c_abs, c_labs, c_llabs,
  c_srand, c_rand, c_rand_r, RAND_MAX,
  c_qsort, c_bsearch,
  c_div, c_ldiv, c_lldiv,
  c_abort, c_exit, c__Exit, c_quick_exit,
  c_atexit, c_at_quick_exit,
  c_getenv, c_system, setShellAllowed,
  c_mblen, c_mbtowc, c_wctomb, c_mbstowcs, c_wcstombs,
  errno, setErrno, EDOM, ERANGE, EILSEQ, ENOENT, EACCES, EEXIST, EINVAL, ENOMEM, EIO,
  SIGABRT, SIGFPE, SIGILL, SIGINT, SIGSEGV, SIGTERM, SIG_DFL,
  c_signal, c_raise
} from "./stdlib/stdlib.js";

// math (C17 §7.12)
export {
  M_PI, M_E, M_LN2, M_LN10, M_SQRT2, HUGE_VAL, INFINITY, NAN,
  c_sin, c_cos, c_tan, c_asin, c_acos, c_atan, c_atan2,
  c_sinh, c_cosh, c_tanh, c_asinh, c_acosh, c_atanh,
  c_exp, c_log, c_log10, c_log2, c_exp2, c_expm1, c_log1p,
  c_sqrt, c_pow, c_cbrt, c_hypot,
  c_ceil, c_floor, c_round, c_trunc,
  c_fabs, c_fmod, c_fmodf, c_fmin, c_fmax,
  c_isnan, c_isinf, c_isfinite,
  c_sinf, c_cosf, c_sqrtf, c_powf, c_fabsf, c_ceilf, c_floorf,
  c_remainder, c_remquo, c_fma, c_fdim, c_nan,
  c_frexp, c_ldexp, c_modf, c_scalbn, c_scalbln, c_ilogb, c_logb,
  c_nextafter, c_nexttoward, c_copysign,
  c_nearbyint, c_rint, c_lrint, c_llrint, c_lround, c_llround,
  c_fpclassify, c_isnormal, c_signbit,
  c_erf, c_erfc, c_tgamma, c_lgamma
} from "./math/math.js";

// ctype (C17 §7.4) — COMPLETE (all 14 functions)
export {
  c_isalnum, c_isalpha, c_isdigit, c_islower, c_isupper,
  c_isspace, c_isprint, c_ispunct, c_isxdigit,
  c_tolower, c_toupper,
  c_isblank, c_iscntrl, c_isgraph
} from "./ctype/ctype.js";

// time (C17 §7.27) — COMPLETE (all 10 functions)
export {
  CLOCKS_PER_SEC, type CTime,
  c_time, c_clock, c_difftime,
  c_localtime, c_gmtime, c_mktime, c_strftime,
  c_asctime, c_ctime, c_timespec_get
} from "./time/time.js";

// locale (C17 §7.11) — COMPLETE
export {
  LC_ALL, LC_COLLATE, LC_CTYPE, LC_MONETARY, LC_NUMERIC, LC_TIME,
  c_setlocale, c_localeconv
} from "./locale/locale.js";

// setjmp (C17 §7.13) — COMPLETE (+ POSIX sigsetjmp/siglongjmp)
export {
  type JmpBuf, type SigJmpBuf, LongjmpSignal,
  c_setjmp, c_longjmp,
  c_sigsetjmp, c_siglongjmp
} from "./setjmp/setjmp.js";

// fenv (C17 §7.6) — COMPLETE
export {
  FE_DIVBYZERO, FE_INEXACT, FE_INVALID, FE_OVERFLOW, FE_UNDERFLOW, FE_ALL_EXCEPT,
  FE_TONEAREST, FE_DOWNWARD, FE_UPWARD, FE_TOWARDZERO,
  c_feclearexcept, c_feraiseexcept, c_fetestexcept,
  c_fegetexceptflag, c_fesetexceptflag,
  c_fegetround, c_fesetround,
  type FEnv, type FExcept,
  c_fegetenv, c_fesetenv, c_feholdexcept, c_feupdateenv,
  __cpp_fenv_add, __cpp_fenv_sub, __cpp_fenv_mul, __cpp_fenv_div,
  __cpp_fenv_reset
} from "./fenv/fenv.js";

// compatibility headers (iso646, stdbool, stdalign, stdnoreturn)
export { c_true, c_false } from "./compat/compat.js";

// assert (C17 §7.2) — COMPLETE
export { c_assert } from "./assert/assert.js";

// limits/float/stdint/inttypes (C17 §5.2.4.2, §7.8, §7.20) — COMPLETE
export {
  CHAR_BIT, CHAR_MIN, CHAR_MAX, SCHAR_MIN, SCHAR_MAX, UCHAR_MAX,
  SHRT_MIN, SHRT_MAX, USHRT_MAX,
  INT_MIN, INT_MAX, UINT_MAX,
  LONG_MIN, LONG_MAX, ULONG_MAX,
  LLONG_MIN, LLONG_MAX, ULLONG_MAX,
  FLT_EPSILON, FLT_MIN, FLT_MAX, FLT_RADIX, FLT_DIG, FLT_MANT_DIG,
  FLT_MIN_EXP, FLT_MAX_EXP, FLT_MIN_10_EXP, FLT_MAX_10_EXP,
  DBL_EPSILON, DBL_MIN, DBL_MAX, DBL_DIG, DBL_MANT_DIG,
  DBL_MIN_EXP, DBL_MAX_EXP, DBL_MIN_10_EXP, DBL_MAX_10_EXP,
  LDBL_EPSILON, LDBL_MIN, LDBL_MAX, LDBL_DIG, LDBL_MANT_DIG,
  INT8_MIN, INT8_MAX, UINT8_MAX,
  INT16_MIN, INT16_MAX, UINT16_MAX,
  INT32_MIN, INT32_MAX, UINT32_MAX,
  INT64_MIN, INT64_MAX,
  SIZE_MAX, PTRDIFF_MIN, PTRDIFF_MAX, INTPTR_MIN, INTPTR_MAX, UINTPTR_MAX,
  INTMAX_MIN, INTMAX_MAX,
  c_imaxabs, c_imaxdiv, c_strtoimax, c_strtoumax
} from "./limits/limits.js";

// wchar (C17 §7.29) — wide-character I/O, string, conversion, numeric parsing
export {
  type MbState, type WcsTokState,
  mb_initState,
  c_wcslen, c_wcscpy, c_wcsncpy, c_wcscat, c_wcsncat,
  c_wcscmp, c_wcsncmp, c_wcscoll, c_wcsxfrm,
  c_wcschr, c_wcsrchr, c_wcsstr, c_wcspbrk, c_wcsspn, c_wcscspn,
  c_wcstok, c_wcsdup,
  c_wmemcpy, c_wmemmove, c_wmemcmp, c_wmemchr, c_wmemset,
  c_wcstol, c_wcstoll, c_wcstoul, c_wcstoull,
  c_wcstod, c_wcstof, c_wcstold,
  c_btowc, c_wctob, c_mbsinit,
  c_mbrlen, c_mbrtowc, c_wcrtomb, c_mbsrtowcs, c_wcsrtombs,
  c_fwide, c_fwprintf, c_wprintf, c_swprintf,
  c_vfwprintf, c_vswprintf, c_vwprintf,
  c_fputwc, c_putwc, c_putwchar, c_fputws,
  c_fgetwc, c_getwc, c_getwchar, c_fgetws, c_ungetwc,
  w_fromString, w_toString
} from "./wchar/wchar.js";

// wctype (C17 §7.30) — wide-character classification and conversion
export {
  WEOF, type WCType, type WCTrans,
  c_iswalnum, c_iswalpha, c_iswblank, c_iswcntrl, c_iswdigit,
  c_iswgraph, c_iswlower, c_iswprint, c_iswpunct,
  c_iswspace, c_iswupper, c_iswxdigit,
  c_towlower, c_towupper,
  c_wctype, c_iswctype, c_wctrans, c_towctrans
} from "./wctype/wctype.js";

// uchar (C17 §7.28) — char16_t/char32_t conversion functions
export {
  type MbState as UcharMbState,
  c_mbstate_init,
  c_mbrtoc16, c16rtomb, c_mbrtoc32, c32rtomb
} from "./uchar/uchar.js";

// stdatomic (C17 §7.17)
export {
  memory_order_relaxed, memory_order_consume, memory_order_acquire,
  memory_order_release, memory_order_acq_rel, memory_order_seq_cst,
  type memory_order,
  type AtomicFlag, ATOMIC_FLAG_INIT, ATOMIC_VAR_INIT,
  atomic_init, atomic_thread_fence, atomic_signal_fence, atomic_is_lock_free,
  atomic_store, atomic_store_explicit,
  atomic_load, atomic_load_explicit,
  atomic_exchange, atomic_exchange_explicit,
  atomic_compare_exchange_strong, atomic_compare_exchange_weak,
  atomic_compare_exchange_strong_explicit, atomic_compare_exchange_weak_explicit,
  atomic_fetch_add, atomic_fetch_sub, atomic_fetch_or, atomic_fetch_xor, atomic_fetch_and,
  atomic_flag_test_and_set, atomic_flag_test_and_set_explicit,
  atomic_flag_clear, atomic_flag_clear_explicit,
  kill_dependency
} from "./atomic/atomic.js";

// complex (C17 §7.3) — complex-number arithmetic
export {
  type CComplex,
  c_CMPLX, c_CMPLXF, c_CMPLXL,
  c_cabs, c_cabsf, c_cabsl,
  c_carg, c_cargf, c_cargl,
  c_cimag, c_cimagf, c_cimagl,
  c_conj, c_conjf, c_conjl,
  c_cproj, c_cprojf, c_cprojl,
  c_creal, c_crealf, c_creall,
  c_cexp, c_cexpf, c_cexpl,
  c_clog, c_clogf, c_clogl,
  c_cpow, c_cpowf, c_cpowl,
  c_csqrt, c_csqrtf, c_csqrtl,
  c_csin, c_csinf, c_csinl,
  c_ccos, c_ccosf, c_ccosl,
  c_ctan, c_ctanf, c_ctanl,
  c_csinh, c_csinhf, c_csinhl,
  c_ccosh, c_ccoshf, c_ccoshl,
  c_ctanh, c_ctanhf, c_ctanhl,
  c_cacos, c_cacosf, c_cacosl,
  c_casin, c_casinf, c_casinl,
  c_catan, c_catanf, c_catanl,
  c_cacosh, c_cacoshf, c_cacoshl,
  c_casinh, c_casinhf, c_casinhl,
  c_catanh, c_catanhf, c_catanhl,
  c_cnorm, c_cnormf, c_cnorml
} from "./complex/complex.js";

// Annex K (C17 §K.3) — bounds-checking interfaces (`_s` functions)
export {
  type rsize_t, type errno_t, RSIZE_MAX,
  type constraint_handler_t, __annex_k_violations, __annex_k_default_handler,
  __annex_k_reset_violations,
  set_constraint_handler_s, abort_handler_s, ignore_handler_s,
  // §K.3.7 string
  memcpy_s, memmove_s, strcpy_s, strncpy_s, strcat_s, strncat_s,
  strtok_s, strerror_s, strerrorlen_s, strnlen_s, memset_s,
  // §K.3.5 stdio
  tmpfile_s, tmpnam_s, fopen_s, freopen_s,
  printf_s, fprintf_s, vprintf_s, vfprintf_s,
  sprintf_s, snprintf_s, vsnprintf_s,
  scanf_s, fscanf_s, sscanf_s, vscanf_s, vfscanf_s, vsscanf_s,
  gets_s,
  // §K.3.6 stdlib
  getenv_s, bsearch_s, qsort_s, mbstowcs_s, wcstombs_s,
  // §K.3.8 time
  gmtime_s, localtime_s, asctime_s, ctime_s,
  // §K.3.9 wchar
  wmemcpy_s, wmemmove_s, wcscpy_s, wcsncpy_s, wcscat_s, wcsncat_s,
  wcsnlen_s, wcstok_s, wcrtomb_s, mbsrtowcs_s, wcsrtombs_s
} from "./annex_k/annex_k.js";

// threading (pthread stubs)
export {
  type PthreadT, type PthreadMutexT, type PthreadCondT,
  pthread_create, pthread_join, pthread_self,
  pthread_mutex_init, pthread_mutex_lock, pthread_mutex_unlock, pthread_mutex_destroy,
  pthread_cond_init, pthread_cond_wait, pthread_cond_signal, pthread_cond_broadcast, pthread_cond_destroy
} from "./thread/thread.js";
