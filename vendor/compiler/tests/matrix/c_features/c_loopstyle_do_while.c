/* Loop style: do_while. */
#include <stdio.h>
#define N 10
int main(void) {
  int a[10] = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
  int s = 0;
  int i = 0; do { s += a[i]; i++; } while (i < N);
  printf("%d\n", s);
  return 0;
}
