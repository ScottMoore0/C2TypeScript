/* Pointer pattern: matrix_offset. */
#include <stdio.h>
int main(void) {
  int matrix[3][3];
  for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) matrix[i][j] = i * 3 + j;
  int *p = &matrix[1][1];
  printf("%d %d %d\n", *p, *(p - 1), *(p + 1));
  return 0;
}
