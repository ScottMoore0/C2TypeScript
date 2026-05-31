/* Sum 1..25. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (long i = 1; i <= 25; i++) s += i;
  printf("%ld\n", s);
  return 0;
}
