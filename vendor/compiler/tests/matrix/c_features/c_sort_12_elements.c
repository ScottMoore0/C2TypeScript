/* Sort 12-element array. */
#include <stdio.h>
int main(void) {
  int a[12] = { 3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8 };
  for (int i = 0; i < 12 - 1; i++)
    for (int j = 0; j < 12 - 1 - i; j++)
      if (a[j] > a[j+1]) { int t = a[j]; a[j] = a[j+1]; a[j+1] = t; }
  for (int i = 0; i < 12; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
