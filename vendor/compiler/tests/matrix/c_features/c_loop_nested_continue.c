/* Loop control: nested_continue. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 5; i++) for (int j = 0; j < 5; j++) { if (j == 3) continue; s += i + j; }
  printf("%ld\n", s);
  return 0;
}
