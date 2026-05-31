/* product for i in [1, 6). */
#include <stdio.h>
int main(void) {
  long acc = 1L;
  for (long i = 1; i < 6; i++) acc *= i;
  printf("%ld\n", acc);
  return 0;
}
