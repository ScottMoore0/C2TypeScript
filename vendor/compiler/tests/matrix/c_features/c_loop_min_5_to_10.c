/* min for i in [5, 10). */
#include <stdio.h>
int main(void) {
  long acc = (long)0x7FFFFFFFL;
  for (long i = 5; i < 10; i++) if ((long)i < acc) acc = (long)i;
  printf("%ld\n", acc);
  return 0;
}
