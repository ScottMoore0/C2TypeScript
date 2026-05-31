/* do-while loop sum to 5. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 0;
  do { s += i; i++; } while (i < 5);
  printf("%ld\n", s);
  return 0;
}
