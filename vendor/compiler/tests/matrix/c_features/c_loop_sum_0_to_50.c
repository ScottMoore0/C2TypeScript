/* sum for i in [0, 50). */
#include <stdio.h>
int main(void) {
  long acc = 0L;
  for (long i = 0; i < 50; i++) acc += i;
  printf("%ld\n", acc);
  return 0;
}
