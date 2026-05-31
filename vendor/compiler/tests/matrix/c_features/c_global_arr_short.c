/* Global array of short. */
#include <stdio.h>
short g[] = {100, 200, 300, 400};
int main(void) {
  for (int i = 0; i < 4; i++) printf("%d ", g[i]);
  printf("\n");
  return 0;
}
