/* Sum of squares 1..5. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (long i = 1; i <= 5; i++) s += i * i;
  printf("%ld\n", s);
  return 0;
}
