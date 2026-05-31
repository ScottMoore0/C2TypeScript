/* sum for i in [1, 51). */
#include <stdio.h>
int main(void) {
  long acc = 0L;
  for (long i = 1; i < 51; i++) acc += i;
  printf("%ld\n", acc);
  return 0;
}
