/* sprintf with multiple specifiers. */
#include <stdio.h>
int main(void) {
  char buf[64];
  sprintf(buf, "%05d-%s-%.2f", 7, "abc", 3.14);
  printf("%s\n", buf);
  return 0;
}
