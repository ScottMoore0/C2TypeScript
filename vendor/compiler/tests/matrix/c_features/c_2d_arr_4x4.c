/* 2D array 4x4. */
#include <stdio.h>
int main(void) {
  int a[4][4];
  for (int i = 0; i < 4; i++)
    for (int j = 0; j < 4; j++)
      a[i][j] = i * 10 + j;
  long s = 0;
  for (int i = 0; i < 4; i++)
    for (int j = 0; j < 4; j++)
      s += a[i][j];
  printf("%ld\n", s);
  return 0;
}
