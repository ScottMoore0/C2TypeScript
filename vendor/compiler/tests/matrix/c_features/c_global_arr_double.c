/* Global array of double. */
#include <stdio.h>
double g[] = {1.5, 2.5, 3.5};
int main(void) {
  for (int i = 0; i < 3; i++) printf("%.1f ", g[i]);
  printf("\n");
  return 0;
}
