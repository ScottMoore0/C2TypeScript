/* while loop sum from 0 to 20. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 0;
  while (i < 20) { s += i; i++; }
  printf("%ld\n", s);
  return 0;
}
