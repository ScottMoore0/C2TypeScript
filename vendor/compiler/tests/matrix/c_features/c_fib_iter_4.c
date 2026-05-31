/* Fibonacci F(4) iterative. */
#include <stdio.h>
int main(void) {
  long a = 0, b = 1;
  for (int i = 0; i < 4; i++) { long t = a + b; a = b; b = t; }
  printf("%ld\n", a);
  return 0;
}
