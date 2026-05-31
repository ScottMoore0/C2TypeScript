/* C17 §6.2.5 p9 — unsigned overflow wraps; signed is UB,
 * here use unsigned to demonstrate well-defined wrap. */
#include <stdio.h>
int main(void) {
  unsigned int x = 0xFFFFFFFFu;
  unsigned int y = x + x + 1;
  printf("%u\n", y);
  return 0;
}
