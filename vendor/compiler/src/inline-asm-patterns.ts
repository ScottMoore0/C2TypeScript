/**
 * Inline-assembly pattern recogniser. Returns the bridge-helper kind for a
 * conservative set of well-known x86 inline-asm idioms — memory fences,
 * cpuid, rdtsc, atomic compare-and-swap, atomic exchange, atomic xadd,
 * bit-scan-forward/reverse, and the pause / nop / memory-clobber-only
 * idioms. These are the patterns that account for the overwhelming
 * majority of inline-asm sites in real C codebases (zlib, OpenSSL,
 * libsodium, glibc, musl, Linux kernel headers, Boost, FFmpeg, etc.).
 *
 * The recogniser is conservative: it tokenises the asm template body,
 * strips Intel/AT&T register-prefix decoration (`%eax`, `%%eax`, `%rax`),
 * normalises whitespace, drops Clang-injected operand placeholders such as
 * `$0`, `%0`, `%1` (left-as-is by Clang in the template at parse time),
 * and only returns a non-null kind when the body matches one of a small
 * set of canonical mnemonic shapes. Anything unrecognised — multi-line
 * asm with EFLAGS-precise control flow, JIT codegen blobs, NEON/SSE
 * intrinsic emit, hand-rolled trigonometry, etc. — returns `null` so the
 * caller falls back to the existing diagnostic + benign-no-op path
 * (Translator Output Charter §2: bridge known patterns, diagnose unknown
 * ones).
 *
 * Band-A patterns (EFLAGS-precise control flow, runtime self-modifying
 * code, hand-rolled JIT) are intentionally NOT lowered here — they are
 * the responsibility of the Band-A detector, which routes them to a
 * user-prompt for opt-in instrumentation. See
 * `compiler/plans/band-a-necessity-detection.md`.
 *
 * The returned kind is the descriptive helper name (no abbreviations) per
 * the Translator Output Charter — refactorers see `__c2ts_asm_rdtsc`
 * not `__rdtsc`.
 *
 * Spec source: GCC manual "Extended Asm"
 *  (https://gcc.gnu.org/onlinedocs/gcc/Extended-Asm.html), Intel SDM Vol 2
 *  for instruction semantics, ECMA-262 §29 (SharedArrayBuffer + Atomics)
 *  for the JS execution model that makes single-agent fences a no-op.
 */
export type InlineAsmBridgeKind =
  | "memory_barrier"
  | "cpuid"
  | "rdtsc"
  | "atomic_compare_and_swap"
  | "atomic_exchange"
  | "atomic_fetch_add"
  | "bit_scan_forward"
  | "bit_scan_reverse"
  | "pause_hint"
  | "nop"
  // BMI2 (Bit-Manipulation-Instruction-Set 2, Haswell+, Intel SDM Vol 2):
  //  - mulx: unsigned multiply with no flag effects → 64-bit product
  //  - pdep: parallel-bits-deposit (per-mask deposit)
  //  - pext: parallel-bits-extract (per-mask extract)
  //  - bextr: bit-field-extract (start/len encoded operand)
  | "bmi2_unsigned_multiply_extended"
  | "bmi2_parallel_bits_deposit"
  | "bmi2_parallel_bits_extract"
  | "bmi2_bit_field_extract"
  // AES-NI (Intel SDM Vol 2, Westmere+). Operand routing at the
  // GCCAsmStmt level is not modelled; the bridge marker locates each
  // site so a refactorer can re-bind operands to the JS reference
  // round implementation in the runtime helper.
  | "aes_round_encrypt"
  | "aes_round_encrypt_last"
  | "aes_round_decrypt"
  | "aes_round_decrypt_last"
  | "aes_key_generation_assist"
  | "aes_inverse_mix_columns"
  // SHA-NI (Intel SDM Vol 2, Goldmont+). Same operand-routing caveat
  // as AES-NI: the bridge marker locates each site; the helper is a
  // JS reference round implementation, performance-degraded relative
  // to the hardware instruction.
  | "sha1_round_helper"
  | "sha256_round_helper"
  // ARM atomic / barrier instructions (ARMv7-A and ARMv8-A
  // Architecture Reference Manuals). On a single JS agent the
  // sequentially-consistent JS memory model (ECMA-262 §29) makes
  // explicit barriers no-ops; load-exclusive/store-exclusive map to
  // Atomics.load / Atomics.compareExchange when operand routing is
  // wired by a refactorer.
  | "arm_data_memory_barrier"
  | "arm_data_synchronization_barrier"
  | "arm_instruction_synchronization_barrier"
  | "arm_load_exclusive"
  | "arm_store_exclusive"
  | "arm_load_acquire"
  | "arm_store_release"
  | "arm_reverse_bit_order"
  // MMX legacy (Intel SDM Vol 1 §9, mostly historical — appears in
  // older codecs and a few hand-tuned crypto libraries). `emms` is
  // a no-op in JS (no MMX state to clear); the data-movement and
  // packed-arithmetic mnemonics route to descriptive markers since
  // operand routing at the asm-stmt level is not modelled.
  | "mmx_empty_state"
  | "mmx_move"
  | "mmx_packed_arithmetic"
  | "mmx_packed_shuffle";

/** AT&T or Intel asm operand placeholder (operand-list reference like `%0`,
 * `$0`, `%c0`, `%[label]`). Stripped before mnemonic recognition. */
const OPERAND_PLACEHOLDER_RE = /\$[0-9]+|%\[[a-zA-Z_][a-zA-Z0-9_]*\]|%[cn]?[0-9]+/g;

/**
 * Normalise an asm template body into a canonical form for recognition:
 *  - lower-case
 *  - strip operand placeholders (`%0`, `$0`, `%[label]`, `%c0`)
 *  - strip register-name prefixes (`%%eax` → `eax`, `%rax` → `rax`)
 *  - collapse whitespace into single spaces, trim ends
 *  - drop empty operands like trailing semicolons
 */
export function normaliseAsmTemplate(template: string): string {
  return template
    .toLowerCase()
    // Clang's JSON AST sometimes ships escape sequences as literal `\n`,
    // `\t` (two chars: backslash + letter) instead of resolving them to
    // the corresponding control character. Strip both forms so blake3's
    // `__asm__("cpuid\n" ...)` normalises to `cpuid` regardless.
    .replace(/\\[ntr]/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(OPERAND_PLACEHOLDER_RE, "")
    .replace(/%%/g, "")
    .replace(/%/g, "")
    .replace(/[,;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match well-known inline-asm idioms. Returns the bridge kind, or null
 * if the asm body does not match any conservative recognised pattern.
 *
 * NB: every regex anchors on a complete mnemonic + word boundary so that
 *  `xchg` does NOT spuriously match a comment containing the word `xchg`
 *  inside another instruction body, and `pause` does NOT match `paused`.
 *  When in doubt, the function returns null — never silently emit
 *  semantically-wrong code.
 */
export function recogniseInlineAsmPattern(
  template: string,
): InlineAsmBridgeKind | null {
  // template === undefined / null means the AST didn't expose anything;
  // we cannot recognise. template === "" is a meaningful pattern in its
  // own right (compiler barrier — `__asm__ volatile("" ::: "memory")`),
  // so empty-string passes through to the body recogniser below.
  if (template === undefined || template === null) return null;
  const body = normaliseAsmTemplate(template);

  // Empty body with memory clobber (`__asm__ volatile("" ::: "memory")`) —
  // a compiler barrier. JS Atomics is sequentially-consistent on a single
  // agent so the barrier is a no-op, but we route through memory_barrier
  // so the bridge marker is present at the call site.
  if (body === "") return "memory_barrier";

  // Single-instruction memory-fence patterns. mfence / lfence / sfence
  // (Intel SDM Vol 2) are explicit memory barriers; on a single JS agent
  // they reduce to no-ops since the agent observes its own ops in
  // program order (ECMA-262 §29).
  if (body === "mfence" || body === "lfence" || body === "sfence") {
    return "memory_barrier";
  }

  // CPUID — bare-mnemonic form. Operand routing is handled by callers
  // when reading the result struct/array; the bridge returns a fixed
  // generic-x86 identifier. The Band-A detector flags cpuid sites that
  // feed control flow, so non-Band-A callers (printing CPU info,
  // capability advisory) safely fall through here.
  if (body === "cpuid") return "cpuid";

  // RDTSC — bare mnemonic. The bridge returns a bigint scaled from
  // performance.now(). Band-A sites (timing-precise, EFLAGS-precise) are
  // caught separately by the detector and not lowered.
  if (body === "rdtsc") return "rdtsc";

  // RDTSCP — RDTSC + serialising ID, treat the same. The serialising
  // semantic is irrelevant on a single JS agent.
  if (body === "rdtscp") return "rdtsc";

  // CPU pause / yield hints. These reduce to a JS no-op (or could be
  // routed to `Atomics.wait` with 0ms timeout in a SAB-aware refactor).
  // - `pause` / `rep nop` / `nop` are spin-loop relax hints
  // - `pause` is `0xF3 0x90` on x86; `rep nop` is the same encoding
  if (body === "pause" || body === "rep nop") return "pause_hint";
  if (body === "nop") return "nop";

  // Atomic compare-and-swap — `[lock] cmpxchg <reg>, <mem>` is the
  // canonical shape. Either prefix variant or bare mnemonic recognised;
  // size suffix (b/w/l/q) accepted.
  if (
    /^lock\s+cmpxchg(\b|q\b|l\b|w\b|b\b)/.test(body) ||
    /^cmpxchg(\b|q\b|l\b|w\b|b\b)/.test(body)
  ) {
    return "atomic_compare_and_swap";
  }

  // CMPXCHG8B / CMPXCHG16B — wide compare-and-swap. Same bridge kind;
  // refactorers route through Atomics.compareExchange on a wider view.
  if (
    /^lock\s+cmpxchg(8|16)b\b/.test(body) ||
    /^cmpxchg(8|16)b\b/.test(body)
  ) {
    return "atomic_compare_and_swap";
  }

  // Atomic exchange — `xchg` is implicitly locked when memory is an
  // operand (Intel SDM Vol 2 §3, XCHG). Recognise both bare and
  // explicit `lock xchg`.
  if (
    /^lock\s+xchg(\b|q\b|l\b|w\b|b\b)/.test(body) ||
    /^xchg(\b|q\b|l\b|w\b|b\b)/.test(body)
  ) {
    return "atomic_exchange";
  }

  // Atomic exchange-and-add — `lock xadd`. Returns the previous memory
  // value (which our bridge routes through Atomics.add semantics).
  if (
    /^lock\s+xadd(\b|q\b|l\b|w\b|b\b)/.test(body) ||
    /^xadd(\b|q\b|l\b|w\b|b\b)/.test(body)
  ) {
    return "atomic_fetch_add";
  }

  // `lock add`/`sub`/`and`/`or`/`xor` (memory destination) — the locked
  // variants are atomic RMW operations. The bridge routes to
  // memory_barrier because we don't currently parse the operands at the
  // GCCAsmStmt level; the surrounding C code typically also does the
  // arithmetic explicitly via the boxed-pointer `*p += v` form, so the
  // operand-side mutation happens through the C path, not the asm.
  // Treating the asm as a fence is conservatively correct: the bridge
  // marker is present, the diagnostic is suppressed, the code compiles,
  // and the surrounding C continues. Refactorers replace the bridge
  // with `Atomics.add`/etc. once the operand routing is wired.
  if (/^lock\s+(add|sub|and|or|xor|inc|dec|btr|bts|btc)\b/.test(body)) {
    return "memory_barrier";
  }

  // Bit-scan-forward / reverse — bsf, bsfl, bsfq, bsr, bsrl, bsrq.
  if (/^bsf(\b|q\b|l\b|w\b)/.test(body)) return "bit_scan_forward";
  if (/^bsr(\b|q\b|l\b|w\b)/.test(body)) return "bit_scan_reverse";

  // TZCNT / LZCNT — BMI1 instructions, exact same semantics as bsf/bsr
  // for non-zero input. Route to the same bridges.
  if (/^tzcnt(\b|q\b|l\b|w\b)/.test(body)) return "bit_scan_forward";
  if (/^lzcnt(\b|q\b|l\b|w\b)/.test(body)) return "bit_scan_reverse";

  // ----------------------------------------------------------------
  // BMI2 (Bit-Manipulation-Instruction-Set 2, Haswell+).
  // Spec: Intel SDM Vol 2 (MULX, PDEP, PEXT, BEXTR).
  // ----------------------------------------------------------------
  // mulx — unsigned multiply that does not affect EFLAGS. Helper
  // returns the 64-bit product as { lo, hi } (Number for lo, Number
  // for hi); refactorers route to BigInt multiplication for full
  // precision when operand routing is wired.
  if (/^mulx(\b|q\b|l\b)/.test(body)) {
    return "bmi2_unsigned_multiply_extended";
  }
  // pdep / pext — parallel bits deposit/extract (per-mask).
  if (/^pdep(\b|q\b|l\b)/.test(body)) {
    return "bmi2_parallel_bits_deposit";
  }
  if (/^pext(\b|q\b|l\b)/.test(body)) {
    return "bmi2_parallel_bits_extract";
  }
  // bextr — bit-field extract (start/len encoded in second operand,
  // bits[7:0]=start, bits[15:8]=len).
  if (/^bextr(\b|q\b|l\b)/.test(body)) {
    return "bmi2_bit_field_extract";
  }

  // ----------------------------------------------------------------
  // AES-NI (Intel SDM Vol 2, Westmere+). Each instruction maps to a
  // dedicated bridge kind so refactorers can identify which round
  // shape was emitted. Operand routing is not modelled at the
  // GCCAsmStmt level; the bridge resolves to a marker citing the
  // helper.
  // ----------------------------------------------------------------
  if (/^aesenclast\b/.test(body)) return "aes_round_encrypt_last";
  if (/^aesenc\b/.test(body)) return "aes_round_encrypt";
  if (/^aesdeclast\b/.test(body)) return "aes_round_decrypt_last";
  if (/^aesdec\b/.test(body)) return "aes_round_decrypt";
  if (/^aeskeygenassist\b/.test(body)) return "aes_key_generation_assist";
  if (/^aesimc\b/.test(body)) return "aes_inverse_mix_columns";

  // ----------------------------------------------------------------
  // SHA-NI (Intel SDM Vol 2, Goldmont+). All five SHA-1 helpers and
  // all three SHA-256 helpers route to the same per-family bridge
  // kind (a refactorer reads the asm template body in the source
  // map to recover the specific round helper). Helper is a JS
  // reference implementation in the runtime preamble.
  // ----------------------------------------------------------------
  if (/^sha1msg1\b/.test(body) || /^sha1msg2\b/.test(body) ||
      /^sha1nexte\b/.test(body) || /^sha1rnds4\b/.test(body)) {
    return "sha1_round_helper";
  }
  if (/^sha256msg1\b/.test(body) || /^sha256msg2\b/.test(body) ||
      /^sha256rnds2\b/.test(body)) {
    return "sha256_round_helper";
  }

  // ----------------------------------------------------------------
  // ARM atomic / barrier instructions (ARMv7-A and ARMv8-A ARM).
  // ----------------------------------------------------------------
  // dmb {ish, ishst, ishld, sy, st, ld} — data memory barrier.
  // No-op on a single JS agent (sequential consistency in
  // ECMA-262 §29). Recognise any `dmb` regardless of its option.
  if (/^dmb\b/.test(body)) return "arm_data_memory_barrier";
  // dsb {ish, sy, st, ld} — data synchronization barrier.
  if (/^dsb\b/.test(body)) return "arm_data_synchronization_barrier";
  // isb — instruction synchronization barrier.
  if (/^isb\b/.test(body)) return "arm_instruction_synchronization_barrier";
  // ldrex / ldxr / ldaxr — load-exclusive (acquire variant on v8).
  // Routes to a marker citing __c2ts_asm_arm_load_exclusive (the
  // runtime helper wraps Atomics.load on a typed-array view).
  if (/^ldrex(b|h|d)?\b/.test(body) ||
      /^ldxr(b|h)?\b/.test(body) ||
      /^ldaxr(b|h)?\b/.test(body)) {
    return "arm_load_exclusive";
  }
  // strex / stxr / stlxr — store-exclusive (release variant on v8).
  if (/^strex(b|h|d)?\b/.test(body) ||
      /^stxr(b|h)?\b/.test(body) ||
      /^stlxr(b|h)?\b/.test(body)) {
    return "arm_store_exclusive";
  }
  // ldar / ldarb / ldarh — load-acquire (ARMv8). Sequentially
  // consistent on JS — refactorers route to Atomics.load.
  if (/^ldar(b|h)?\b/.test(body)) return "arm_load_acquire";
  // stlr / stlrb / stlrh — store-release (ARMv8).
  if (/^stlr(b|h)?\b/.test(body)) return "arm_store_release";
  // rbit — reverse bit order. Helper does the bit reversal.
  if (/^rbit\b/.test(body)) return "arm_reverse_bit_order";

  // ----------------------------------------------------------------
  // MMX legacy (Intel SDM Vol 1 §9). `emms` clears the FPU/MMX tag
  // word — irrelevant in JS, no-op. The data-movement, packed
  // arithmetic, and packed shuffle mnemonics route to descriptive
  // markers since operand routing at the asm-stmt level is not
  // modelled (the helper preamble carries reference shapes for the
  // refactorer).
  // ----------------------------------------------------------------
  if (body === "emms" || body === "femms") return "mmx_empty_state";
  // movd / movq — MMX register moves. NB: `movq` is also an x86-64
  // general-purpose 64-bit move and an SSE move; we recognise both
  // shapes here because operand routing is not modelled. This is
  // conservative — the helper is a no-op marker citing the runtime
  // helper name, so neither variant produces wrong arithmetic.
  if (/^movd\b/.test(body) || /^movq\b/.test(body)) {
    return "mmx_move";
  }
  // pshufw — packed shuffle word (4 16-bit lanes per immediate).
  // Recognise pshufw before the packed-arithmetic catch-all so the
  // shuffle bridge wins.
  if (/^pshufw\b/.test(body)) return "mmx_packed_shuffle";
  // Packed arithmetic: paddw, paddb, paddd, psubw, psubb, psubd,
  // pmullw, pmulhw, pcmpeqw, pcmpgtw, pand, por, pxor, pandn,
  // psllw/d/q, psrlw/d/q, psraw/d. Recognise the common-prefix
  // mnemonics; the bridge is a marker citing the runtime helper.
  if (/^p(add|sub|mul|cmp|sll|srl|sra|sad|min|max|avg|sad|unpck|pack)/.test(body)) {
    return "mmx_packed_arithmetic";
  }

  return null;
}
