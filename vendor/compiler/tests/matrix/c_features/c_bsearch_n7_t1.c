/* bsearch 1 in sorted len 7. */
#include <stdio.h>
#include <stdlib.h>
int cmp(const void *a, const void *b) {
  int x = *(const int *)a, y = *(const int *)b;
  return (x > y) - (x < y);
}
int main(void) {
  int a[7] = { 1, 6, 11, 16, 21, 26, 31 };
  int key = 1;
  int *r = bsearch(&key, a, 7, sizeof(int), cmp);
  printf("%d\n", r ? (int)(r - a) : -1);
  return 0;
}
