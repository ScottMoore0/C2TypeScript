/* product for i in [5, 10). */
#include <stdio.h>
int main(void) {
  long acc = 1L;
  for (long i = 5; i < 10; i++) acc *= i;
  printf("%ld\n", acc);
  return 0;
}
