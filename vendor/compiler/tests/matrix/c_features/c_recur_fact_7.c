/* Recursive fact(7). */
#include <stdio.h>
long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }
int main(void) {
  printf("%ld\n", fact(7));
  return 0;
}
