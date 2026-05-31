/* extern declaration in same TU. */
#include <stdio.h>
int g = 7;
extern int g;
int main(void) {
  printf("%d\n", g);
  return 0;
}
