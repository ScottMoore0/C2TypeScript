/* Convert int to hex string manually. */
#include <stdio.h>
int main(void) {
  unsigned int x = 0xDEAD;
  char buf[9];
  for (int i = 0; i < 8; i++) {
    int nib = (x >> ((7 - i) * 4)) & 0xF;
    buf[i] = (char)(nib < 10 ? '0' + nib : 'A' + nib - 10);
  }
  buf[8] = 0;
  printf("%s\n", buf);
  return 0;
}
