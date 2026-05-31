/* Inline asm present in the source. The translator should not fail-stop
 * the whole file — the asm-using function may emit UNSUPPORTED, but the
 * C-only function `compute()` must still translate and run.
 *
 * On Linux we'd verify both paths; on Windows MinGW where this test runs,
 * we ONLY exercise the non-asm path through a C-only entry point.
 */
#include <stdio.h>

/* Function with inline asm — shouldn't be called from main, but its
 * presence in the file must not prevent translation of compute(). */
static unsigned do_bswap_asm(unsigned x) {
  unsigned r = x;
  __asm__ volatile ("nop" : "+r"(r));
  return r;
}

/* C-only — must translate and run. */
static int compute(int a, int b) {
  return a * 2 + b;
}

int main(void) {
  /* Reference do_bswap_asm so it isn't dead-code-eliminated; cast to
   * void so the asm is part of the AST without being on the hot path. */
  (void)do_bswap_asm;
  printf("compute=%d\n", compute(3, 5));
  return 0;
}
