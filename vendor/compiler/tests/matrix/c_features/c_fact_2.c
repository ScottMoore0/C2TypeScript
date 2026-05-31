/* Factorial of 2. */
#include <stdio.h>
int main(void) {
  long f = 1;
  for (int i = 1; i <= 2; i++) f *= i;
  printf("%ld\n", f);
  return 0;
}
