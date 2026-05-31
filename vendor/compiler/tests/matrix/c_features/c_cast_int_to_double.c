/* Cast int → double. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  int src = 42;
  double dst = (double)src;
  printf("%.1f\n", dst);
  return 0;
}
