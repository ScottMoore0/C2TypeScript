/* Sum 1..10. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (long i = 1; i <= 10; i++) s += i;
  printf("%ld\n", s);
  return 0;
}
