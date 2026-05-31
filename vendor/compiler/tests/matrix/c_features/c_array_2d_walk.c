/* 2D array column-major walk. */
#include <stdio.h>
int main(void) {
  int m[3][4] = {
    {1, 2, 3, 4},
    {5, 6, 7, 8},
    {9, 10, 11, 12}
  };
  int sum_col2 = 0;
  for (int i = 0; i < 3; i++) sum_col2 += m[i][2];
  printf("%d\n", sum_col2);
  return 0;
}
