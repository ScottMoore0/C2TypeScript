/* Nested loop sum: 3x3. */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 0; i < 3; i++)
    for (int j = 0; j < 3; j++)
      s += i * j;
  printf("%d\n", s);
  return 0;
}
