/* Factorial of 6. */
#include <stdio.h>
int main(void) {
  long f = 1;
  for (int i = 1; i <= 6; i++) f *= i;
  printf("%ld\n", f);
  return 0;
}
