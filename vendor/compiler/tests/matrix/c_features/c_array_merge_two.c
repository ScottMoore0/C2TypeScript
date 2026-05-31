/* Merge two sorted arrays. */
#include <stdio.h>
int main(void) {
  int a[] = { 1, 3, 5, 7, 9 };
  int b[] = { 2, 4, 6, 8, 10 };
  int out[10];
  int i = 0, j = 0, k = 0;
  while (i < 5 && j < 5) {
    if (a[i] <= b[j]) out[k++] = a[i++];
    else out[k++] = b[j++];
  }
  while (i < 5) out[k++] = a[i++];
  while (j < 5) out[k++] = b[j++];
  for (int x = 0; x < 10; x++) printf("%d ", out[x]);
  printf("\n");
  return 0;
}
