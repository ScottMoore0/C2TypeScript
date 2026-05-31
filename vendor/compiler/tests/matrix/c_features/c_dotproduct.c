/* Dot product. */
#include <stdio.h>
int main(void) {
  int a[] = { 1, 2, 3 };
  int b[] = { 4, 5, 6 };
  int s = 0;
  for (int i = 0; i < 3; i++) s += a[i] * b[i];
  printf("%d\n", s);
  return 0;
}
