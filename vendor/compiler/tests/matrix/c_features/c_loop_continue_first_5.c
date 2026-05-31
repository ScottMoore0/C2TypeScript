/* Loop control: continue_first_5. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 20; i++) { if (i < 5) continue; s += i; }
  printf("%ld\n", s);
  return 0;
}
