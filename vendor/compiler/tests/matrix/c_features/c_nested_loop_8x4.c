/* Nested loop sum: 8x4. */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 0; i < 8; i++)
    for (int j = 0; j < 4; j++)
      s += i * j;
  printf("%d\n", s);
  return 0;
}
