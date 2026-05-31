/* GCC `__atomic_is_lock_free(size, ptr)` — implementation-defined.
 * Translator returns 1 (lock-free) since single-agent JS is trivially
 * lock-free for the documented widths. */
#include <stdio.h>
int main(void) {
  int lf = __atomic_is_lock_free(4, 0);
  printf("%d\n", lf);
  return 0;
}
