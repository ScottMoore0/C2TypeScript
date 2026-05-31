/* Recursive fib(4). */
#include <stdio.h>
long fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
int main(void) {
  printf("%ld\n", fib(4));
  return 0;
}
