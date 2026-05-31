/* Union size = max of members (at least). */
#include <stdio.h>
union U { int i; double d; char buf[16]; };
int main(void) {
  printf("%zu\n", sizeof(union U) >= 16 ? 1 : 0);
  return 0;
}
