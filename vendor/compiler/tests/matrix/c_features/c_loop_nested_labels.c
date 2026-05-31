/* Nested loops with labelled break-via-goto. */
#include <stdio.h>
int main(void) {
  int target_row = -1, target_col = -1;
  int matrix[3][3] = { {1,2,3}, {4,5,6}, {7,8,9} };
  for (int i = 0; i < 3; i++)
    for (int j = 0; j < 3; j++)
      if (matrix[i][j] == 5) { target_row = i; target_col = j; goto found; }
found:
  printf("%d %d\n", target_row, target_col);
  return 0;
}
