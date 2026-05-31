/* Macro: abs. */
#include <stdio.h>
#define MABS(x) ((x)<0?-(x):(x))
int main(void) {
  printf("%d\n", MABS(-7));
  return 0;
}
