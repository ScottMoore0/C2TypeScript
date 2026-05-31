/* Sort 5-element array. */
#include <stdio.h>
int main(void) {
  int a[5] = { 3, 1, 4, 1, 5 };
  for (int i = 0; i < 5 - 1; i++)
    for (int j = 0; j < 5 - 1 - i; j++)
      if (a[j] > a[j+1]) { int t = a[j]; a[j] = a[j+1]; a[j+1] = t; }
  for (int i = 0; i < 5; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
