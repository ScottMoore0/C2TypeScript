/* Algorithm: max_diff_pair. */
#include <stdio.h>
int main(void) {
  int a[] = { 5, 3, 9, 1, 7, 2, 8 };
  int best = 0;
  for (int i = 0; i < 7; i++)
    for (int j = i + 1; j < 7; j++) {
      int d = a[j] - a[i];
      if (d > best) best = d;
    }
  printf("%d\n", best);
  return 0;
}
