/* End-to-end program: c_program_grid_total. */

#include <stdio.h>
int main(void) {
  int g[8][8];
  for (int i = 0; i < 8; i++)
    for (int j = 0; j < 8; j++)
      g[i][j] = (i + j) % 7;
  int s = 0;
  for (int i = 0; i < 8; i++)
    for (int j = 0; j < 8; j++)
      s += g[i][j];
  printf("%d\n", s);
  return 0;
}
