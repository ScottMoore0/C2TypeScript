/* Nested 3-loop 2x2x3. */
#include <stdio.h>
int main(void) {
  int total = 0;
  for (int i = 0; i < 2; i++)
    for (int j = 0; j < 2; j++)
      for (int k = 0; k < 3; k++)
        total += i * 100 + j * 10 + k;
  printf("%d\n", total);
  return 0;
}
