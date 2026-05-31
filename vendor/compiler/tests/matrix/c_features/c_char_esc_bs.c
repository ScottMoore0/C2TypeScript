/* Char escape: backslash. */
#include <stdio.h>
int main(void) {
  char c = '\\\\';
  printf("%d\n", (int)(unsigned char)c);
  return 0;
}
