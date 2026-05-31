/* min for i in [10, 20). */
#include <stdio.h>
int main(void) {
  long acc = (long)0x7FFFFFFFL;
  for (long i = 10; i < 20; i++) if ((long)i < acc) acc = (long)i;
  printf("%ld\n", acc);
  return 0;
}
