/* Recursion: power_of_2. */
#include <stdio.h>
int rec(int n) { return n == 0 ? 1 : 2 * rec(n - 1); }
int main(void) {
  printf("%d %d %d\n", rec(0), rec(5), rec(10));
  return 0;
}
