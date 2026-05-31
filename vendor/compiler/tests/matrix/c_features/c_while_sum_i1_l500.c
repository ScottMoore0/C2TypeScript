/* while loop sum from 1 to 500. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 1;
  while (i < 500) { s += i; i++; }
  printf("%ld\n", s);
  return 0;
}
