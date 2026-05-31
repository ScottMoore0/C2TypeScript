/* max for i in [0, 5). */
#include <stdio.h>
int main(void) {
  long acc = (long)0x80000000L;
  for (long i = 0; i < 5; i++) if ((long)i > acc) acc = (long)i;
  printf("%ld\n", acc);
  return 0;
}
