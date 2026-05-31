/* sum for i in [1, 21). */
#include <stdio.h>
int main(void) {
  long acc = 0L;
  for (long i = 1; i < 21; i++) acc += i;
  printf("%ld\n", acc);
  return 0;
}
