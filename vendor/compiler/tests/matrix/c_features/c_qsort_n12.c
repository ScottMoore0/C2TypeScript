/* qsort 12 elements. */
#include <stdio.h>
#include <stdlib.h>
int cmp(const void *a, const void *b) {
  int x = *(const int *)a, y = *(const int *)b;
  return (x > y) - (x < y);
}
int main(void) {
  int a[12] = { 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 90 };
  qsort(a, 12, sizeof(int), cmp);
  for (int i = 0; i < 12; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
