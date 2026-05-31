/* printf %d %u %f. */
#include <stdio.h>
int main(void) {
  printf("%d %u %.2f\n", -100, 1000000u, -3.7);
  return 0;
}
