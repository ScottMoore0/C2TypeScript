/* Nested 3-loop 2x3x2. */
#include <stdio.h>
int main(void) {
  int total = 0;
  for (int i = 0; i < 2; i++)
    for (int j = 0; j < 3; j++)
      for (int k = 0; k < 2; k++)
        total += i * 100 + j * 10 + k;
  printf("%d\n", total);
  return 0;
}
