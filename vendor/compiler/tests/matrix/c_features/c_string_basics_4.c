/* String operation 4: building a 4-char string and measuring length. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[16];
  for (int i = 0; i < 4; i++) buf[i] = 'a' + i;
  buf[4] = 0;
  printf("%s len=%zu\n", buf, strlen(buf));
  return 0;
}
