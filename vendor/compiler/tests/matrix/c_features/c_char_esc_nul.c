/* Char escape: nul. */
#include <stdio.h>
int main(void) {
  char c = '\\0';
  printf("%d\n", (int)(unsigned char)c);
  return 0;
}
