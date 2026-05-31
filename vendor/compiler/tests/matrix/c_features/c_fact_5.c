/* Factorial of 5. */
#include <stdio.h>
int main(void) {
  long f = 1;
  for (int i = 1; i <= 5; i++) f *= i;
  printf("%ld\n", f);
  return 0;
}
