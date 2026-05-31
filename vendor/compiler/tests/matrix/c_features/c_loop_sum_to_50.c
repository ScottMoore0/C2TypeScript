/* Sum 1..50. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (long i = 1; i <= 50; i++) s += i;
  printf("%ld\n", s);
  return 0;
}
