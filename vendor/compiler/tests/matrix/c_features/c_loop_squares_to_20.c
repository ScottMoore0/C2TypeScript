/* Sum of squares 1..20. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (long i = 1; i <= 20; i++) s += i * i;
  printf("%ld\n", s);
  return 0;
}
