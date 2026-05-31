/* GCD(108, 27). */
#include <stdio.h>
int gcd(int a, int b) { while (b) { int t = b; b = a %% b; a = t; } return a; }
int main(void) {
  printf("%d\n", gcd(108, 27));
  return 0;
}
