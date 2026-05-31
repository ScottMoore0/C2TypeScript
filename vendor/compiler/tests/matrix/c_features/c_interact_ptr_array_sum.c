/* Interaction: ptr_array_sum. */
#include <stdio.h>

int main(void) {
  int a[100];
  for (int i = 0; i < 100; i++) a[i] = i;
  int *p = a;
  int sum = 0;
  for (int i = 0; i < 100; i++) sum += *(p + i);
  printf("%d\n", sum);
  return 0;
}

