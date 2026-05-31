/* Loop control: continue_odds. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 20; i++) { if (i % 2 == 1) continue; s += i; }
  printf("%ld\n", s);
  return 0;
}
