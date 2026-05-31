/* Recursion: count_digits. */
#include <stdio.h>
int rec(int n) { return n == 0 ? 0 : 1 + rec(n / 10); }
int main(void) {
  printf("%d %d %d %d %d\n", rec(0), rec(5), rec(100), rec(12345), rec(9999999));
  return 0;
}
