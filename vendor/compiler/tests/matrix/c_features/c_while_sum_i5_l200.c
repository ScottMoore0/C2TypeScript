/* while loop sum from 5 to 200. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 5;
  while (i < 200) { s += i; i++; }
  printf("%ld\n", s);
  return 0;
}
