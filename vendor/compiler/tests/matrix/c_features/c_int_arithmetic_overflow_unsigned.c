/* C17 §6.2.5 p9 — unsigned overflow wraps modulo 2^N. */
#include <stdio.h>
int main(void) {
  unsigned int a = 0xFFFFFFFFu;
  unsigned int b = a + 1;     /* wraps to 0 */
  unsigned int c = 0u - 1u;   /* UINT_MAX */
  printf("%u %u\n", b, c);
  return 0;
}
