/* C17 §7.27 — time() returns a non-negative time_t.
 * Output is non-deterministic, so test only the sign. */
#include <stdio.h>
#include <time.h>
int main(void) {
  time_t t = time(NULL);
  printf("%d\n", t > 0 ? 1 : 0);
  return 0;
}
