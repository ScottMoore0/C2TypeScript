/* Recursive fact(10). */
#include <stdio.h>
long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }
int main(void) {
  printf("%ld\n", fact(10));
  return 0;
}
