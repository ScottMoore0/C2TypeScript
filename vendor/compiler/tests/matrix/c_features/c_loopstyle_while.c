/* Loop style: while. */
#include <stdio.h>
#define N 10
int main(void) {
  int a[10] = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
  int s = 0;
  int i = 0; while (i < N) { s += a[i]; i++; }
  printf("%d\n", s);
  return 0;
}
