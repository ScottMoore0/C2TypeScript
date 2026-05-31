/* String operation 10: building a 10-char string and measuring length. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[16];
  for (int i = 0; i < 10; i++) buf[i] = 'a' + i;
  buf[10] = 0;
  printf("%s len=%zu\n", buf, strlen(buf));
  return 0;
}
