/* bsearch 26 in sorted len 15. */
#include <stdio.h>
#include <stdlib.h>
int cmp(const void *a, const void *b) {
  int x = *(const int *)a, y = *(const int *)b;
  return (x > y) - (x < y);
}
int main(void) {
  int a[15] = { 1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71 };
  int key = 26;
  int *r = bsearch(&key, a, 15, sizeof(int), cmp);
  printf("%d\n", r ? (int)(r - a) : -1);
  return 0;
}
