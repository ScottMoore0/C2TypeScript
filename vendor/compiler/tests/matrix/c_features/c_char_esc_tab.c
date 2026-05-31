/* Char escape: tab. */
#include <stdio.h>
int main(void) {
  char c = '\\t';
  printf("%d\n", (int)(unsigned char)c);
  return 0;
}
