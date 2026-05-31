/* Nested loop sum: 10x10. */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 0; i < 10; i++)
    for (int j = 0; j < 10; j++)
      s += i * j;
  printf("%d\n", s);
  return 0;
}
