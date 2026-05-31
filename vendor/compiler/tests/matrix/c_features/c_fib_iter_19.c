/* Fibonacci F(19) iterative. */
#include <stdio.h>
int main(void) {
  long a = 0, b = 1;
  for (int i = 0; i < 19; i++) { long t = a + b; a = b; b = t; }
  printf("%ld\n", a);
  return 0;
}
