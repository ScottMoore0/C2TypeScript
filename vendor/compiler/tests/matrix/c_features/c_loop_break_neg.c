/* Loop control: break_neg. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 100; i++) { if (i > 50) break; s += i; }
  printf("%ld\n", s);
  return 0;
}
