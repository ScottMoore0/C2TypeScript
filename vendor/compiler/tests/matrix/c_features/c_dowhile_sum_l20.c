/* do-while loop sum to 20. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 0;
  do { s += i; i++; } while (i < 20);
  printf("%ld\n", s);
  return 0;
}
