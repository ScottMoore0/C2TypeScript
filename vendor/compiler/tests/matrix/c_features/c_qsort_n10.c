/* qsort 10 elements. */
#include <stdio.h>
#include <stdlib.h>
int cmp(const void *a, const void *b) {
  int x = *(const int *)a, y = *(const int *)b;
  return (x > y) - (x < y);
}
int main(void) {
  int a[10] = { 13, 20, 27, 34, 41, 48, 55, 62, 69, 76 };
  qsort(a, 10, sizeof(int), cmp);
  for (int i = 0; i < 10; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
