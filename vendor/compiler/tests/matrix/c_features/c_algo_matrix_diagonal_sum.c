/* Algorithm: matrix_diagonal_sum. */
#include <stdio.h>
int main(void) {
  int m[4][4];
  for (int i = 0; i < 4; i++)
    for (int j = 0; j < 4; j++) m[i][j] = i * 4 + j + 1;
  int s = 0;
  for (int i = 0; i < 4; i++) s += m[i][i];
  printf("%d\n", s);
  return 0;
}
