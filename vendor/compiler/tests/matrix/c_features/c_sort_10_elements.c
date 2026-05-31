/* Sort 10-element array. */
#include <stdio.h>
int main(void) {
  int a[10] = { 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 };
  for (int i = 0; i < 10 - 1; i++)
    for (int j = 0; j < 10 - 1 - i; j++)
      if (a[j] > a[j+1]) { int t = a[j]; a[j] = a[j+1]; a[j+1] = t; }
  for (int i = 0; i < 10; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
