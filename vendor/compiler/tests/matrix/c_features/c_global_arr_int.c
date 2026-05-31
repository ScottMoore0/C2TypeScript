/* Global array of int. */
#include <stdio.h>
int g[] = {1, 2, 3, 4, 5};
int main(void) {
  for (int i = 0; i < 5; i++) printf("%d ", g[i]);
  printf("\n");
  return 0;
}
