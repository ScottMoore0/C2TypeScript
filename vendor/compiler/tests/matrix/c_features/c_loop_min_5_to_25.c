/* min for i in [5, 25). */
#include <stdio.h>
int main(void) {
  long acc = (long)0x7FFFFFFFL;
  for (long i = 5; i < 25; i++) if ((long)i < acc) acc = (long)i;
  printf("%ld\n", acc);
  return 0;
}
