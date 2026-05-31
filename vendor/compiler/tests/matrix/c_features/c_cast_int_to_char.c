/* Cast int → char. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  int src = 65;
  char dst = (char)src;
  printf("%c\n", dst);
  return 0;
}
