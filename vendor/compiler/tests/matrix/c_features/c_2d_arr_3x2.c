/* 2D array 3x2. */
#include <stdio.h>
int main(void) {
  int a[3][2];
  for (int i = 0; i < 3; i++)
    for (int j = 0; j < 2; j++)
      a[i][j] = i * 10 + j;
  long s = 0;
  for (int i = 0; i < 3; i++)
    for (int j = 0; j < 2; j++)
      s += a[i][j];
  printf("%ld\n", s);
  return 0;
}
