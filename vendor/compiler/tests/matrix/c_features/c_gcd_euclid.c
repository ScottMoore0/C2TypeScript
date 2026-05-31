/* GCD via Euclid's algorithm. */
#include <stdio.h>
int gcd(int a, int b) { while (b) { int t = b; b = a % b; a = t; } return a; }
int main(void) {
  printf("%d %d %d %d\n", gcd(48, 18), gcd(100, 25), gcd(7, 13), gcd(0, 5));
  return 0;
}
