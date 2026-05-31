/* Macro: min. */
#include <stdio.h>
#define MIN(a,b) ((a)<(b)?(a):(b))
int main(void) {
  printf("%d\n", MIN(3, 7));
  return 0;
}
