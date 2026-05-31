/* Sum 1..1000. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (long i = 1; i <= 1000; i++) s += i;
  printf("%ld\n", s);
  return 0;
}
