/* Sum of squares 1..15. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (long i = 1; i <= 15; i++) s += i * i;
  printf("%ld\n", s);
  return 0;
}
