/* while loop sum from 0 to 50. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 0;
  while (i < 50) { s += i; i++; }
  printf("%ld\n", s);
  return 0;
}
