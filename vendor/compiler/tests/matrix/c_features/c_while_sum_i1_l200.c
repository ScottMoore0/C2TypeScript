/* while loop sum from 1 to 200. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 1;
  while (i < 200) { s += i; i++; }
  printf("%ld\n", s);
  return 0;
}
