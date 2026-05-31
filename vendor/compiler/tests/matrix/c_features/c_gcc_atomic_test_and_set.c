/* GCC `__atomic_test_and_set` — set *ptr to non-zero, return previous
 * as a bool. Memory order argument ignored on single-agent JS. */
#include <stdio.h>
int main(void) {
  unsigned char lock = 0;
  int first = __atomic_test_and_set(&lock, __ATOMIC_SEQ_CST);
  int second = __atomic_test_and_set(&lock, __ATOMIC_SEQ_CST);
  printf("%d %d\n", first, second);
  return 0;
}
