/* sum for i in [5, 15). */
#include <stdio.h>
int main(void) {
  long acc = 0L;
  for (long i = 5; i < 15; i++) acc += i;
  printf("%ld\n", acc);
  return 0;
}
