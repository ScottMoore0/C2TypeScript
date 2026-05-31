/* Recursion: fib. */
#include <stdio.h>
int rec(int n) { return n < 2 ? n : rec(n - 1) + rec(n - 2); }
int main(void) {
  printf("%d %d %d %d %d %d %d %d %d %d %d %d\n", rec(0), rec(1), rec(2), rec(3), rec(4), rec(5), rec(6), rec(7), rec(8), rec(9), rec(10), rec(11));
  return 0;
}
