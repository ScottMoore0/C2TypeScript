/* sum for i in [5, 55). */
#include <stdio.h>
int main(void) {
  long acc = 0L;
  for (long i = 5; i < 55; i++) acc += i;
  printf("%ld\n", acc);
  return 0;
}
