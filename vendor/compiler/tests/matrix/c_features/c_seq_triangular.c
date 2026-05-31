/* Sequence: triangular. */
#include <stdio.h>
int main(void) {
  long acc = 0;
  for (int i = 1; i <= 10; i++) acc += i;
  printf("%ld\n", acc);
  return 0;
}
