/* Sum 1..40. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (long i = 1; i <= 40; i++) s += i;
  printf("%ld\n", s);
  return 0;
}
