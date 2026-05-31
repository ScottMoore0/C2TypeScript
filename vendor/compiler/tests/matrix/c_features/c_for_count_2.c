/* For loop 2 iterations, accumulate. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 2; i++) s += i;
  printf("%ld\n", s);
  return 0;
}
