/* GCC `__atomic_add_fetch` — modern atomic add, returns NEW value.
 * Memory order argument ignored (JS is sequentially consistent). */
#include <stdio.h>
int main(void) {
  int counter = 100;
  int next = __atomic_add_fetch(&counter, 5, __ATOMIC_SEQ_CST);
  printf("%d %d\n", next, counter);
  return 0;
}
