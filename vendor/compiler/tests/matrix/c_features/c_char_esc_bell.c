/* Char escape: bell. */
#include <stdio.h>
int main(void) {
  char c = '\\a';
  printf("%d\n", (int)(unsigned char)c);
  return 0;
}
