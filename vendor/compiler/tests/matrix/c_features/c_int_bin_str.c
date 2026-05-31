/* Convert int to binary string. */
#include <stdio.h>
int main(void) {
  unsigned int x = 0xCA5;
  char buf[33];
  for (int i = 0; i < 32; i++) buf[31 - i] = (x & (1u << i)) ? '1' : '0';
  buf[32] = 0;
  printf("%s\n", buf);
  return 0;
}
