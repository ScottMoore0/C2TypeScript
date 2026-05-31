/* Recursion: fibonacci. */
#include <stdio.h>
int fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
int main(void) {
  for (int i = 0; i < 12; i++) printf("%d ", fib(i));
  printf("\n");
  return 0;
}
