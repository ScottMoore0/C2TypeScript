/* 2D array 3x5. */
#include <stdio.h>
int main(void) {
  int a[3][5];
  for (int i = 0; i < 3; i++)
    for (int j = 0; j < 5; j++)
      a[i][j] = i * 10 + j;
  long s = 0;
  for (int i = 0; i < 3; i++)
    for (int j = 0; j < 5; j++)
      s += a[i][j];
  printf("%ld\n", s);
  return 0;
}
