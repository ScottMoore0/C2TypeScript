/* printf %d %u %f. */
#include <stdio.h>
int main(void) {
  printf("%d %u %.2f\n", -100, 65535u, 0.0);
  return 0;
}
