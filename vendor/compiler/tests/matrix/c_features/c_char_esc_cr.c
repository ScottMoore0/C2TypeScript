/* Char escape: cr. */
#include <stdio.h>
int main(void) {
  char c = '\\r';
  printf("%d\n", (int)(unsigned char)c);
  return 0;
}
