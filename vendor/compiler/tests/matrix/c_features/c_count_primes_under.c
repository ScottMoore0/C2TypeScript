/* Count primes < N. */
#include <stdio.h>
int is_prime(int n) {
  if (n < 2) return 0;
  for (int i = 2; i * i <= n; i++) if (n % i == 0) return 0;
  return 1;
}
int main(void) {
  int n = 100;
  int count = 0;
  for (int i = 2; i < n; i++) if (is_prime(i)) count++;
  printf("%d\n", count);
  return 0;
}
