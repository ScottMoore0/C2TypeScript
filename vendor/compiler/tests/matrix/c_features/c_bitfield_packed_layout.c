/* Packed-style bitfield set/clear via masks. */
#include <stdio.h>
int main(void) {
  unsigned int flags = 0;
  flags |= (1u << 3);
  flags |= (1u << 7);
  printf("%u set3=%d set7=%d set5=%d\n", flags,
    (flags & (1u << 3)) ? 1 : 0,
    (flags & (1u << 7)) ? 1 : 0,
    (flags & (1u << 5)) ? 1 : 0);
  return 0;
}
