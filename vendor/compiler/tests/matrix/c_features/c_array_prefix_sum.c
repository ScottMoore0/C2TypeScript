/* Prefix sums. */
#include <stdio.h>
int main(void) {
  int a[] = { 1, 2, 3, 4, 5, 6, 7, 8 };
  int sums[9];
  sums[0] = 0;
  for (int i = 0; i < 8; i++) sums[i+1] = sums[i] + a[i];
  for (int i = 0; i <= 8; i++) printf("%d ", sums[i]);
  printf("\n");
  return 0;
}
