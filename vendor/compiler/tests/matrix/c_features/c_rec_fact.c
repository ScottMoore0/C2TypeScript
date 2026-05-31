/* Recursion: fact. */
#include <stdio.h>
int rec(int n) { return n <= 1 ? 1 : n * rec(n - 1); }
int main(void) {
  printf("%d %d %d %d %d %d %d %d\n", rec(0), rec(1), rec(2), rec(3), rec(4), rec(5), rec(6), rec(7));
  return 0;
}
