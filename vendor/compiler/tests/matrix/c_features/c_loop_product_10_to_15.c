/* product for i in [10, 15). */
#include <stdio.h>
int main(void) {
  long acc = 1L;
  for (long i = 10; i < 15; i++) acc *= i;
  printf("%ld\n", acc);
  return 0;
}
