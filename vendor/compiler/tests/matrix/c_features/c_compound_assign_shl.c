/* C17 §6.5.16.2 — compound assignment <<=. */
#include <stdio.h>
int main(void) {
  unsigned int x = 1;
  x <<= 1; x <<= 2; x <<= 3;
  printf("%u\n", x);
  return 0;
}
