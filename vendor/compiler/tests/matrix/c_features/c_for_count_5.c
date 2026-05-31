/* For loop 5 iterations, accumulate. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 5; i++) s += i;
  printf("%ld\n", s);
  return 0;
}
