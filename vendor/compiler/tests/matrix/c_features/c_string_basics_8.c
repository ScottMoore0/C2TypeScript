/* String operation 8: building a 8-char string and measuring length. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[16];
  for (int i = 0; i < 8; i++) buf[i] = 'a' + i;
  buf[8] = 0;
  printf("%s len=%zu\n", buf, strlen(buf));
  return 0;
}
