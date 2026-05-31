/* GCC/Clang built-in functions: bit-counting, byte-swap, expect/unreachable,
 * offsetof. Each is widely used; on-failure produces ReferenceError at runtime.
 */
#include <stdio.h>
#include <stddef.h>

struct S { int a; int b; long c; };

int main(void) {
  unsigned x = 0xF0;
  printf("popcount=%d\n", __builtin_popcount(x));
  printf("clz=%d\n", __builtin_clz(x));
  printf("ctz=%d\n", __builtin_ctz(x));
  printf("bswap32=%x\n", __builtin_bswap32(0x11223344));
  printf("bswap16=%x\n", __builtin_bswap16(0x1234));

  /* expect: branch-prediction hint, semantically transparent. */
  if (__builtin_expect(x > 0, 1)) printf("expect-true\n");

  /* offsetof — std header macro typically lowers to __builtin_offsetof. */
  printf("offsetof.b=%zu offsetof.c=%zu\n",
         offsetof(struct S, b), offsetof(struct S, c));
  return 0;
}
