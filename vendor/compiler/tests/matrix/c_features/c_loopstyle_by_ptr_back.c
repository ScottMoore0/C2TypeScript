/* Loop style: by_ptr_back. */
#include <stdio.h>
#define N 10
int main(void) {
  int a[10] = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
  int s = 0;
  for (int *p = a + N - 1; p >= a; p--) s += *p;
  printf("%d\n", s);
  return 0;
}
