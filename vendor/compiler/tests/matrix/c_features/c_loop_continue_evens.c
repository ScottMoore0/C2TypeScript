/* Loop control: continue_evens. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 20; i++) { if (i % 2 == 0) continue; s += i; }
  printf("%ld\n", s);
  return 0;
}
