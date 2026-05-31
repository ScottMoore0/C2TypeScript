/* while loop sum from 5 to 1000. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 5;
  while (i < 1000) { s += i; i++; }
  printf("%ld\n", s);
  return 0;
}
