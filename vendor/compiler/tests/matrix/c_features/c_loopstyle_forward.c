/* Loop style: forward. */
#include <stdio.h>
#define N 10
int main(void) {
  int a[10] = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
  int s = 0;
  for (int i = 0; i < N; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
