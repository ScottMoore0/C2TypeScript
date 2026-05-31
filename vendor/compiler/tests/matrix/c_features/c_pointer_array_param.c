/* Function parameter declared as pointer is equivalent to array. */
#include <stdio.h>
int sum1(int a[],   int n) { int s = 0; for (int i = 0; i < n; i++) s += a[i]; return s; }
int sum2(int a[5],  int n) { int s = 0; for (int i = 0; i < n; i++) s += a[i]; return s; }
int sum3(int *a,    int n) { int s = 0; for (int i = 0; i < n; i++) s += a[i]; return s; }
int main(void) {
  int x[5] = { 1, 2, 3, 4, 5 };
  printf("%d %d %d\n", sum1(x, 5), sum2(x, 5), sum3(x, 5));
  return 0;
}
