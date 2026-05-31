/* max for i in [0, 10). */
#include <stdio.h>
int main(void) {
  long acc = (long)0x80000000L;
  for (long i = 0; i < 10; i++) if ((long)i > acc) acc = (long)i;
  printf("%ld\n", acc);
  return 0;
}
