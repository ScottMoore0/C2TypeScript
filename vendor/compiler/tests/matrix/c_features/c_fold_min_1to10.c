/* Fold 1..10 with min. */
#include <stdio.h>
int main(void) {
  long acc = 0x7FFFFFFF;
  for (long i = 1; i <= 10; i++) if (i < acc) acc = i;
  printf("%ld\n", acc);
  return 0;
}
