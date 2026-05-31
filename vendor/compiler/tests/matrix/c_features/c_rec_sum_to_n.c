/* Recursion: sum_to_n. */
#include <stdio.h>
int rec(int n) { return n <= 0 ? 0 : n + rec(n - 1); }
int main(void) {
  printf("%d %d %d %d %d\n", rec(0), rec(1), rec(5), rec(10), rec(100));
  return 0;
}
