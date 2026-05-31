/* sum for i in [0, 10). */
#include <stdio.h>
int main(void) {
  long acc = 0L;
  for (long i = 0; i < 10; i++) acc += i;
  printf("%ld\n", acc);
  return 0;
}
