/* GCC legacy `__sync_add_and_fetch` — atomic add, returns NEW value
 * (post-op, distinct from `__sync_fetch_and_add`). */
#include <stdio.h>
int main(void) {
  int counter = 10;
  int next = __sync_add_and_fetch(&counter, 5);
  printf("%d %d\n", next, counter);
  return 0;
}
