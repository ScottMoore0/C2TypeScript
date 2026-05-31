/* Fold 1..10 with max. */
#include <stdio.h>
int main(void) {
  long acc = 0x80000000;
  for (long i = 1; i <= 10; i++) if (i > acc) acc = i;
  printf("%ld\n", acc);
  return 0;
}
