/* Fold 1..10 with +. */
#include <stdio.h>
int main(void) {
  long acc = 0;
  for (long i = 1; i <= 10; i++) acc = acc + i;
  printf("%ld\n", acc);
  return 0;
}
