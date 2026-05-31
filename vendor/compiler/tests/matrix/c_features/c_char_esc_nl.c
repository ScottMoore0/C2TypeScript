/* Char escape: newline. */
#include <stdio.h>
int main(void) {
  char c = '\\n';
  printf("%d\n", (int)(unsigned char)c);
  return 0;
}
