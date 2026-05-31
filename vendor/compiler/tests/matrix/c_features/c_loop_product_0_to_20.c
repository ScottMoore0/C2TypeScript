/* product for i in [0, 20). */
#include <stdio.h>
int main(void) {
  long acc = 1L;
  for (long i = 0; i < 20; i++) if (i > 0) acc *= i;
  printf("%ld\n", acc);
  return 0;
}
