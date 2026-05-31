/* Min of three ints with nested ternary. */
#include <stdio.h>
int min3(int a, int b, int c) { return a < b ? (a < c ? a : c) : (b < c ? b : c); }
int main(void) {
  printf("%d %d %d %d\n", min3(1, 2, 3), min3(3, 2, 1), min3(2, 1, 3), min3(5, 5, 5));
  return 0;
}
