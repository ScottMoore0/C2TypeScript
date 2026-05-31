/* GCD(100, 25). */
#include <stdio.h>
int gcd(int a, int b) { while (b) { int t = b; b = a %% b; a = t; } return a; }
int main(void) {
  printf("%d\n", gcd(100, 25));
  return 0;
}
