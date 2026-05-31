/* Linear-congruential PRNG with seed 4660. */
#include <stdio.h>
int main(void) {
  unsigned long s = 4660u;
  for (int i = 0; i < 5; i++) {
    s = s * 1103515245u + 12345u;
    printf("%lu ", (s >> 16) & 0xFFFF);
  }
  printf("\n");
  return 0;
}
