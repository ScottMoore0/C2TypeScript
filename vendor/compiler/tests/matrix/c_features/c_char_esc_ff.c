/* Char escape: formfeed. */
#include <stdio.h>
int main(void) {
  char c = '\\f';
  printf("%d\n", (int)(unsigned char)c);
  return 0;
}
