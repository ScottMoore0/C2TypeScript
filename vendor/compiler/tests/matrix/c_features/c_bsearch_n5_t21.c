/* bsearch 21 in sorted len 5. */
#include <stdio.h>
#include <stdlib.h>
int cmp(const void *a, const void *b) {
  int x = *(const int *)a, y = *(const int *)b;
  return (x > y) - (x < y);
}
int main(void) {
  int a[5] = { 1, 6, 11, 16, 21 };
  int key = 21;
  int *r = bsearch(&key, a, 5, sizeof(int), cmp);
  printf("%d\n", r ? (int)(r - a) : -1);
  return 0;
}
