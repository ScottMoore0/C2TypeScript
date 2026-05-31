/* Loop control: break_at_10. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 100; i++) { if (i == 10) break; s += i; }
  printf("%ld\n", s);
  return 0;
}
