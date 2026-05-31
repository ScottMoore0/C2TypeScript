/* Recursive fact(6). */
#include <stdio.h>
long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }
int main(void) {
  printf("%ld\n", fact(6));
  return 0;
}
