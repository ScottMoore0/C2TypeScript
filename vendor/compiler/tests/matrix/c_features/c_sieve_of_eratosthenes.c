/* Sieve of Eratosthenes. */
#include <stdio.h>
int main(void) {
  int sieve[50];
  for (int i = 0; i < 50; i++) sieve[i] = 1;
  sieve[0] = sieve[1] = 0;
  for (int i = 2; i < 50; i++)
    if (sieve[i])
      for (int j = i + i; j < 50; j += i) sieve[j] = 0;
  for (int i = 2; i < 50; i++) if (sieve[i]) printf("%d ", i);
  printf("\n");
  return 0;
}
