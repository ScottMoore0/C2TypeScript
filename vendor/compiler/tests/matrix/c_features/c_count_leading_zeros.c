/* Count leading zeros (manual). */
#include <stdio.h>
int clz_manual(unsigned x) {
  if (x == 0) return 32;
  int c = 0;
  while (!(x & 0x80000000u)) { c++; x <<= 1; }
  return c;
}
int main(void) {
  printf("%d %d %d %d\n", clz_manual(1u), clz_manual(0x80u), clz_manual(0x80000000u), clz_manual(0xFFFFu));
  return 0;
}
