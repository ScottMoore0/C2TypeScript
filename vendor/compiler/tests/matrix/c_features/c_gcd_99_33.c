/* GCD(99, 33). */
#include <stdio.h>
int gcd(int a, int b) { while (b) { int t = b; b = a %% b; a = t; } return a; }
int main(void) {
  printf("%d\n", gcd(99, 33));
  return 0;
}
