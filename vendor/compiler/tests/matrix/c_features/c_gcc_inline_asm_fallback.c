/* GCC inline assembly fall-back path. Real codebases use inline asm
 * for fast paths and provide a C fallback under preprocessor guards.
 * The translator should:
 *   - Either emit an UNSUPPORTED diagnostic for the asm and continue
 *     (preferred — surrounding code translates), OR
 *   - The codebase's #ifndef NO_ASM guard hides the asm entirely and
 *     only the C fallback reaches the translator (this test).
 *
 * This test exercises the C fallback path: no asm in the AST.
 */
#include <stdio.h>

#ifndef NO_ASM
#define NO_ASM 1   /* Force the C fallback for translation. */
#endif

static unsigned bswap32_c(unsigned x) {
#ifndef NO_ASM
  unsigned r;
  __asm__ ("bswap %0" : "=r"(r) : "0"(x));
  return r;
#else
  return ((x >> 24) & 0xff) | ((x >> 8) & 0xff00) |
         ((x << 8) & 0xff0000) | ((x << 24) & 0xff000000);
#endif
}

int main(void) {
  printf("bswap=%x\n", bswap32_c(0x11223344));
  return 0;
}
