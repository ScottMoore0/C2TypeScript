/* String operation 6: building a 6-char string and measuring length. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[16];
  for (int i = 0; i < 6; i++) buf[i] = 'a' + i;
  buf[6] = 0;
  printf("%s len=%zu\n", buf, strlen(buf));
  return 0;
}
