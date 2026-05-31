/* printf format: hhx. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  unsigned char v = 0xABu;
  printf("%hhx" "\n", v);
  return 0;
}
