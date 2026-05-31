/* Struct with single FAM (size of FAM portion is 0 in sizeof). */
#include <stdio.h>
struct H { int len; int items[]; };
int main(void) {
  printf("%zu\n", sizeof(struct H));
  return 0;
}
