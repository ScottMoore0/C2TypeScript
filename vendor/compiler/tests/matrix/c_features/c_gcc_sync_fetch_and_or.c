/* GCC legacy `__sync_fetch_and_or` — atomic OR, returns previous value.
 * Single-agent JS makes the RMW observably atomic. */
#include <stdio.h>
int main(void) {
  int flags = 0x01;
  int prev = __sync_fetch_and_or(&flags, 0x04);
  printf("%d %d\n", prev, flags);
  return 0;
}
