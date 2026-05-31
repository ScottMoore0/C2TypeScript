/* while loop sum from 5 to 50. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 5;
  while (i < 50) { s += i; i++; }
  printf("%ld\n", s);
  return 0;
}
