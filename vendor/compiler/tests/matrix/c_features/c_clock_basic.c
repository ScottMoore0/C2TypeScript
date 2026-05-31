/* C17 §7.27.2.1 — clock() runs and returns a value. */
#include <stdio.h>
#include <time.h>
int main(void) {
  clock_t c = clock();
  printf("%d\n", c >= 0 ? 1 : 0);
  return 0;
}
