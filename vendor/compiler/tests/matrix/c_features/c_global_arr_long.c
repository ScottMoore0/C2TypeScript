/* Global array of long. */
#include <stdio.h>
long g[] = {10L, 20L, 30L};
int main(void) {
  for (int i = 0; i < 3; i++) printf("%ld ", g[i]);
  printf("\n");
  return 0;
}
