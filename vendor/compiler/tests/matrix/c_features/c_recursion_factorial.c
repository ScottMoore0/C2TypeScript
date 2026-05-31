/* Recursion: factorial. */
#include <stdio.h>
int fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }
int main(void) {
  for (int i = 0; i <= 8; i++) printf("%d ", fact(i));
  printf("\n");
  return 0;
}
