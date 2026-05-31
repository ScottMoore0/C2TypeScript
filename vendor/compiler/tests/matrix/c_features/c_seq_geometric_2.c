/* Sequence: geometric_2. */
#include <stdio.h>
int main(void) {
  long acc = 1;
  for (int i = 1; i <= 10; i++) acc *= 2;
  printf("%ld\n", acc);
  return 0;
}
