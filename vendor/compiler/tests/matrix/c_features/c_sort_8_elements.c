/* Sort 8-element array. */
#include <stdio.h>
int main(void) {
  int a[8] = { 9, 5, 2, 7, 1, 8, 3, 6 };
  for (int i = 0; i < 8 - 1; i++)
    for (int j = 0; j < 8 - 1 - i; j++)
      if (a[j] > a[j+1]) { int t = a[j]; a[j] = a[j+1]; a[j+1] = t; }
  for (int i = 0; i < 8; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
