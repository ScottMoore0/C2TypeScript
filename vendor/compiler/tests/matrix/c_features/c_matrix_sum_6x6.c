/* 6x6 matrix initialization and row/col sums. */
#include <stdio.h>
int main(void) {
  int m[6][6];
  for (int i = 0; i < 6; i++)
    for (int j = 0; j < 6; j++)
      m[i][j] = i * 6 + j;
  int row0_sum = 0;
  for (int j = 0; j < 6; j++) row0_sum += m[0][j];
  int col0_sum = 0;
  for (int i = 0; i < 6; i++) col0_sum += m[i][0];
  printf("row0=%d col0=%d\n", row0_sum, col0_sum);
  return 0;
}
