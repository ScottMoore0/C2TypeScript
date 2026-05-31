/* printf %d %u %f. */
#include <stdio.h>
int main(void) {
  printf("%d %u %.2f\n", -100, 100u, 0.0);
  return 0;
}
