/* Char escape: vtab. */
#include <stdio.h>
int main(void) {
  char c = '\\v';
  printf("%d\n", (int)(unsigned char)c);
  return 0;
}
