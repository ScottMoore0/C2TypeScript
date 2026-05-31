/* Longest run of identical consecutive values. */
#include <stdio.h>
int main(void) {
  int a[] = { 1, 1, 2, 2, 2, 3, 1, 4, 4, 4, 4 };
  int n = 11, best = 0, cur = 1;
  for (int i = 1; i < n; i++) {
    cur = (a[i] == a[i-1]) ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  printf("%d\n", best);
  return 0;
}
