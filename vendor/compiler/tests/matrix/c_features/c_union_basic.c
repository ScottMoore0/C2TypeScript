/* C17 §6.7.2.1 — union basic usage. */
#include <stdio.h>
#include <string.h>
union U { int i; float f; char bytes[4]; };
int main(void) {
  union U u;
  u.i = 0x41424344;
  printf("%x\n", u.i);
  return 0;
}
