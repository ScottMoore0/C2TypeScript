/* Macro: max. */
#include <stdio.h>
#define MAX(a,b) ((a)>(b)?(a):(b))
int main(void) {
  printf("%d\n", MAX(3, 7));
  return 0;
}
