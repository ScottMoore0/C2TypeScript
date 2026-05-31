/* do-while loop sum to 50. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 0;
  do { s += i; i++; } while (i < 50);
  printf("%ld\n", s);
  return 0;
}
