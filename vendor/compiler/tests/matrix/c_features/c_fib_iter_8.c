/* Fibonacci F(8) iterative. */
#include <stdio.h>
int main(void) {
  long a = 0, b = 1;
  for (int i = 0; i < 8; i++) { long t = a + b; a = b; b = t; }
  printf("%ld\n", a);
  return 0;
}
